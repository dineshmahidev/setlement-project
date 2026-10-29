import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { apiErrorMessage } from '../services/api'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [autofillLocked, setAutofillLocked] = useState(true)

  const unlockAutofill = () => setAutofillLocked(false)

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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FFF8F9] font-sans text-slate-800 antialiased selection:bg-[#F26B6B] selection:text-white">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#F9C6CF]/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-[#FAD9DE]/40 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#F8E3E7] bg-white shadow-[0_18px_50px_-30px_rgba(180,90,110,0.25)] lg:grid-cols-2">
          {/* Left visual */}
          <div className="relative hidden p-4 lg:block">
            <div className="relative h-full min-h-[560px] overflow-hidden rounded-[24px] bg-[#FDF0F2]">
              <img
                src="/banners/homepage_banner.png"
                alt="Shree Lakshmi agro operations"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/images/slide1.jpg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3B1B22]/20 via-transparent to-transparent" />

              {/* Decorative shapes inspired by the reference layout */}
              <div className="absolute right-5 top-5 h-16 w-16 rounded-full border-[6px] border-white/70" />
              <div className="absolute right-10 top-24 h-3 w-10 rounded-full bg-white/70" />
              <div className="absolute right-10 top-28 h-3 w-7 rounded-full bg-white/50" />
              <div className="absolute bottom-6 left-6 rounded-2xl bg-white/90 px-4 py-2.5 shadow-md backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#F26B6B]">
                  Shree Lakshmi Group
                </div>
                <div className="text-xs font-bold text-slate-800">Settlement & Inventory Panel</div>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-14">
            <div className="w-full max-w-sm">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-black tracking-tight text-[#F26B6B] sm:text-4xl">
                  Login
                </h1>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  Sign in to access your workspace
                </p>
              </div>

              {user && (
                <div className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      Active Session
                    </div>
                    <div className="truncate font-semibold text-slate-900">
                      {user.name} ({user.email})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/panel')}
                    className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-[#F26B6B] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#e85d5d]"
                  >
                    Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700">
                  <span className="mt-0.5 font-bold text-rose-600">•</span>
                  <span className="flex-1 font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      name="panel_work_email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={unlockAutofill}
                      placeholder="Enter your email"
                      required
                      readOnly={autofillLocked}
                      autoComplete="off"
                      className="w-full rounded-lg border border-[#F2E2E5] bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-300 transition focus:border-[#F26B6B] focus:outline-hidden focus:ring-4 focus:ring-[#F26B6B]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="panel_work_password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={unlockAutofill}
                      placeholder="Enter your password"
                      required
                      readOnly={autofillLocked}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-[#F2E2E5] bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder-slate-300 transition focus:border-[#F26B6B] focus:outline-hidden focus:ring-4 focus:ring-[#F26B6B]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 transition hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="cursor-pointer text-[11px] font-medium text-slate-400 hover:text-[#F26B6B] hover:underline">
                    forgot password?
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#F26B6B] py-3 text-sm font-bold text-white shadow-sm shadow-[#F26B6B]/10 transition hover:bg-[#e85d5d] active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 flex items-center justify-between gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-[#F26B6B]"
                >
                  ← Back to website
                </Link>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#F2E2E5] bg-white px-3 py-1.5 shadow-sm">
                  <span className="text-[9px] font-medium text-slate-400">presented by</span>
                  <img
                    src="/logos/shree_laxmi_transparent.png"
                    alt="Shree Lakshmi"
                    className="h-4 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
