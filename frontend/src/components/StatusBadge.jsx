const styles = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200 font-bold',
  submitted: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
  pending: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  posted: 'bg-[#071426] text-[#E0BD55] border-[#071426] font-extrabold shadow-2xs',
  active: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 font-bold',
  cancelled: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200 font-semibold',
  archived: 'bg-slate-100 text-slate-600 border-slate-200 font-semibold',
  'out of stock': 'bg-rose-50/90 text-rose-700 border-rose-200/90 font-black shadow-2xs',
  'low stock': 'bg-amber-50/90 text-amber-800 border-amber-300/90 font-black shadow-2xs',
  'in stock': 'bg-emerald-50/90 text-emerald-800 border-emerald-300/90 font-black shadow-2xs',
  available: 'bg-emerald-50/90 text-emerald-800 border-emerald-300/90 font-black shadow-2xs',
}

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>
  const raw = String(status)
  const key = raw.toLowerCase()
  const cls = styles[key] || 'bg-slate-100 text-slate-700 border-slate-200 font-bold'
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}>
      {raw}
    </span>
  )
}
