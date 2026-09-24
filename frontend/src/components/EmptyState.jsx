export default function EmptyState({ title = 'No data', message = 'Nothing to show here yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-14 text-center">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
        ∅
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  )
}
