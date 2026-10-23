import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RotateCw, MapPin, Building2, Phone, ShieldCheck } from 'lucide-react'
import { companyInitials, logoSrc } from '../../utils/helpers'

export default function FlipBusinessCard({
  name,
  meaning,
  category,
  logo,
  banner,
  location,
  gstin,
  godowns,
  phone,
  description,
  keyProducts = [],
  link,
  autoFlipDelay = 800,
  autoFlipDuration = 3600,
  enableAutoCycle = true,
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const logoUrl = logoSrc(logo)
  const showLogo = Boolean(logoUrl) && !logoFailed
  const initials = companyInitials({ company_name: name })
  const cardRef = useRef(null)
  const hasAutoFlippedOnScroll = useRef(false)
  const isHovered = useRef(false)
  const userInteracted = useRef(false)
  const manualTimerRef = useRef(null)

  // Auto-flip when scrolling into view + periodic cycle
  useEffect(() => {
    const cardEl = cardRef.current
    if (!cardEl) return

    let cycleInterval = null
    let flipTimeout = null
    let flipBackTimeout = null

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          // 1. Initial scroll trigger: flip when card scrolls into view
          if (!hasAutoFlippedOnScroll.current && !userInteracted.current) {
            hasAutoFlippedOnScroll.current = true

            flipTimeout = setTimeout(() => {
              if (!isHovered.current && !userInteracted.current) {
                setIsFlipped(true)

                // Stay flipped to show back banner, then flip back to front logo
                flipBackTimeout = setTimeout(() => {
                  if (!isHovered.current && !userInteracted.current) {
                    setIsFlipped(false)
                  }
                }, autoFlipDuration)
              }
            }, autoFlipDelay)
          }

          // 2. Periodic subtle cycle
          if (enableAutoCycle && !cycleInterval) {
            cycleInterval = setInterval(() => {
              if (!isHovered.current && !userInteracted.current) {
                setIsFlipped((prev) => !prev)
              }
            }, 11000 + autoFlipDelay)
          }
        } else {
          if (cycleInterval) {
            clearInterval(cycleInterval)
            cycleInterval = null
          }
        }
      },
      { threshold: 0.28, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(cardEl)

    return () => {
      observer.disconnect()
      if (flipTimeout) clearTimeout(flipTimeout)
      if (flipBackTimeout) clearTimeout(flipBackTimeout)
      if (cycleInterval) clearInterval(cycleInterval)
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current)
    }
  }, [autoFlipDelay, autoFlipDuration, enableAutoCycle])

  // Manual flip handler (User click / keyboard)
  const handleFlip = (e) => {
    // If the click came from an internal link, don't flip
    if (e.target.closest('a') && !e.target.closest('.flip-trigger')) {
      return
    }
    // Record user interaction so auto-timer pauses
    userInteracted.current = true
    setIsFlipped((prev) => !prev)

    // After 14 seconds of inactivity, re-enable gentle auto-cycle
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current)
    manualTimerRef.current = setTimeout(() => {
      userInteracted.current = false
    }, 14000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleFlip(e)
    }
  }

  const handleMouseEnter = () => {
    isHovered.current = true
  }

  const handleMouseLeave = () => {
    isHovered.current = false
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 w-full min-h-[500px] sm:min-h-[520px] select-none hover-card-lift"
      tabIndex={0}
      role="button"
      aria-label={`${name} card. Click or press enter to flip between logo and banner`}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`relative w-full h-full min-h-[500px] sm:min-h-[520px] transform-style-3d transition-transform duration-700 ease-in-out rounded-2xl shadow-md hover:shadow-2xl ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ==================================================== */}
        {/* FRONT OF THE CARD: MEANINGFUL LOGO & BRAND DETAILS    */}
        {/* ==================================================== */}
        <div
          onClick={handleFlip}
          className="backface-hidden absolute inset-0 w-full h-full rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between overflow-hidden cursor-pointer group"
        >
          {/* Subtle background decorative aura */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none animate-pulse-glow" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none animate-float-slow" />

          {/* Top Bar: Category badge & Flip Indicator */}
          <div className="flex items-center justify-between relative z-10">
            <span className="rounded-full bg-[#071426] text-[#E0BD55] px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-xs">
              {category}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsFlipped(true)
              }}
              className="flip-trigger flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-[#9A7B1C] border border-amber-200/80 text-[11px] font-bold transition-all shadow-2xs group-hover:scale-105"
              title="Click to flip and view facility banner"
            >
              <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Tap to Flip</span>
            </button>
          </div>

          {/* Center: Meaningful Logo Medallion */}
          <div className="flex flex-col items-center text-center my-auto py-4 relative z-10">
            <div className="relative flex items-center justify-center h-32 w-32 rounded-3xl bg-gradient-to-b from-amber-50/80 via-white to-slate-50 border border-amber-200/60 p-4 shadow-lg group-hover:scale-105 transition-transform duration-500">
              {showLogo ? (
                <img
                  src={logoUrl}
                  alt={`${name} Logo`}
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-4xl font-black text-[#8C6E14]">{initials}</span>
              )}
            </div>

            {/* Meaning Pill */}
            <div className="mt-3.5 inline-flex items-center px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300 text-[#8C6E14] text-[10px] font-extrabold uppercase tracking-wider">
              <span>{meaning}</span>
            </div>

            <h3 className="text-2xl font-black text-[#071426] tracking-tight mt-2.5 group-hover:text-[#9A7B1C] transition-colors">
              {name}
            </h3>

            <p className="text-[11px] text-amber-700 font-bold mt-1">
              {location} • GSTIN: {gstin}
            </p>

            <p className="text-xs text-slate-600 leading-relaxed mt-2.5 line-clamp-3 max-w-xs">
              {description}
            </p>

            {/* Key Products Chips */}
            {keyProducts.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {keyProducts.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Prompt: Tap to flip banner */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 text-amber-600" />
              Click to view facility banner
            </span>
            <span className="text-[11px] font-extrabold text-[#9A7B1C] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Flip Card <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BACK OF THE CARD: BANNER IMAGE & FACILITY DETAILS    */}
        {/* ==================================================== */}
        <div
          onClick={handleFlip}
          className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-6 flex flex-col justify-between text-white cursor-pointer group shadow-xl"
        >
          {/* Full Banner Background Image */}
          <img
            src={banner}
            alt={`${name} Facility Banner`}
            className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 z-0"
          />

          {/* High-Contrast Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/45 z-1" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70 z-1" />

          {/* Top Bar: Floating Logo Chip & Flip Back button */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 shadow-md">
              {showLogo ? (
                <img
                  src={logoUrl}
                  alt={`${name} Small Logo`}
                  className="h-6 w-auto object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-xs font-black text-amber-300">{initials}</span>
              )}
              <span className="text-xs font-black text-white">{name}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsFlipped(false)
              }}
              className="flip-trigger flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-[11px] font-bold transition-all shadow-sm"
              title="Click to flip back to logo"
            >
              <RotateCw className="w-3 h-3 text-amber-300" />
              <span>Flip Front</span>
            </button>
          </div>

          {/* Center Info: Facility, Godowns, GSTIN, Phone */}
          <div className="relative z-10 space-y-3.5 my-auto py-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E0BD55] block">
                {category} • FACILITY OPERATIONS
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                {name}
              </h3>
              <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                {meaning}
              </p>
            </div>

            <div className="space-y-2 bg-black/40 backdrop-blur-md p-3.5 rounded-xl border border-white/10 text-xs">
              <div className="flex items-start gap-2 text-slate-200">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>GSTIN: <strong className="text-white font-mono">{gstin}</strong></span>
              </div>
              {godowns && (
                <div className="flex items-center gap-2 text-slate-200">
                  <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{godowns}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-slate-200">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-mono">{phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions: Explore Business Link */}
          <div className="relative z-10 pt-2 border-t border-white/15">
            <Link
              to={link}
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] hover:from-[#E0BD55] hover:to-[#C9A227] text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
            >
              <span>Explore {name} Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
