import React, { useState } from 'react'
import { X, Send, CheckCircle2, Building2 } from 'lucide-react'

export default function EnquiryModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    mobile: '',
    email: '',
    business_requirement: 'Laxmi Traders',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 600)
  }

  const handleReset = () => {
    setSubmitted(false)
    setForm({
      name: '',
      company_name: '',
      mobile: '',
      email: '',
      business_requirement: 'Laxmi Traders',
      message: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#C9A227]/40 bg-[#071426] text-white shadow-2xl p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C9A227] to-[#8C6E14] text-[#071426] font-black text-base shadow-md">
            LG
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Business Enquiry
            </h2>
            <p className="text-xs text-[#E0BD55]">LAXMI GROUP • Tiruchirappalli, Tamil Nadu</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-400">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-white">Thank You for Reaching Out!</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Your business enquiry has been successfully received. Our representative from Laxmi Group will connect with you shortly.
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#C9A227] text-xs font-black text-[#071426] uppercase tracking-wider hover:bg-[#E0BD55]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Your Name <span className="text-[#C9A227]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setF('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="Business / Enterprise"
                  value={form.company_name}
                  onChange={(e) => setF('company_name', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mobile Number <span className="text-[#C9A227]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 Mobile number"
                  value={form.mobile}
                  onChange={(e) => setF('mobile', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setF('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Business Requirement / Entity
              </label>
              <select
                value={form.business_requirement}
                onChange={(e) => setF('business_requirement', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
              >
                <option value="Laxmi Traders">Laxmi Traders (Trading & Distribution)</option>
                <option value="S M Traders">S M Traders (Trading Business)</option>
                <option value="Shriee Feeds">Shriee Feeds (Feed & Related Products)</option>
                <option value="General Partnership">General Group Partnership</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Message / Requirements</label>
              <textarea
                rows={3}
                placeholder="Describe your product or distribution requirements..."
                value={form.message}
                onChange={(e) => setF('message', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-[#C9A227] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#C9A227] via-[#E0BD55] to-[#8C6E14] text-[#071426] font-black uppercase tracking-wider text-xs shadow-lg hover:shadow-amber-500/20"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? 'Submitting...' : 'Submit Enquiry'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
