const variants = {
  primary: 'bg-[#0b3558] hover:bg-[#07233b] text-white border-[#0b3558] shadow-xs',
  gold: 'bg-[#b37d14] hover:bg-[#976508] text-white border-[#b37d14] shadow-xs',
  secondary: 'bg-white hover:bg-[#fbf5ea] text-slate-700 border-slate-300 shadow-xs',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-xs',
  warning: 'bg-[#b37d14] hover:bg-[#976508] text-white border-[#b37d14] shadow-xs',
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
