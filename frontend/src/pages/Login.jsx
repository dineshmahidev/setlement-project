import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Building2,
  Scale,
  Boxes,
  CheckCircle2,
} from 'lucide-react'
import { apiErrorMessage } from '../services/api'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@laxmitraders.com')
  const [password, setPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/panel', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid credentials. Please verify your email and password.'))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (quickEmail) => {
    setEmail(quickEmail)
    setPassword('password')
    setError('')
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#08121E] font-sans text-slate-800 antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* ========================================================
          LEFT COLUMN: Enterprise Visual Showcase (Hero & Features)
          Uses existing background asset & ONLY Shree Lakshmi Logo
          ======================================================== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-800/80">
        {/* Background Image Asset with Dark Sapphire/Navy Gradient Mesh */}
        <div className="absolute inset-0 z-0">
          <img
            src="/banners/homepage_banner.png"
            alt="Shree Lakshmi Enterprise Background"
            className="w-full h-full object-cover object-center filter brightness-90 scale-105"
            onError={(e) => {
              // Fallback to secondary existing slide if needed
              e.currentTarget.src = '/images/slide1.jpg'
            }}
          />
          {/* Deep Navy/Black Rich Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#06101E]/95 via-[#0A1A2F]/90 to-[#071426]/95 backdrop-blur-[2px]" />
          {/* Subtle Ambient Golden & Indigo Radial Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Header on Left Side */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-lg">
              <img
                src="/logos/shree_laxmi_transparent.png"
                alt="Shree Lakshmi"
                className="max-h-full max-w-full object-contain drop-shadow"
              />
            </div>
            <div>
              <span className="text-white font-black text-sm tracking-widest uppercase block">
                Shree Lakshmi
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Corporate Group Workspace
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Enterprise Edition
          </span>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
          {/* Prominent Golden Glow Container with Shree Lakshmi Logo */}
          <div className="inline-block relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-amber-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl flex items-center gap-4">
              <img
                src="/logos/shree_laxmi_transparent.png"
                alt="Shree Lakshmi Logo"
                className="h-20 w-auto object-contain drop-shadow-2xl"
              />
              <div className="border-l border-white/20 pl-4">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-extrabold block">
                  Official Portal
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                  SHREE LAKSHMI
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Settlement & Multi-Godown Operations
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Precision Accounting, <br />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-[#E0BD55] bg-clip-text text-transparent">
                Settlements & Inventory Control.
              </span>
            </h1>
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-lg">
              Manage live weighbridge inward/outward dispatches, laboratory oil & sand quality
              deductions, instant settlement bills, debit notes, and multi-tenant ledger accounts.
            </p>
          </div>

          {/* 3 Interactive Highlight Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-left transition hover:bg-white/15">
              <Scale className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-xs font-black text-white">Weighment & Lab</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Automatic deduction calculation</div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-left transition hover:bg-white/15">
              <Boxes className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-xs font-black text-white">Godown Stock</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Live batch balance & mixing</div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-left transition hover:bg-white/15">
              <Building2 className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-xs font-black text-white">Multi-Tenant</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Dynamic logo & sign PDFs</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar on Left Side */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Ariyamangalam & Kangeyam Hubs • Tamil Nadu</span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> High Performance ERP
          </span>
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: Modern Login Form Card
          Clean, Premium, High Contrast, 100% Mobile Responsive
          ======================================================== */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#FFFFFF] min-h-screen">
        {/* Soft Background Accent Circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Mobile-Only Top Brand Showcase */}
          <div className="lg:hidden text-center pb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Shree Lakshmi Workspace
            </span>
          </div>

          {/* Main Login Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-9 space-y-6 backdrop-blur-xl">
            {/* Logo & Heading: ONLY Shree Lakshmi Logo */}
            <div className="text-center space-y-3">
              <div className="relative inline-block mx-auto">
                <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-inner flex items-center justify-center">
                  <img
                    src="/logos/shree_laxmi_transparent.png"
                    alt="Shree Lakshmi Logo"
                    className="h-16 sm:h-20 w-auto object-contain mx-auto drop-shadow-md transition-transform duration-200 hover:scale-105"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Welcome to Shree Lakshmi
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Sign in with your corporate email to access the settlement & inventory panel.
                </p>
              </div>
            </div>

            {/* Active Session Indicator (Allows user to stay on login page or navigate) */}
            {user && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs flex items-center justify-between gap-2 shadow-xs">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Active Session</div>
                  <div className="font-semibold text-slate-900 truncate">{user.name} ({user.email})</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/panel')}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-shake shadow-xs">
                <span className="font-bold text-rose-600 mt-0.5">•</span>
                <span className="flex-1 font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@laxmitraders.com"
                    required
                    autoComplete="username"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 font-medium focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 font-medium focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-amber-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#071426] via-[#0B1A2D] to-[#071426] hover:from-amber-500 hover:via-amber-600 hover:to-amber-500 hover:text-slate-950 text-white font-black py-3.5 px-6 text-sm shadow-xl shadow-slate-900/15 hover:shadow-amber-500/25 transition-all duration-200 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                    <span>Signing in to Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Panel Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quick Role Switch:
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  Password: password
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@laxmitraders.com')}
                  className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                    email === 'admin@laxmitraders.com'
                      ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-400'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                    Super Admin
                    {email === 'admin@laxmitraders.com' && (
                      <CheckCircle2 className="w-3 h-3 text-amber-600 ml-auto" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">admin@laxmitraders.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager@laxmitraders.com')}
                  className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                    email === 'manager@laxmitraders.com'
                      ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-400'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                    Branch Manager
                    {email === 'manager@laxmitraders.com' && (
                      <CheckCircle2 className="w-3 h-3 text-amber-600 ml-auto" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">manager@laxmitraders...</div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Navigation & Security Trust Info */}
          <div className="text-center space-y-2">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 transition"
              >
                ← Return to Shree Lakshmi Corporate Website
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-bit SSL Encrypted Session • Authorized Access Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
