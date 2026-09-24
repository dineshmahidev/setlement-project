const styles = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-sky-100 text-sky-700 border-sky-200',
  PENDING: 'bg-sky-100 text-sky-700 border-sky-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POSTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-200',
  Normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Low Stock': 'bg-amber-100 text-amber-700 border-amber-200',
  'Out of Stock': 'bg-red-100 text-red-700 border-red-200',
}

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>
  const key = String(status)
  const cls = styles[key] || 'bg-slate-100 text-slate-700 border-slate-200'
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${cls}`}>{key}</span>
  )
}
