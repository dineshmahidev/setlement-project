import React, { useState } from 'react'
import { X, Send, CheckCircle2, ArrowUpRight } from 'lucide-react'
import api from '../../services/api'
import { useWebsiteCms } from '../context/WebsiteCmsContext'

export default function EnquiryModal({ isOpen, onClose }) {
  const { primaryCompany } = useWebsiteCms()
  const logoSrc = primaryCompany?.logo_transparent_path || '/logos/shree_laxmi_transparent.png'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/public/enquiries', {
        name: form.name,
        company_name: form.company_name,
        phone: form.mobile,
        email: form.email,
        requirement: form.business_requirement,
        message: form.message,
        source: 'quick_enquiry_modal',
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Enquiry submit error:', err)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
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
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box in Solid Yellow / Black / White theme */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-[#0e0e12] text-white shadow-2xl p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto border-2 border-[#FFD000]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shrink-0 border border-[#FFD000]">
            <img
              src={logoSrc}
              alt="Shriee Laxmi Group"
              className="h-full w-full object-contain filter drop-shadow"
              onError={(e) => {
                e.currentTarget.src = '/logos/shree_laxmi.png'
              }}
            />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              Commercial Trade Inquiry
            </h2>
            <p className="text-xs text-[#FFD000] font-bold">
              SHRIEE LAXMI GROUP • Procurement Desk
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD000]/20 border border-[#FFD000] text-[#FFD000]">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-white">Inquiry Logged Successfully</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Your commodity requirement has been dispatched to our senior procurement desk. We will contact you shortly with confirmed quotes and dispatch dates.
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#FFD000] text-black text-xs font-black uppercase tracking-wider hover:bg-[#ffe14d] transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Full Name <span className="text-[#FFD000]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setF('name', e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-400 focus:border-[#FFD000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">Company / Farm</label>
                <input
                  type="text"
                  placeholder="Business Name"
                  value={form.company_name}
                  onChange={(e) => setF('company_name', e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-400 focus:border-[#FFD000] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Contact Mobile <span className="text-[#FFD000]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 Mobile number"
                  value={form.mobile}
                  onChange={(e) => setF('mobile', e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-400 focus:border-[#FFD000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={form.email}
                  onChange={(e) => setF('email', e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-400 focus:border-[#FFD000] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-200 font-bold mb-1">
                Target Business Division
              </label>
              <select
                value={form.business_requirement}
                onChange={(e) => setF('business_requirement', e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-[#1a1a24] px-3.5 py-2.5 text-white focus:border-[#FFD000] focus:outline-none"
              >
                <option value="Laxmi Traders">Laxmi Traders (Commercial Commodity Trading)</option>
                <option value="S M Traders">S M Traders (Bulk Grain Supply & Trade)</option>
                <option value="Shriee Feeds">Shriee Feeds (Cattle & Poultry Feeds)</option>
                <option value="General Partnership">Enterprise Trade Partnership</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-200 font-bold mb-1">Requirement / Tonnage (MT)</label>
              <textarea
                rows={3}
                placeholder="Specify commodity items, required volume in Metric Tons (MT), or recurring delivery schedule..."
                value={form.message}
                onChange={(e) => setF('message', e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-400 focus:border-[#FFD000] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#FFD000] hover:bg-[#ffe14d] text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-[#FFD000]/25 transition-all cursor-pointer"
            >
              <span>{loading ? 'Submitting...' : 'Submit Commercial Requirement'}</span>
              <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
