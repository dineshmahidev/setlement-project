import EmptyState from './EmptyState'
import Spinner from './Spinner'

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white ${className}`}>
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  )
}

export function THead({ columns }) {
  return (
    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
      <tr>
        {columns.map((c, i) => (
          <th
            key={c.key || i}
            className={`px-3 py-2.5 font-medium ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''}`}
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

export function Tr({ children, onClick }) {
  return (
    <tr className={`text-slate-700 ${onClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/60'}`} onClick={onClick}>
      {children}
    </tr>
  )
}

export function Td({ children, className = '', align = 'left' }) {
  return (
    <td className={`px-3 py-2.5 text-sm ${align === 'right' ? 'text-right tabular-nums' : ''} ${className}`}>
      {children ?? '—'}
    </td>
  )
}

export function DataTable({ columns, rows, loading, emptyTitle, emptyMessage, onRowClick, rowKey = 'id', actions }) {
  if (loading) {
    return (
      <div className="flex justify-center py-14">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    )
  }

  const cols = actions ? [...columns, { key: '_actions', label: 'Actions', align: 'right', className: actions.alignClass }] : columns

  return (
    <Table>
      <THead columns={cols} />
      <TBody>
        {rows.map((row, idx) => (
          <Tr key={row[rowKey] ?? idx} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((c, i) => (
              <Td key={c.key || i} align={c.align} className={c.cellClassName}>
                {c.render ? c.render(row, idx) : row[c.key]}
              </Td>
            ))}
            {actions && (
              <Td align="right">
                <div className="flex flex-wrap items-center justify-end gap-1.5">{actions.render(row)}</div>
              </Td>
            )}
          </Tr>
        ))}
      </TBody>
    </Table>
  )
}
