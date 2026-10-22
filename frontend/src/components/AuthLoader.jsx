/**
 * Full-screen branded session loader shown while AuthContext bootstraps
 * (token refresh / company resolution). Lavender + lime theme with dual
 * spinning rings, pulsing logo chip, shimmer bar and bouncing dots.
 */
export default function AuthLoader({ label = 'Authenticating session…' }) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EADFFF] via-[#F7F2FF] to-[#E3D6FF]">
      {/* soft glow blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-lime-300/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl animate-pulse [animation-delay:600ms]" />

      <div className="relative flex flex-col items-center gap-6">
        {/* dual spinning rings + logo core */}
        <div className="relative h-28 w-28">
          <div className="absolute inset-0 rounded-full border-[3px] border-violet-200 border-t-violet-500 animate-spin [animation-duration:1.1s]" />
          <div className="absolute inset-2.5 rounded-full border-[3px] border-lime-200 border-b-lime-400 animate-spin [animation-duration:0.9s] [animation-direction:reverse]" />
          <div className="absolute inset-5 flex items-center justify-center rounded-2xl bg-[#14151C] shadow-lg shadow-violet-300/40 animate-auth-logo">
            <span className="text-2xl font-black tracking-tight text-[#C6F432]">L</span>
          </div>
        </div>

        {/* brand */}
        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
            SHRIEE LAXMI GROUP
            <span className="rounded-md bg-[#C6F432] px-1.5 py-0.5 text-[9px] font-black text-slate-950 uppercase">Panel</span>
          </h1>
          <p className="mt-1.5 text-xs font-semibold text-slate-500">{label}</p>
        </div>

        {/* shimmer progress bar */}
        <div className="h-1.5 w-52 overflow-hidden rounded-full bg-white/70 shadow-inner">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-400 via-[#C6F432] to-violet-400 animate-auth-shimmer" />
        </div>

        {/* bouncing dots */}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-900/70 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-lime-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
