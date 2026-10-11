export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#071426] to-[#0D2440] text-[#E0BD55] shadow-2xs">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#071426] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs font-semibold text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
