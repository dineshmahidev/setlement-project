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

export function FormRow({ children, className = '' }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>
}

export const inputCls =
  'w-full rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition-all duration-200 hover:border-[#C9A227] focus:border-[#C9A227] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 disabled:bg-slate-50 disabled:text-slate-400'

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
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#0b3558] focus:ring-[#0b3558]" {...props} />
      {label && <span>{label}</span>}
    </label>
  )
}

export function Radio({ label, ...props }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input type="radio" className="h-4 w-4 border-slate-300 text-[#0b3558] focus:ring-[#0b3558]" {...props} />
      {label && <span>{label}</span>}
    </label>
  )
}

export default FormField
