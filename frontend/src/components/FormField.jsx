export function FormField({ label, required, children, hint, className = '', show = true }) {
  if (show === false) return null
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50'

export function Input({ className = '', ...props }) {
  return <input className={`${inputCls} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputCls} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea rows={rows} className={`${inputCls} ${className}`} {...props} />
}

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-slate-700 ${className}`}>
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" {...props} />
      {label && <span>{label}</span>}
    </label>
  )
}

export function Radio({ label, ...props }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input type="radio" className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" {...props} />
      {label && <span>{label}</span>}
    </label>
  )
}
