import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react'

export default function Navbar({ onOpenEnquiry }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const NAV_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Enterprises', to: '/our-businesses' },
    { label: 'Products & Supply', to: '/products-services' },
    { label: 'Network', to: '/our-presence' },
    { label: 'Contact', to: '/contact' },
  ]

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 py-3 sm:py-4 px-3 sm:px-8">
        <div
          className={`max-w-7xl mx-auto rounded-2xl px-4 sm:px-6 py-2.5 transition-all duration-300 border ${
            scrolled
              ? 'bg-[#000000]/90 backdrop-blur-xl border-[#FFD000]/30 shadow-2xl shadow-black/80'
              : 'bg-[#000000]/75 backdrop-blur-md border-white/10 shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative h-11 w-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-[#FFD000] shadow-sm group-hover:scale-105 transition-transform">
                <img
                  src="/logos/shree_laxmi_transparent.png"
                  alt="Shriee Laxmi Group"
                  className="h-full w-full object-contain filter drop-shadow"
                  onError={(e) => {
                    e.currentTarget.src = '/logos/shree_laxmi.png'
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-[#FFD000] transition-colors leading-tight flex items-center gap-1.5">
                  SHRIEE LAXMI
                  <span className="text-[10px] font-black text-black px-1.5 py-0.2 rounded-md bg-[#FFD000]">
                    GROUP
                  </span>
                </span>
                <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase">
                  Agro Commodities & Feeds
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FFD000] text-black font-black shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Action Button (High-Voltage Solid Yellow) */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={onOpenEnquiry}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD000] hover:bg-[#ffe14d] text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FFD000]/25 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Initiate Trade</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform stroke-[2.5]" />
              </button>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={onOpenEnquiry}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFD000] text-[11px] font-black text-black uppercase tracking-wider shadow-sm"
              >
                Inquire
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/15"
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#0b0b0e] border-l border-white/15 p-6 flex flex-col justify-between shadow-2xl z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-white p-1 flex items-center justify-center border border-[#FFD000]">
                    <img
                      src="/logos/shree_laxmi_transparent.png"
                      alt="Shriee Laxmi Group"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/logos/shree_laxmi.png'
                      }}
                    />
                  </div>
                  <span className="text-xs font-black tracking-tight text-white">
                    SHRIEE LAXMI
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col space-y-1.5">
                {NAV_LINKS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-[#FFD000] text-black font-black'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenEnquiry()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FFD000] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FFD000]/25"
              >
                <span>Initiate Trade</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
