import axios from 'axios'

const PRODUCTION_API = 'https://api.shrieelaxmi.in/api'

function trimSlash(url) {
  return String(url || '').trim().replace(/\/+$/, '')
}

function isLocalHostname(hostname) {
  if (!hostname) return true
  if (['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(hostname)) return true
  if (hostname.endsWith('.local')) return true
  return /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
}

function resolveBaseUrl() {
  const forced = trimSlash(import.meta.env.VITE_API_BASE_URL)
  if (forced) return forced

  const hostname = typeof window === 'undefined' ? '' : window.location.hostname
  const local = isLocalHostname(hostname)

  // Dev server proxies /api -> local Laravel (see vite.config.js)
  if (import.meta.env.DEV && local) return '/api'

  if (local) {
    const localBase = trimSlash(import.meta.env.VITE_LOCAL_API_URL)
    if (localBase) return localBase
    return `http://${hostname || '127.0.0.1'}:8001/api`
  }

  return PRODUCTION_API
}

export const API_BASE = resolveBaseUrl()

const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
})

export function getToken() {
  return localStorage.getItem('token')
}

export function getCompanyId() {
  return localStorage.getItem('company_id')
}

export function setCompanyId(companyId) {
  if (companyId) localStorage.setItem('company_id', String(companyId))
  else localStorage.removeItem('company_id')
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

function companyHeaders() {
  const headers = {}
  const branchId = localStorage.getItem('branch_id')
  const companyId = getCompanyId()
  if (branchId) headers['X-Branch-Id'] = branchId
  if (companyId) headers['X-Company-Id'] = companyId
  return headers
}

/** Headers every API call must carry (auth + company + branch scope). */
export function requestHeaders(extra = {}) {
  const headers = { ...companyHeaders(), ...extra }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  Object.assign(config.headers, companyHeaders())
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      setToken(null)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data
  if (data?.message) return data.message
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first)) return first[0]
    return String(first)
  }
  if (error?.message === 'Network Error') return 'Cannot reach server. Is the backend running?'
  return error?.message || fallback
}

export function apiUrl(path) {
  const p = String(path || '')
  if (/^https?:\/\//i.test(p)) return p
  const base = API_BASE.replace(/\/+$/, '')
  const rest = p.startsWith('/') ? p : `/${p}`
  // Tolerate callers that already prefix "/api"
  const basePath = base.slice(base.lastIndexOf('/'))
  const stripped = rest === basePath ? '' : rest.startsWith(`${basePath}/`) ? rest.slice(basePath.length) : rest
  return `${base}${stripped}`
}

function filenameFromResponse(res, fallback) {
  const cd = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition']
  if (cd) {
    const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cd)
    if (star) {
      try {
        return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''))
      } catch {
        /* fall through */
      }
    }
    const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(cd)
    if (plain) return plain[1].trim()
  }
  return fallback
}

function ensurePdfExt(name) {
  const n = (name || 'document.pdf').trim().replace(/^"|"$/g, '')
  return /\.pdf$/i.test(n) ? n : `${n}.pdf`
}

function safeFilename(name) {
  const raw = (name || 'download').trim().replace(/^"|"$/g, '') || 'download'
  return raw.replace(/[\\/:*?"<>|]+/g, '-')
}

function saveBlob(blob, filename, forcePdf = false) {
  let name = safeFilename(filename)
  if (forcePdf) name = ensurePdfExt(name)
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = name
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Delay revoke so Chrome can finish writing the file
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(blobUrl)
  }, 30000)
}

async function fetchBlob(path) {
  const res = await axios.get(apiUrl(path), {
    headers: requestHeaders(),
    responseType: 'blob',
    timeout: 60000,
  })
  const type = String(res.data?.type || '')
  if (type.includes('html') || type.startsWith('text/html')) {
    throw new Error('Server returned HTML instead of a file. Check the download URL.')
  }
  if (res.data instanceof Blob && res.data.size > 0) {
    const head = new TextDecoder().decode(await res.data.slice(0, 5).arrayBuffer())
    if (head.startsWith('<') || head.startsWith('<!')) {
      throw new Error('Server returned HTML instead of a file. Check the download URL.')
    }
    if (/pdf/i.test(String(res.headers?.['content-type'] || type)) && !head.startsWith('%PDF')) {
      throw new Error('Received file is not a valid PDF.')
    }
  } else if (res.data instanceof Blob && res.data.size === 0) {
    throw new Error('Empty file received from server.')
  }
  return res
}

/** View PDF in a new tab. Blob stays alive so Chrome's viewer can Save. */
export async function openPdf(path, fallbackName = 'document.pdf') {
  try {
    const res = await fetchBlob(path)
    const name = ensurePdfExt(safeFilename(filenameFromResponse(res, fallbackName)))
    const type = res.data?.type || 'application/pdf'
    const blob =
      type.includes('pdf') || type === 'application/octet-stream' || !type
        ? new Blob([res.data], { type: 'application/pdf' })
        : res.data
    // Keep blob URL for the session — revoking breaks Chrome PDF "Download"
    const blobUrl = URL.createObjectURL(blob)
    const win = window.open(blobUrl, '_blank')
    if (!win) {
      // Popup blocked → fall back to download
      saveBlob(blob, name, true)
      URL.revokeObjectURL(blobUrl)
    }
    // Revoke when the app unloads / navigates away
    window.addEventListener(
      'beforeunload',
      () => {
        try {
          URL.revokeObjectURL(blobUrl)
        } catch {
          /* noop */
        }
      },
      { once: true },
    )
  } catch (err) {
    const msg = apiErrorMessage(err, 'Failed to load PDF')
    alert(msg)
    throw err
  }
}

/** Force-download a file from the API (CSV / Excel / PDF). */
export async function downloadFile(path, filename) {
  const res = await fetchBlob(path)
  // Prefer Content-Disposition (unique server name), then caller filename
  const name = filenameFromResponse(res, '') || filename || 'download'
  let blob = res.data
  if (!blob || blob.type === '') {
    blob = new Blob([res.data], {
      type: path.includes('format=pdf') || /\.pdf/i.test(name) ? 'application/pdf' : 'text/csv',
    })
  }
  saveBlob(blob, name, false)
}

/** Explicit PDF download with server filename. */
export async function downloadPdf(path, fallbackName = 'document.pdf') {
  const res = await fetchBlob(path)
  const name = ensurePdfExt(safeFilename(filenameFromResponse(res, fallbackName)))
  const blob = new Blob([res.data], { type: 'application/pdf' })
  saveBlob(blob, name, true)
}

export default api
