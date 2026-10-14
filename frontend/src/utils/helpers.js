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

export function formatNumber(value, digits = 3) {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0'
  try {
    return n.toLocaleString('en-IN', { maximumFractionDigits: digits })
  } catch {
    return String(n)
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

export function resolveCompanyLogo(company) {
  if (!company) return '/logos/laxmi_traders_transparent.png'
  if (company.logo_transparent_path) return company.logo_transparent_path
  if (company.logo_path) return company.logo_path
  const idStr = `${company.slug || ''} ${company.code || ''} ${company.company_name || ''} ${company.short_name || ''}`.toLowerCase()
  if (idStr.includes('sm') || idStr.includes('s m')) return '/logos/sm_traders_transparent.png'
  if (idStr.includes('feed') || idStr.includes('shriee') || idStr.includes('shree')) return '/logos/shree_feeds_transparent.png'
  return '/logos/laxmi_traders_transparent.png'
}

