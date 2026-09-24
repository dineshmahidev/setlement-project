const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
}

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
