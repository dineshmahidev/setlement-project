export function formatMoney(value, currency = 'INR') {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0.00'
  try {
    return n.toLocaleString('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  } catch {
    return `₹${n.toFixed(2)}`
  }
}

export function formatNumber(value, digits = 3, minDigits = null) {
  const n = Number(value || 0)
  const maxD = typeof digits === 'number' ? digits : 3
  const minD = typeof minDigits === 'number' ? minDigits : (maxD === 0 ? 0 : 3)
  if (Number.isNaN(n)) return (0).toFixed(minD)
  try {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: minD,
      maximumFractionDigits: maxD,
    })
  } catch {
    return n.toFixed(minD)
  }
}

export function formatDate(value) {
  if (!value) return '—'
  if (typeof value === 'string') {
    const clean = value.trim()
    // Standard YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-')
      return `${d}/${m}/${y}`
    }
    // YYYY-MM-DD HH:MM:SS or ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const parts = clean.split('T')[0].split(' ')[0].split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
  }
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('en-GB')
  } catch {
    return String(value || '—')
  }
}

export function formatDateTime(value) {
  if (!value) return '—'
  try {
    const str = typeof value === 'string' ? value.replace(' ', 'T') : value
    const d = new Date(str)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return String(value || '—')
  }
}

export function today() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthStart() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

export function extractList(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data?.data)) return res.data.data
  if (Array.isArray(res.data?.data?.roles)) return res.data.data.roles
  if (Array.isArray(res.data?.roles)) return res.data.roles
  if (Array.isArray(res.data?.data?.branches)) return res.data.data.branches
  if (Array.isArray(res.data?.branches)) return res.data.branches
  if (Array.isArray(res.data?.data?.data)) return res.data.data.data
  if (Array.isArray(res.data?.items)) return res.data.items
  if (Array.isArray(res.items)) return res.items
  return []
}

export function qs(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, v)
  })
  const s = search.toString()
  return s ? `?${s}` : ''
}

export function toBool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true') return true
  if (v === false || v === 0 || v === '0' || v === 'false') return false
  return Boolean(v)
}

export function groupBy(arr, key) {
  return (arr || []).reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

export function pick(obj, keys) {
  const out = {}
  keys.forEach((k) => {
    if (obj && obj[k] !== undefined) out[k] = obj[k]
  })
  return out
}

/** Company logo URL from the DB/backend only. Returns null when the company
 *  has no uploaded logo (or the "show logo on website" toggle is off) so
 *  callers can render initials instead of guessing a hardcoded file path. */
export function resolveCompanyLogo(company) {
  if (!company) return null
  if (company.show_logo_website === false) return null
  return company.logo_transparent_path || company.logo_path || null
}

/** Raw logo path ignoring the website visibility toggle (used by admin master
 *  grids where the stored asset itself must stay visible). */
export function storedLogoPath(company) {
  if (!company) return null
  return company.logo_transparent_path || company.logo_path || null
}

/** Normalises a DB-stored logo value into a usable src (absolute paths and
 *  data URIs pass through, relative uploads get a leading slash). */
export function logoSrc(path) {
  if (!path) return null
  if (path.startsWith('/') || path.startsWith('data:') || path.startsWith('http')) return path
  return `/${path}`
}

/** Initials used when the logo is hidden — first letter of the first two
 *  words of the company name ("Laxmi Traders" → "LT"). Mirrors the backend
 *  Company::getLogoInitialsAttribute. */
export function companyInitials(company) {
  const name = (company?.company_name || company?.short_name || '').trim()
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return 'CO'
}

