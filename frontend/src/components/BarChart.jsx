export default function BarChart({
  data = [],
  labelKey = 'label',
  valueKey = 'value',
  series,
  height = 160,
  color = '#059669',
  formatValue = (v) => v,
}) {
  if (!data.length) {
    return <p className="py-6 text-center text-sm text-slate-400">No chart data</p>
  }

  const max = Math.max(
    1,
    ...data.flatMap((d) =>
      series ? series.map((s) => Number(d[s.key] || 0)) : [Number(d[valueKey] || 0)],
    ),
  )

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const values = series ? series.map((s) => Number(d[s.key] || 0)) : [Number(d[valueKey] || 0)]
          const colors = series ? series.map((s) => s.color || color) : [color]
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5" title={`${d[labelKey]}: ${values.map(formatValue).join(', ')}`}>
              <div className="flex w-full items-end justify-center gap-0.5" style={{ height: height - 22 }}>
                {values.map((v, vi) => (
                  <div
                    key={vi}
                    className="w-full max-w-[18px] rounded-t"
                    style={{
                      height: `${Math.max(2, (v / max) * 100)}%`,
                      background: colors[vi],
                      minHeight: 2,
                    }}
                  />
                ))}
              </div>
              <span className="truncate text-[10px] text-slate-500">{d[labelKey]}</span>
            </div>
          )
        })}
      </div>
      {series && (
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm" style={{ background: s.color || color }} />
              {s.label || s.key}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
