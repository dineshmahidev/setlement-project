import React, { useState, useEffect } from 'react'
import {
  Globe,
  Building,
  Phone,
  MapPin,
  Save,
  RefreshCw,
  Eye,
  FileText,
  CreditCard,
  ExternalLink,
  Info
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ReplaceablePicture from '../../components/ReplaceablePicture'

export default function WebsiteCms() {
  const { companies, activeCompany, setCompanyById } = useAuth()
  const toast = useToast()

  const [companyList, setCompanyList] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    company_name: '',
    short_name: '',
    trade_name: '',
    tagline: '',
    sub_tagline: '',
    about_us: '',
    cms_hero_title: '',
    cms_hero_subtitle: '',
    cms_services: '',
    phone: '',
    phone_2: '',
    email: '',
    website: '',
    map_url: '',
    address: '',
    city: '',
    district: '',
    state: '',
    state_code: '',
    pincode: '',
    gstin: '',
    pan: '',
    bank_name: '',
    branch_bank: '',
    account_number: '',
    ifsc_code: '',
    settlement_prefix: '',
    debit_note_prefix: '',
    invoice_prefix: '',
    terms_conditions: '',
    authorized_signatory_title: '',
    logo_path: '',
    logo_transparent_path: '',
    banner_path: '',
    signature_path: '',
  })

  // Load all companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/companies/all')
        const list = res.data?.data || []
        setCompanyList(list)
        if (list.length > 0) {
          const currentId = activeCompany?.id || list[0].id
          setSelectedCompanyId(String(currentId))
        }
      } catch (err) {
        // Fallback to auth companies
        if (companies && companies.length > 0) {
          setCompanyList(companies)
          setSelectedCompanyId(String(activeCompany?.id || companies[0].id))
        }
      }
    }
    fetchCompanies()
  }, [])

  // Load company details when selectedCompanyId changes
  useEffect(() => {
    if (!selectedCompanyId) return

    const loadCompany = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/companies/${selectedCompanyId}`)
        const data = res.data?.data || {}
        setFormData({
          company_name: data.company_name || '',
          short_name: data.short_name || '',
          trade_name: data.trade_name || '',
          tagline: data.tagline || '',
          sub_tagline: data.sub_tagline || '',
          about_us: data.about_us || '',
          cms_hero_title: data.cms_hero_title || '',
          cms_hero_subtitle: data.cms_hero_subtitle || '',
          cms_services: data.cms_services || '',
          phone: data.phone || '',
          phone_2: data.phone_2 || '',
          email: data.email || '',
          website: data.website || '',
          map_url: data.map_url || '',
          address: data.address || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          state_code: data.state_code || '',
          pincode: data.pincode || '',
          gstin: data.gstin || '',
          pan: data.pan || '',
          bank_name: data.bank_name || '',
          branch_bank: data.branch_bank || '',
          account_number: data.account_number || '',
          ifsc_code: data.ifsc_code || '',
          settlement_prefix: data.settlement_prefix || '',
          debit_note_prefix: data.debit_note_prefix || '',
          invoice_prefix: data.invoice_prefix || '',
          terms_conditions: data.terms_conditions || '',
          authorized_signatory_title: data.authorized_signatory_title || '',
          logo_path: data.logo_path || '',
          logo_transparent_path: data.logo_transparent_path || '',
          banner_path: data.banner_path || '',
          signature_path: data.signature_path || '',
        })
      } catch (err) {
        toast.error('Failed to load company CMS details')
      } finally {
        setLoading(false)
      }
    }
    loadCompany()
  }, [selectedCompanyId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedCompanyId) return

    setSaving(true)
    try {
      const res = await api.put(`/companies/${selectedCompanyId}`, formData)
      if (res.data?.data) {
        toast.success('Company CMS and Invoice details updated successfully!')
        // If current active company was updated, refresh context
        if (Number(selectedCompanyId) === Number(activeCompany?.id)) {
          setCompanyById(Number(selectedCompanyId))
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Extract clean embed map URL if full iframe was pasted
  const getCleanMapUrl = (raw) => {
    if (!raw) return ''
    if (raw.includes('<iframe') && raw.includes('src="')) {
      const match = raw.match(/src="([^"]+)"/)
      return match ? match[1] : raw
    }
    return raw
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#0B1A2D] via-[#162A45] to-[#0B1A2D] p-6 rounded-2xl text-white shadow-xl border border-amber-400/20">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Globe className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Website CMS & Invoice Master
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  Company-Wise
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Manage company branding, 2 contact mobile numbers, Google Maps location, and billing details synced directly to invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/15">
          <Building className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
          <span className="text-xs font-bold text-slate-200">Company:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-white text-slate-900 text-xs font-extrabold py-1.5 px-3 rounded-lg border-0 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            {companyList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sync Info Alert */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-0.5">
          <p className="font-bold">Automatic Invoice & Website Sync Enabled</p>
          <p className="text-amber-800">
            Details configured here (Company Name, Tagline, Address, Phone 1, Phone 2, GSTIN, Bank Details) automatically populate onto all official <strong>Settlement Bills, Debit Notes, Inward receipts, Outward dispatches</strong>, and the public company website.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-500 mb-2" />
          <p className="text-xs font-bold">Loading company CMS information...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Company Profile & Taglines */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                1. Company Profile & Taglines
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Registered Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade Name</label>
                <input
                  type="text"
                  name="trade_name"
                  value={formData.trade_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Name / Code</label>
                <input
                  type="text"
                  name="short_name"
                  value={formData.short_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Tagline (Printed on Bills)</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. MANUFACTURERS OF DE-OILED RICE BRAN"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Tagline</label>
                <input
                  type="text"
                  name="sub_tagline"
                  value={formData.sub_tagline}
                  onChange={handleChange}
                  placeholder="e.g. & ALL KINDS OF CATTLE FEEDS"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">About Company / Overview (Website)</label>
                <textarea
                  name="about_us"
                  rows={3}
                  value={formData.about_us}
                  onChange={handleChange}
                  placeholder="Write a brief description of the company, its legacy, products, and manufacturing standard..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Numbers & Location (2 Mobile Numbers) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                2. Contact Numbers (2 Mobile Numbers) & Address
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Primary Mobile / Phone 1 *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98424 56789"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Secondary Mobile / Phone 2 (Optional)
                </label>
                <input
                  type="text"
                  name="phone_2"
                  value={formData.phone_2}
                  onChange={handleChange}
                  placeholder="e.g. +91 98424 99999"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="info@laxmitraders.in"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://shrieelaxmi.in"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Physical Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Door No, Street Name, Industrial Estate"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Kangayam"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="638701"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Tamil Nadu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State Code</label>
                <input
                  type="text"
                  name="state_code"
                  value={formData.state_code}
                  onChange={handleChange}
                  placeholder="33"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="33AAACL1234F1Z1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="AAACL1234F"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Google Map Location Option */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                3. Google Map Option (Interactive Embed & Link)
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Google Map Embed URL or Link (or paste complete &lt;iframe&gt; code)
                </label>
                <input
                  type="text"
                  name="map_url"
                  value={formData.map_url}
                  onChange={handleChange}
                  placeholder="https://www.google.com/maps/embed?pb=... or https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Tip: In Google Maps, click <strong>Share → Embed a map → Copy HTML</strong> and paste it here. It will automatically extract the embed URL.
                </p>
              </div>

              {/* Map Preview */}
              {formData.map_url && (
                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                  <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Live Google Map Preview
                    </span>
                    <a
                      href={getCleanMapUrl(formData.map_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline flex items-center gap-1 text-[10px]"
                    >
                      Open in Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="h-56 w-full bg-slate-50">
                    <iframe
                      src={getCleanMapUrl(formData.map_url)}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Map Preview"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Bank Details (For Settlement Bills & Invoices) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                4. Bank Account Details (Printed on Invoices & Bills)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch</label>
                <input
                  type="text"
                  name="branch_bank"
                  value={formData.branch_bank}
                  onChange={handleChange}
                  placeholder="e.g. Kangayam Main Branch"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="e.g. 30123456789"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={handleChange}
                  placeholder="e.g. SBIN0001234"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Document Prefixes & Invoice Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                5. Document Number Prefixes & Terms
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Settlement Bill Prefix</label>
                <input
                  type="text"
                  name="settlement_prefix"
                  value={formData.settlement_prefix}
                  onChange={handleChange}
                  placeholder="SB"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Debit Note Prefix</label>
                <input
                  type="text"
                  name="debit_note_prefix"
                  value={formData.debit_note_prefix}
                  onChange={handleChange}
                  placeholder="DN"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  name="invoice_prefix"
                  value={formData.invoice_prefix}
                  onChange={handleChange}
                  placeholder="INV"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  name="terms_conditions"
                  rows={2}
                  value={formData.terms_conditions}
                  onChange={handleChange}
                  placeholder="Subject to Kangayam jurisdiction only..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Signatory Title</label>
                <input
                  type="text"
                  name="authorized_signatory_title"
                  value={formData.authorized_signatory_title}
                  onChange={handleChange}
                  placeholder="For LAXMI TRADERS, Partner"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Website Hero & Services */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                6. Website Showcase & Services (Public CMS)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">CMS Hero Title</label>
                <input
                  type="text"
                  name="cms_hero_title"
                  value={formData.cms_hero_title}
                  onChange={handleChange}
                  placeholder="e.g. Leading Processing of Premium De-Oiled Rice Bran"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CMS Hero Subtitle</label>
                <input
                  type="text"
                  name="cms_hero_subtitle"
                  value={formData.cms_hero_subtitle}
                  onChange={handleChange}
                  placeholder="e.g. Trusted by 250+ partners across South India with ISO tested laboratory accuracy."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Services & Product Highlights</label>
                <textarea
                  name="cms_services"
                  rows={2}
                  value={formData.cms_services}
                  onChange={handleChange}
                  placeholder="List primary products and services separated by commas (e.g. De-Oiled Rice Bran, Raw Rice Bran, Quality Lab Testing, Bulk Dispatches)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Replaceable Company Branding & Signatures */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  7. Company Logos, Digital Signature & Page Banner
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                Direct Replaceable Pictures (Click or Drag File)
              </span>
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              All branding assets below are <strong>replaceable pictures</strong>. Click directly on any picture or the <strong>Replace Picture</strong> button to upload an image file from your computer. No need to copy or type links!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Transparent Logo */}
              <div className="border border-amber-200/80 rounded-2xl p-5 bg-gradient-to-b from-amber-50/30 to-white shadow-2xs">
                <ReplaceablePicture
                  label="Transparent Logo (PDF & Top Navbar)"
                  sublabel="High-resolution transparent PNG used on panel header and all official printed PDFs."
                  value={formData.logo_transparent_path}
                  onChange={(val) => setFormData((p) => ({ ...p, logo_transparent_path: val }))}
                  darkBg={true}
                  aspectRatio="logo"
                  badgeText="PDF & Navbar"
                  presets={[
                    { label: 'Laxmi (Trans)', value: '/logos/laxmi_traders_transparent.png' },
                    { label: 'SM Traders (Trans)', value: '/logos/sm_traders_transparent.png' },
                    { label: 'Shree Feeds (Trans)', value: '/logos/shree_feeds_transparent.png' },
                    { label: 'Shree Laxmi (Trans)', value: '/logos/shree_laxmi_transparent.png' },
                  ]}
                />
              </div>

              {/* 2. Digital Signature */}
              <div className="border border-emerald-200/80 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/30 to-white shadow-2xs">
                <ReplaceablePicture
                  label="Digital Signature (Authorized Signatory)"
                  sublabel="Official signature image stamped directly above 'Authorized Signatory' across all 8 PDF templates."
                  value={formData.signature_path}
                  onChange={(val) => setFormData((p) => ({ ...p, signature_path: val }))}
                  darkBg={true}
                  aspectRatio="signature"
                  badgeText="All 8 PDFs"
                  presets={[
                    { label: 'Laxmi Traders Signature', value: '/signatures/laxmi_signature.png' },
                    { label: 'S M Traders Signature', value: '/signatures/sm_signature.png' },
                    { label: 'Shriee Feeds Signature', value: '/signatures/shriee_signature.png' },
                    { label: 'Default Group Signature', value: '/signatures/default_signature.png' },
                  ]}
                />
              </div>

              {/* 3. Solid Logo */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 shadow-2xs">
                <ReplaceablePicture
                  label="Solid Background Logo"
                  sublabel="General solid background logo for public cards, emails, and website sections."
                  value={formData.logo_path}
                  onChange={(val) => setFormData((p) => ({ ...p, logo_path: val }))}
                  darkBg={false}
                  aspectRatio="logo"
                  badgeText="General Web"
                  presets={[
                    { label: 'Laxmi Traders', value: '/logos/laxmi_traders.png' },
                    { label: 'SM Traders', value: '/logos/sm_traders.png' },
                    { label: 'Shree Feeds', value: '/logos/shree_feeds.png' },
                    { label: 'Shree Laxmi', value: '/logos/shree_laxmi.png' },
                  ]}
                />
              </div>

              {/* 4. Hero Banner */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 shadow-2xs">
                <ReplaceablePicture
                  label="Web Page Hero Banner"
                  sublabel="High-resolution banner photo displayed in the hero section of the public website."
                  value={formData.banner_path}
                  onChange={(val) => setFormData((p) => ({ ...p, banner_path: val }))}
                  darkBg={false}
                  aspectRatio="banner"
                  badgeText="Website Hero"
                  presets={[
                    { label: 'Homepage Banner', value: '/banners/homepage_banner.png' },
                    { label: 'Laxmi Traders Banner', value: '/banners/laxmi_traders_banner.png' },
                    { label: 'Shree Feeds Banner', value: '/banners/shree_feeds_banner.png' },
                    { label: 'SM Traders Banner', value: '/banners/sm_traders_banner.png' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between bg-white/95 backdrop-blur-md p-4 rounded-2xl border-2 border-amber-400 shadow-xl">
            <div className="text-xs text-slate-600 font-medium">
              Save changes to update invoices, settlement bills, and website pages for{' '}
              <strong className="text-slate-900">{formData.company_name || 'selected company'}</strong>.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  Saving Updates...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-slate-950" />
                  Save Company CMS & Invoices
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
