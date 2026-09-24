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
    return n.toFixed(2)
  }
}

export function formatNumber(value, digits = 3) {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0'
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits })
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB')
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export function today() {
  return new Date().toISOString().slice(0, 10)
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
