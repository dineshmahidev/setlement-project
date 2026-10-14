import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ChevronRight, ShieldCheck } from 'lucide-react'

export default function Navbar({ onOpenEnquiry }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const NAV_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Our Businesses', to: '/our-businesses' },
    { label: 'Products & Services', to: '/products-services' },
    { label: 'Our Presence', to: '/our-presence' },
    { label: 'Contact', to: '/contact' },
  ]

  return (
    <>
      {/* Floating Navbar Container with Top, Left & Right Margins */}
      <header className="fixed top-3 sm:top-4 inset-x-0 z-50 px-3 sm:px-6 lg:px-8 transition-all duration-300">
        <div
          className={`max-w-7xl mx-auto rounded-2xl px-3.5 sm:px-6 py-2 sm:py-2.5 transition-all duration-300 navbar-floating-gradient ${
            scrolled
              ? 'shadow-xl shadow-emerald-950/20 border border-emerald-900/30 ring-1 ring-emerald-900/10'
              : 'shadow-lg shadow-emerald-950/10 border border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Horizontal Corporate Brand Logo */}
            <Link to="/" className="flex items-center group shrink-0 pl-1">
              <img
                src="/images/laxmi_horizontal_logo.jpg"
                alt="Laxmi Group Agro Traders & Feeds"
                className="h-10 sm:h-12 w-auto object-contain rounded-md transition-transform group-hover:scale-102 drop-shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = '/logos/laxmi_traders_transparent.png'
                }}
              />
            </Link>

            {/* Desktop Nav Links (Clean readable typography over airy light-green gradient) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                      isActive
                        ? 'text-[#02492a] bg-white border border-emerald-300/80 shadow-xs font-black'
                        : 'text-slate-800 hover:text-[#02492a] hover:bg-white/70'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right CTAs */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link
                to="/panel/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-slate-800 text-xs font-extrabold hover:border-[#C9A227] hover:text-[#0B1A2D] shadow-2xs transition-all"
                title="Management App Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Staff Portal</span>
              </Link>

              <button
                onClick={onOpenEnquiry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] hover:from-[#E0BD55] hover:to-[#C9A227] text-slate-950 text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="font-extrabold">Enquire</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>

            {/* Mobile Button & Hamburger Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={onOpenEnquiry}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-[11px] font-black text-slate-950 uppercase tracking-wider shadow-xs hover:scale-105 active:scale-95 transition-all"
              >
                Enquire
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white shadow-2xs transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-2xl z-50 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <img
                  src="/images/laxmi_horizontal_logo.jpg"
                  alt="Laxmi Group Logo"
                  className="h-10 w-auto object-contain rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = '/logos/laxmi_traders_transparent.png'
                  }}
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-black hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col space-y-1">
                {NAV_LINKS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-[#02492a] border border-emerald-200 font-black'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#02492a]" />
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenEnquiry()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#02492a] to-[#046e3d] text-white font-extrabold text-sm uppercase tracking-wider shadow-md hover:scale-102 transition-all cursor-pointer"
              >
                <span>Enquire Now</span>
                <ChevronRight className="w-4 h-4 text-[#E0BD55]" />
              </button>

              <Link
                to="/panel/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-extrabold text-xs hover:border-[#C9A227] hover:text-[#0B1A2D] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
                <span>Staff Portal Access</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

