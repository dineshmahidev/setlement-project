import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react'

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200/90 shadow-md py-2 sm:py-2.5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Horizontal Brand Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src="/images/laxmi_horizontal_logo.jpg"
                alt="Laxmi Group Agro Traders & Feeds"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                      isActive
                        ? 'text-[#9A7B1C] bg-amber-50 border border-amber-200/80 shadow-2xs font-extrabold'
                        : 'text-slate-700 hover:text-[#071426] hover:bg-slate-100/60'
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:border-[#C9A227] hover:bg-white hover:text-[#071426] shadow-2xs transition-all"
                title="Management App Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" />
                <span className="font-extrabold">Staff Portal</span>
              </Link>

              <button
                onClick={onOpenEnquiry}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#071426] text-[11px] font-black text-white uppercase tracking-wider shadow-xs hover:bg-[#C9A227] hover:text-slate-950 transition-all cursor-pointer"
              >
                <span className="font-extrabold">Enquire</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C9A227]" />
              </button>
            </div>

            {/* Mobile Button */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                onClick={onOpenEnquiry}
                className="px-2.5 py-1 rounded-lg bg-[#071426] text-[11px] font-black text-[#E0BD55] uppercase tracking-wider shadow-2xs"
              >
                Enquire
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-black shadow-2xs"
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
        <div className="fixed inset-0 z-40 lg:hidden">
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
                  className="h-9 w-auto object-contain"
                />
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-500 hover:text-black">
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
                          ? 'bg-amber-50 text-[#9A7B1C] border border-amber-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#C9A227]" />
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#071426] to-[#0B1F3A] text-white font-extrabold text-sm uppercase tracking-wider shadow-md"
              >
                <span>Enquire Now</span>
                <ChevronRight className="w-4 h-4 text-[#E0BD55]" />
              </button>

              <Link
                to="/panel/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs"
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
