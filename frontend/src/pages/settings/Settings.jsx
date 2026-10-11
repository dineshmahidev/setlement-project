import React, { useState, useEffect } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import {
  Building2,
  Receipt,
  Landmark,
  FileSpreadsheet,
  Key,
  Percent,
  FileCheck,
  Save,
  Plus,
  CheckCircle2,
} from 'lucide-react'

export default function Settings() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    company: {},
    gst_rates: [],
    financial_years: [],
    document_sequences: [],
  })

  // GST rate modal
  const [gstModal, setGstModal] = useState(false)
  const [gstForm, setGstForm] = useState({
    name: '',
    cgst_rate: 2.5,
    sgst_rate: 2.5,
    igst_rate: 5.0,
    is_default: false,
  })
  const [gstSaving, setGstSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/settings')
      if (res.data?.success) {
        setData(res.data.data)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load settings'))
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (e) => {
    const { name, value, type, checked } = e.target
    setData((prev) => ({
      ...prev,
      company: {
        ...prev.company,
        [name]: type === 'checkbox' ? checked : value,
      },
    }))
  }

  const handleSaveCompany = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put('/settings', data.company)
      if (res.data?.success) {
        toast.success('Settings updated successfully')
        setData((prev) => ({ ...prev, company: res.data.data }))
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateGstRate = async (e) => {
    e.preventDefault()
    setGstSaving(true)
    try {
      const res = await api.post('/settings/gst-rates', gstForm)
      if (res.data?.success) {
        toast.success('GST Rate added successfully')
        setGstModal(false)
        setGstForm({ name: '', cgst_rate: 2.5, sgst_rate: 2.5, igst_rate: 5.0, is_default: false })
        fetchSettings()
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add GST Rate'))
    } finally {
      setGstSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'tax', label: 'Tax & Legal', icon: Receipt },
    { id: 'banking', label: 'Bank & Payment', icon: Landmark },
    { id: 'numbering', label: 'Document Numbering', icon: FileSpreadsheet },
    { id: 'gst_rates', label: 'GST Rates', icon: Percent },
    { id: 'gst_api', label: 'GST API Gateway', icon: Key },
    { id: 'terms', label: 'Terms & Signature', icon: FileCheck },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-500">
            Configure company identity, GST parameters, numbering sequence, and accounting rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs space-y-1 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#0b3558] text-white font-semibold shadow-xs border-l-4 border-[#d69e2e]'
                    : 'text-slate-600 hover:bg-[#fbf5ea] hover:text-[#0b3558]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#d69e2e]' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          {/* 1. Company Profile */}
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Company Profile & Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Company Registered Legal Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={data.company.company_name || ''}
                    onChange={handleCompanyChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Trade / Display Name
                  </label>
                  <input
                    type="text"
                    name="trade_name"
                    value={data.company.trade_name || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone / Contact Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={data.company.phone || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={data.company.email || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={data.company.website || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={data.company.address || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    City / Taluk
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={data.company.city || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={data.company.district || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={data.company.state || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={data.company.pincode || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#d69e2e]" />
                  {saving ? 'Saving...' : 'Save Company Details'}
                </button>
              </div>
            </form>
          )}

          {/* 2. Tax & Legal */}
          {activeTab === 'tax' && (
            <form onSubmit={handleSaveCompany} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Tax Registrations & Rounding Rules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    GSTIN Number *
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    value={data.company.gstin || ''}
                    onChange={handleCompanyChange}
                    placeholder="33AABCS1234F1Z5"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Corporate Identity Number (CIN)
                  </label>
                  <input
                    type="text"
                    name="cin"
                    value={data.company.cin || ''}
                    onChange={handleCompanyChange}
                    placeholder="U15400TN2020PTC123456"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="pan"
                    value={data.company.pan || ''}
                    onChange={handleCompanyChange}
                    placeholder="AABCS1234F"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Final Monetary Rounding Rule
                  </label>
                  <select
                    name="rounding_mode"
                    value={data.company.rounding_mode || 'nearest_rupee'}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="nearest_rupee">Nearest Rupee (e.g. ₹277.05 → ₹277.00)</option>
                    <option value="exact_decimals">Exact 2 Decimals (e.g. ₹277.05)</option>
                    <option value="ceil">Ceiling (Always Round Up)</option>
                    <option value="floor">Floor (Always Round Down)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Tax Details'}
                </button>
              </div>
            </form>
          )}

          {/* 3. Bank & Payment */}
          {activeTab === 'banking' && (
            <form onSubmit={handleSaveCompany} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Company Bank Details (Printed on Invoices & Bills)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={data.company.bank_name || ''}
                    onChange={handleCompanyChange}
                    placeholder="State Bank of India"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="branch_bank"
                    value={data.company.branch_bank || ''}
                    onChange={handleCompanyChange}
                    placeholder="Kangeyam Branch"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={data.company.account_number || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={data.company.ifsc_code || ''}
                    onChange={handleCompanyChange}
                    placeholder="SBIN0001234"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </form>
          )}

          {/* 4. Numbering */}
          {activeTab === 'numbering' && (
            <form onSubmit={handleSaveCompany} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Document Numbering Sequences
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Settlement Bill Prefix
                  </label>
                  <input
                    type="text"
                    name="settlement_prefix"
                    value={data.company.settlement_prefix || 'SB'}
                    onChange={handleCompanyChange}
                    placeholder="SB"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sample: SB/2026/BR-KNG/0001
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Debit Note Prefix
                  </label>
                  <input
                    type="text"
                    name="debit_note_prefix"
                    value={data.company.debit_note_prefix || 'DN'}
                    onChange={handleCompanyChange}
                    placeholder="DN"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sample: DN/1019/26-27
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Purchase Invoice Prefix
                  </label>
                  <input
                    type="text"
                    name="invoice_prefix"
                    value={data.company.invoice_prefix || 'INV'}
                    onChange={handleCompanyChange}
                    placeholder="INV"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sample: INV/0068/26-27
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Active Financial Years</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Code</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Start Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">End Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(Array.isArray(data.financial_years) ? data.financial_years : []).map((fy) => (
                        <tr key={fy.id}>
                          <td className="px-3 py-2 font-semibold text-slate-900">{fy.code}</td>
                          <td className="px-3 py-2 text-slate-600">{fy.start_date}</td>
                          <td className="px-3 py-2 text-slate-600">{fy.end_date}</td>
                          <td className="px-3 py-2">
                            {fy.is_current ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                Current
                              </span>
                            ) : (
                              <span className="text-slate-400">Past</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Sequence Settings'}
                </button>
              </div>
            </form>
          )}

          {/* 5. GST Rates */}
          {activeTab === 'gst_rates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">GST Tax Rates Master</h2>
                  <p className="text-xs text-slate-500">Configurable GST slabs for Rice Bran, Boiled Bran and Agro products.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGstModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add GST Slab
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Tax Name</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-700">CGST %</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-700">SGST %</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-700">IGST %</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(Array.isArray(data.gst_rates) ? data.gst_rates : []).map((rate) => (
                      <tr key={rate.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{rate.name}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{rate.cgst_rate}%</td>
                        <td className="px-4 py-3 text-right text-slate-700">{rate.sgst_rate}%</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{rate.igst_rate}%</td>
                        <td className="px-4 py-3 text-center">
                          {rate.is_default ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Default (5%)
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. GST API Gateway */}
          {activeTab === 'gst_api' && (
            <form onSubmit={handleSaveCompany} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                GSTIN Online Lookup API Integration
              </h2>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-800">
                <p className="font-semibold mb-1">Configurable GST Verification Layer</p>
                <p>
                  When entering a vendor GSTIN, the system automatically checks against the configured GST provider (MasterIndia, ClearTax, IRIS, or Sandbox) to fetch legal trade name, address, state, and active status.
                  If disabled or offline, fallback manual vendor registration is always available.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="gst_api_enabled"
                    name="gst_api_enabled"
                    checked={data.company.gst_api_enabled || false}
                    onChange={handleCompanyChange}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="gst_api_enabled" className="text-sm font-semibold text-slate-800 cursor-pointer">
                    Enable Live GSTIN Lookup API
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    API Provider
                  </label>
                  <select
                    name="gst_api_provider"
                    value={data.company.gst_api_provider || 'masterindia'}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="masterindia">MasterIndia GST API</option>
                    <option value="cleartax">ClearTax GST API</option>
                    <option value="iris">IRIS GST Vahan</option>
                    <option value="custom">Custom Webhook / Sandbox</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    API Key / Auth Token
                  </label>
                  <input
                    type="password"
                    name="gst_api_key"
                    value={data.company.gst_api_key || ''}
                    onChange={handleCompanyChange}
                    placeholder="••••••••••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    API Secret / Client ID (Optional)
                  </label>
                  <input
                    type="password"
                    name="gst_api_secret"
                    value={data.company.gst_api_secret || ''}
                    onChange={handleCompanyChange}
                    placeholder="Optional secret key"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save API Settings'}
                </button>
              </div>
            </form>
          )}

          {/* 7. Terms & Signature */}
          {activeTab === 'terms' && (
            <form onSubmit={handleSaveCompany} className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                PDF Terms & Conditions and Signature
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Authorized Signatory Designation Title
                  </label>
                  <input
                    type="text"
                    name="authorized_signatory_title"
                    value={data.company.authorized_signatory_title || ''}
                    onChange={handleCompanyChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Settlement Bill & Debit Note Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    name="terms_conditions"
                    value={data.company.terms_conditions || ''}
                    onChange={handleCompanyChange}
                    placeholder="1. Quality deduction is subject to laboratory test report. 2. Subject to Kangeyam jurisdiction."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Terms'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* New GST Rate Modal */}
      {gstModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Add New GST Rate Slab</h3>
              <button
                onClick={() => setGstModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateGstRate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Rate Label Name *
                </label>
                <input
                  type="text"
                  value={gstForm.name}
                  onChange={(e) => setGstForm({ ...gstForm, name: e.target.value })}
                  placeholder="e.g. GST 5% (Agro Goods)"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    CGST %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gstForm.cgst_rate}
                    onChange={(e) => setGstForm({ ...gstForm, cgst_rate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    SGST %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gstForm.sgst_rate}
                    onChange={(e) => setGstForm({ ...gstForm, sgst_rate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    IGST %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gstForm.igst_rate}
                    onChange={(e) => setGstForm({ ...gstForm, igst_rate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="default_rate"
                  checked={gstForm.is_default}
                  onChange={(e) => setGstForm({ ...gstForm, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="default_rate" className="text-xs font-medium text-slate-700">
                  Set as system default rate
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGstModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gstSaving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {gstSaving ? 'Adding...' : 'Add Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
