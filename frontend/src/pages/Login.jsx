import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Scale, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import { apiErrorMessage } from '../services/api'

export default function Login() {
  const { login } = useAuth()
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
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC] p-4 font-sans text-slate-800 overflow-hidden">
      {/* Soft Ambient Mesh Background Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-pink-200/40 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-l from-amber-200/40 via-rose-200/30 to-purple-200/30 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-[#C9A227] font-black text-slate-950 shadow-md">
              <Scale className="w-7 h-7 text-slate-950" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-[#071426] flex items-center justify-center gap-1.5">
              LAXMI GROUP <span className="text-xs bg-amber-50 border border-amber-200 text-[#C9A227] px-2 py-0.5 rounded-md font-mono">PANEL</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">Settlement & Management Enterprise Platform</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600 flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@laxmitraders.com"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#071426] hover:bg-[#C9A227] hover:text-slate-950 py-3 text-sm font-black text-white shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Panel Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-center text-[11px] font-bold uppercase text-slate-500 mb-2.5 tracking-wider">
              Quick Role Switch (Password: password)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@laxmitraders.com')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <div className="font-black text-[#071426]">Super Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin@laxmitraders.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@laxmitraders.com')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <div className="font-black text-[#071426]">Branch Manager</div>
                <div className="text-[10px] text-slate-500 truncate">manager@laxmitraders...</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Laxmi Group Enterprise Multi-Godown Settlement & Inventory Control
        </p>
      </div>
    </div>
  )
}

