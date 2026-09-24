import { useEffect, useState } from 'react'
import Button from './Button'

export default function Pagination({ meta, onPage, onPerPage }) {
  const [size, setSize] = useState(meta?.per_page || 15)

  useEffect(() => {
    if (meta?.per_page) setSize(meta.per_page)
  }, [meta?.per_page])

  if (!meta) return null
  const { current_page = 1, last_page = 1, total = 0, per_page = 15 } = meta
  if (last_page <= 1 && !total) return null

  const from = total === 0 ? 0 : (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-3 py-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <span>
          Showing {from}–{to} of {total}
        </span>
        <select
          value={size}
          onChange={(e) => {
            const v = Number(e.target.value)
            setSize(v)
            onPerPage?.(v)
          }}
          className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs"
        >
          {[15, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" disabled={current_page <= 1} onClick={() => onPage?.(current_page - 1)}>
          Prev
        </Button>
        <span className="px-2 text-xs">
          Page {current_page} of {Math.max(last_page, 1)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={current_page >= last_page}
          onClick={() => onPage?.(current_page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
