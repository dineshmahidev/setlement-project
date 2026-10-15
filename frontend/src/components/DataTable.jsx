import EmptyState from './EmptyState'
import Spinner from './Spinner'

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm ${className}`}>
      <table className="min-w-full text-left text-xs">{children}</table>
    </div>
  )
}

export function THead({ columns }) {
  return (
    <thead className="bg-gradient-to-r from-[#071426] via-[#0D2440] to-[#071426] text-[11px] uppercase tracking-widest text-slate-200 border-b border-slate-800">
      <tr>
        {columns.map((c, i) => (
          <th
            key={c.key || i}
            className={`px-4 py-3.5 font-black text-slate-200 ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''}`}
            style={c.width ? { width: c.width } : undefined}
          >
            {c.label ?? c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function Tr({ children, onClick, className = '' }) {
  return (
    <tr
      className={`text-slate-700 transition-colors duration-150 odd:bg-[#f1f5f9] even:bg-white ${
        onClick ? 'cursor-pointer hover:bg-amber-50/70' : 'hover:bg-amber-50/50'
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className = '', align = 'left' }) {
  return (
    <td className={`px-4 py-3 text-xs font-medium text-slate-700 border-b border-slate-100/80 ${align === 'right' ? 'text-right tabular-nums font-semibold' : ''} ${className}`}>
      {children ?? '—'}
    </td>
  )
}

export function DataTable({ columns, rows, data, loading, emptyTitle, emptyMessage, onRowClick, rowKey = 'id', actions, footer }) {
  const tableRows = rows ?? data ?? []

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <Spinner className="h-8 w-8 text-[#C9A227] mb-2" />
        <span className="text-xs font-semibold text-slate-400">Loading records...</span>
      </div>
    )
  }

  if (!tableRows || tableRows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    )
  }

  const cols = actions ? [...columns, { key: '_actions', label: 'Actions', align: 'right', className: actions.alignClass }] : columns

  return (
    <Table>
      <THead columns={cols} />
      <TBody>
        {tableRows.map((row, idx) => (
          <Tr key={row[rowKey] ?? idx} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((c, i) => (
              <Td key={c.key || i} align={c.align} className={c.cellClassName}>
                {c.render ? c.render(row, idx) : row[c.key]}
              </Td>
            ))}
            {actions && (
              <Td align="right" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-wrap items-center justify-end gap-1.5">{actions.render(row)}</div>
              </Td>
            )}
          </Tr>
        ))}
      </TBody>
      {footer && <tfoot className="border-t-2 border-slate-700 bg-slate-100/90 font-bold">{footer}</tfoot>}
    </Table>
  )
}

export default DataTable
