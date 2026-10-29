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
  Info,
  Quote,
  Star,
  Images,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ReplaceablePicture from '../../components/ReplaceablePicture'

const EMPTY_TESTIMONIALS = [
  { name: '', role: '', message: '', rating: 5 },
  { name: '', role: '', message: '', rating: 5 },
  { name: '', role: '', message: '', rating: 5 },
]

const buildTestimonials = (value) => {
  const list = Array.isArray(value) ? value : []
  return EMPTY_TESTIMONIALS.map((empty, index) => ({
    ...empty,
    ...(list[index] || {}),
  }))
}

const LANDING_IMAGE_SLOTS = [
  {
    key: 'landing_slide_1',
    label: 'Hero Slide 1',
    sublabel: 'First rotating banner image in the landing page hero.',
    aspectRatio: 'banner',
    badge: 'Hero 1',
  },
  {
    key: 'landing_slide_2',
    label: 'Hero Slide 2',
    sublabel: 'Second rotating banner image in the landing page hero.',
    aspectRatio: 'banner',
    badge: 'Hero 2',
  },
  {
    key: 'landing_slide_3',
    label: 'Hero Slide 3',
    sublabel: 'Third rotating banner image in the landing page hero.',
    aspectRatio: 'banner',
    badge: 'Hero 3',
  },
  {
    key: 'landing_feature_image',
    label: 'Services Feature Image',
    sublabel: 'Large image in the Services & Commodity Portfolio section.',
    aspectRatio: 'banner',
    badge: 'Feature',
  },
  {
    key: 'landing_service_image_1',
    label: 'Service Card Image 1',
    sublabel: 'Cottonseed Oil Cake card image.',
    aspectRatio: 'standard',
    badge: 'Card 1',
  },
  {
    key: 'landing_service_image_2',
    label: 'Service Card Image 2',
    sublabel: 'Wholesale Grains card image.',
    aspectRatio: 'standard',
    badge: 'Card 2',
  },
  {
    key: 'landing_service_image_3',
    label: 'Service Card Image 3',
    sublabel: 'High-Protein Feeds card image.',
    aspectRatio: 'standard',
    badge: 'Card 3',
  },
  {
    key: 'landing_contact_image_1',
    label: 'Contact Image 1',
    sublabel: 'Left image in the Responsive Direct Contact section.',
    aspectRatio: 'standard',
    badge: 'Contact 1',
  },
  {
    key: 'landing_contact_image_2',
    label: 'Contact Image 2',
    sublabel: 'Right image in the Responsive Direct Contact section.',
    aspectRatio: 'standard',
    badge: 'Contact 2',
  },
  {
    key: 'landing_form_image',
    label: 'Enquiry Form Image',
    sublabel: 'Arch image beside the requirement form at the bottom of the landing page.',
    aspectRatio: 'banner',
    badge: 'Form',
  },
]

const CMS_SECTIONS = [
  { id: 'cms-profile', label: '1. Profile', group: 'company' },
  { id: 'cms-contact', label: '2. Contact', group: 'company' },
  { id: 'cms-map', label: '3. Map', group: 'company' },
  { id: 'cms-bank', label: '4. Bank', group: 'company' },
  { id: 'cms-documents', label: '5. Documents', group: 'company' },
  { id: 'cms-hero', label: '6. Hero & Services', group: 'website' },
  { id: 'cms-testimonials', label: '7. Testimonials', group: 'website' },
  { id: 'cms-gallery', label: '8. Gallery', group: 'website' },
  { id: 'cms-landing-images', label: '9. Landing Images', group: 'website' },
  { id: 'cms-page-images', label: '10. Page Images', group: 'website' },
  { id: 'cms-branding', label: '11. Logos & Branding', group: 'branding' },
]

const PAGE_IMAGE_SLOTS = [
  {
    key: 'about_image',
    label: 'About Page Image',
    sublabel: 'Warehouse and logistics photo shown on the About page.',
    aspectRatio: 'banner',
    badge: 'About',
  },
  {
    key: 'products_services_image_1',
    label: 'Products & Services Image 1',
    sublabel: 'Trading Products category image.',
    aspectRatio: 'banner',
    badge: 'Product 1',
  },
  {
    key: 'products_services_image_2',
    label: 'Products & Services Image 2',
    sublabel: 'Distribution Services category image.',
    aspectRatio: 'banner',
    badge: 'Product 2',
  },
  {
    key: 'products_services_image_3',
    label: 'Products & Services Image 3',
    sublabel: 'Feed & Related Products category image.',
    aspectRatio: 'banner',
    badge: 'Product 3',
  },
  {
    key: 'products_services_image_4',
    label: 'Products & Services Image 4',
    sublabel: 'Business Supply & Bulk Trade category image.',
    aspectRatio: 'banner',
    badge: 'Product 4',
  },
  {
    key: 'businesses_banner',
    label: 'Businesses Page Banner (Selected Company)',
    sublabel: 'Facility banner shown on this company flip card on the Our Businesses page.',
    aspectRatio: 'banner',
    badge: 'Business Banner',
  },
]

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
    cms_testimonials: buildTestimonials([]),
    gallery_image_1: '',
    gallery_image_2: '',
    gallery_image_3: '',
    gallery_image_4: '',
    landing_slide_1: '',
    landing_slide_2: '',
    landing_slide_3: '',
    landing_feature_image: '',
    landing_service_image_1: '',
    landing_service_image_2: '',
    landing_service_image_3: '',
    landing_contact_image_1: '',
    landing_contact_image_2: '',
    landing_form_image: '',
    cms_images: {},
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
          cms_testimonials: buildTestimonials(data.cms_testimonials),
          gallery_image_1: data.gallery_image_1 || '',
          gallery_image_2: data.gallery_image_2 || '',
          gallery_image_3: data.gallery_image_3 || '',
          gallery_image_4: data.gallery_image_4 || '',
          landing_slide_1: data.landing_slide_1 || '',
          landing_slide_2: data.landing_slide_2 || '',
          landing_slide_3: data.landing_slide_3 || '',
          landing_feature_image: data.landing_feature_image || '',
          landing_service_image_1: data.landing_service_image_1 || '',
          landing_service_image_2: data.landing_service_image_2 || '',
          landing_service_image_3: data.landing_service_image_3 || '',
          landing_contact_image_1: data.landing_contact_image_1 || '',
          landing_contact_image_2: data.landing_contact_image_2 || '',
          landing_form_image: data.landing_form_image || '',
          cms_images:
            data.cms_images && !Array.isArray(data.cms_images) && typeof data.cms_images === 'object'
              ? data.cms_images
              : {},
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

  const handleTestimonialChange = (index, field, value) => {
    setFormData((prev) => {
      const testimonials = buildTestimonials(prev.cms_testimonials)
      testimonials[index] = { ...testimonials[index], [field]: value }
      return { ...prev, cms_testimonials: testimonials }
    })
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#071426] via-[#0b3558] to-[#071426] p-6 rounded-2xl text-white shadow-xl border border-[#b37d14]/30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A227]/15 text-[#E0BD55] border border-[#C9A227]/30">
              <Globe className="w-5 h-5 text-[#E0BD55]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Website CMS & Invoice Master
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C9A227]/15 text-[#E0BD55] border border-[#C9A227]/30 font-bold">
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
          <Building className="w-4 h-4 text-[#E0BD55] shrink-0 ml-1" />
          <span className="text-xs font-bold text-slate-200">Company:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-white text-[#071426] text-xs font-extrabold py-1.5 px-3 rounded-lg border-0 shadow-inner focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15 cursor-pointer"
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
      <div className="bg-[#fdfbf7] border border-[#b37d14]/25 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-[#b37d14] shrink-0 mt-0.5" />
        <div className="text-xs text-[#071426] space-y-0.5">
          <p className="font-bold">Automatic Invoice & Website Sync Enabled</p>
          <p className="text-[#5f4a1f]">
            Details configured here (Company Name, Tagline, Address, Phone 1, Phone 2, GSTIN, Bank Details) automatically populate onto all official <strong>Settlement Bills, Debit Notes, Inward receipts, Outward dispatches</strong>, and the public company website.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-[#e7ddc8]">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#b37d14] mb-2" />
          <p className="text-xs font-bold">Loading company CMS information...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Sticky section navigator — every section stays expanded, including logos */}
          <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-[#fdfbf7]/95 backdrop-blur border-y border-[#e7ddc8]">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 pr-1">
                Jump to
              </span>
              {CMS_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold transition-colors ${
                    section.group === 'website'
                      ? 'bg-[#0b3558] text-white border-[#0b3558] hover:bg-[#07233b]'
                      : section.group === 'branding'
                        ? 'bg-[#fbf5ea] text-[#8a5f0a] border-[#b37d14]/30 hover:bg-[#f7efdf]'
                        : 'bg-white text-[#0b3558] border-[#e2d6bd] hover:bg-[#fbf5ea]'
                  }`}
                >
                  {section.label}
                </a>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
              All sections stay expanded — logo & signature management is always visible.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="h-px flex-1 bg-[#e7ddc8]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Company & Billing
            </span>
            <span className="h-px flex-1 bg-[#e7ddc8]" />
          </div>

          {/* Section 1: Company Profile & Taglines */}
          <div id="cms-profile" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#eee5d3] pb-3">
              <Building className="w-4 h-4 text-[#b37d14]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                1. Company Profile & Taglines
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Company Registered Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Trade Name</label>
                <input
                  type="text"
                  name="trade_name"
                  value={formData.trade_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Short Name / Code</label>
                <input
                  type="text"
                  name="short_name"
                  value={formData.short_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#0b3558] mb-1">Tagline (Printed on Bills)</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. MANUFACTURERS OF DE-OILED RICE BRAN"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Sub-Tagline</label>
                <input
                  type="text"
                  name="sub_tagline"
                  value={formData.sub_tagline}
                  onChange={handleChange}
                  placeholder="e.g. & ALL KINDS OF CATTLE FEEDS"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-bold text-[#0b3558] mb-1">About Company / Overview (Website)</label>
                <textarea
                  name="about_us"
                  rows={3}
                  value={formData.about_us}
                  onChange={handleChange}
                  placeholder="Write a brief description of the company, its legacy, products, and manufacturing standard..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Numbers & Location (2 Mobile Numbers) */}
          <div id="cms-contact" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#eee5d3] pb-3">
              <Phone className="w-4 h-4 text-[#b37d14]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                2. Contact Numbers (2 Mobile Numbers) & Address
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0b3558] mb-1">
                  Primary Mobile / Phone 1 *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98424 56789"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">
                  Secondary Mobile / Phone 2 (Optional)
                </label>
                <input
                  type="text"
                  name="phone_2"
                  value={formData.phone_2}
                  onChange={handleChange}
                  placeholder="e.g. +91 98424 99999"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Official Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="info@laxmitraders.in"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Website URL</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://shrieelaxmi.in"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#0b3558] mb-1">Physical Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Door No, Street Name, Industrial Estate"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Kangayam"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="638701"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Tamil Nadu"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">State Code</label>
                <input
                  type="text"
                  name="state_code"
                  value={formData.state_code}
                  onChange={handleChange}
                  placeholder="33"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">GSTIN</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="33AAACL1234F1Z1"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">PAN Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="AAACL1234F"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Google Map Location Option */}
          <div id="cms-map" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#eee5d3] pb-3">
              <MapPin className="w-4 h-4 text-[#b37d14]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                3. Google Map Option (Interactive Embed & Link)
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0b3558] mb-1">
                  Google Map Embed URL or Link (or paste complete &lt;iframe&gt; code)
                </label>
                <input
                  type="text"
                  name="map_url"
                  value={formData.map_url}
                  onChange={handleChange}
                  placeholder="https://www.google.com/maps/embed?pb=... or https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Tip: In Google Maps, click <strong>Share → Embed a map → Copy HTML</strong> and paste it here. It will automatically extract the embed URL.
                </p>
              </div>

              {/* Map Preview */}
              {formData.map_url && (
                <div className="mt-3 border border-[#e7ddc8] rounded-xl overflow-hidden shadow-inner">
                  <div className="bg-[#fbf5ea] px-3 py-1.5 text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Live Google Map Preview
                    </span>
                    <a
                      href={getCleanMapUrl(formData.map_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8a5f0a] hover:underline flex items-center gap-1 text-[10px]"
                    >
                      Open in Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="h-56 w-full bg-[#fdfbf7]">
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
          <div id="cms-bank" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#eee5d3] pb-3">
              <CreditCard className="w-4 h-4 text-[#b37d14]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                4. Bank Account Details (Printed on Invoices & Bills)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Branch</label>
                <input
                  type="text"
                  name="branch_bank"
                  value={formData.branch_bank}
                  onChange={handleChange}
                  placeholder="e.g. Kangayam Main Branch"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="e.g. 30123456789"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">IFSC Code</label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={handleChange}
                  placeholder="e.g. SBIN0001234"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Document Prefixes & Invoice Settings */}
          <div id="cms-documents" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#eee5d3] pb-3">
              <FileText className="w-4 h-4 text-[#b37d14]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                5. Document Number Prefixes & Terms
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Settlement Bill Prefix</label>
                <input
                  type="text"
                  name="settlement_prefix"
                  value={formData.settlement_prefix}
                  onChange={handleChange}
                  placeholder="SB"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Debit Note Prefix</label>
                <input
                  type="text"
                  name="debit_note_prefix"
                  value={formData.debit_note_prefix}
                  onChange={handleChange}
                  placeholder="DN"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  name="invoice_prefix"
                  value={formData.invoice_prefix}
                  onChange={handleChange}
                  placeholder="INV"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#0b3558] mb-1">Terms & Conditions</label>
                <textarea
                  name="terms_conditions"
                  rows={2}
                  value={formData.terms_conditions}
                  onChange={handleChange}
                  placeholder="Subject to Kangayam jurisdiction only..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">Signatory Title</label>
                <input
                  type="text"
                  name="authorized_signatory_title"
                  value={formData.authorized_signatory_title}
                  onChange={handleChange}
                  placeholder="For LAXMI TRADERS, Partner"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="h-px flex-1 bg-[#e7ddc8]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#b37d14]">
              Website Content & Images
            </span>
            <span className="h-px flex-1 bg-[#e7ddc8]" />
          </div>

          {/* Section 6: Website Hero & Services */}
          <div id="cms-hero" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#eee5d3] pb-3">
              <Globe className="w-4 h-4 text-[#b37d14]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                6. Website Showcase & Services (Public CMS)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0b3558] mb-1">CMS Hero Title</label>
                <input
                  type="text"
                  name="cms_hero_title"
                  value={formData.cms_hero_title}
                  onChange={handleChange}
                  placeholder="e.g. Leading Processing of Premium De-Oiled Rice Bran"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0b3558] mb-1">CMS Hero Subtitle</label>
                <input
                  type="text"
                  name="cms_hero_subtitle"
                  value={formData.cms_hero_subtitle}
                  onChange={handleChange}
                  placeholder="e.g. Trusted by 250+ partners across South India with ISO tested laboratory accuracy."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#0b3558] mb-1">Services & Product Highlights</label>
                <textarea
                  name="cms_services"
                  rows={2}
                  value={formData.cms_services}
                  onChange={handleChange}
                  placeholder="List primary products and services separated by commas (e.g. De-Oiled Rice Bran, Raw Rice Bran, Quality Lab Testing, Bulk Dispatches)..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Customer Testimonials */}
          <div id="cms-testimonials" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eee5d3] pb-3">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#b37d14]" />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                  7. Customer Testimonials (Public Website)
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#fbf5ea] text-[#8a5f0a] border border-[#e2d6bd] w-fit">
                Up to 3 testimonials
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {formData.cms_testimonials.map((testimonial, index) => (
                <div key={index} className="rounded-xl border border-[#e7ddc8] bg-[#fdfbf7] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Testimonial {index + 1}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Number(testimonial.rating || 5)
                              ? 'text-[#b37d14] fill-[#C9A227]'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={testimonial.name}
                    onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)}
                    placeholder="Customer name"
                    className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] bg-white focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                  />

                  <input
                    type="text"
                    value={testimonial.role}
                    onChange={(e) => handleTestimonialChange(index, 'role', e.target.value)}
                    placeholder="Company / Farm / Role"
                    className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] bg-white focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                  />

                  <select
                    value={testimonial.rating || 5}
                    onChange={(e) => handleTestimonialChange(index, 'rating', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] bg-white focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15 cursor-pointer"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows={3}
                    value={testimonial.message}
                    onChange={(e) => handleTestimonialChange(index, 'message', e.target.value)}
                    placeholder="Write the customer feedback..."
                    className="w-full px-3 py-2 rounded-lg border border-[#e2d6bd] bg-white focus:outline-hidden focus:border-[#0b3558] focus:ring-2 focus:ring-[#0b3558]/15"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Website Gallery (Maximum 4 Images) */}
          <div id="cms-gallery" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eee5d3] pb-3">
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-[#b37d14]" />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                  8. Website Gallery (Maximum 4 Images)
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#fbf5ea] text-[#8a5f0a] border border-[#e2d6bd] w-fit">
                4 Upload Slots Only
              </span>
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              Upload up to 4 photos for the public gallery. Click any slot or drag a picture to upload. Empty slots will be hidden on the website.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((slot) => (
                <div key={slot} className="border border-[#e7ddc8] rounded-2xl p-4 bg-[#fdfbf7]">
                  <ReplaceablePicture
                    label={`Gallery Image ${slot}`}
                    sublabel={`Photo ${slot} of 4 shown on the public gallery section.`}
                    value={formData[`gallery_image_${slot}`]}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, [`gallery_image_${slot}`]: val }))
                    }
                    aspectRatio="banner"
                    badgeText={`Slot ${slot}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 9: Landing Page Images (Every Image Slot) */}
          <div id="cms-landing-images" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eee5d3] pb-3">
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-[#b37d14]" />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                  9. Landing Page Images (Every Image Slot)
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#fbf5ea] text-[#8a5f0a] border border-[#e2d6bd] w-fit">
                10 Replaceable Pictures
              </span>
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              Replace every image shown on the public landing page. Click any slot or drag a picture to upload. Empty slots fall back to the default image on the website.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {LANDING_IMAGE_SLOTS.map((slot) => (
                <div key={slot.key} className="border border-[#e7ddc8] rounded-2xl p-4 bg-[#fdfbf7]">
                  <ReplaceablePicture
                    label={slot.label}
                    sublabel={slot.sublabel}
                    value={formData[slot.key]}
                    onChange={(val) => setFormData((prev) => ({ ...prev, [slot.key]: val }))}
                    aspectRatio={slot.aspectRatio}
                    badgeText={slot.badge}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 10: Other Website Pages Images */}
          <div id="cms-page-images" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eee5d3] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#b37d14]" />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                  10. Other Website Page Images
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#fbf5ea] text-[#8a5f0a] border border-[#e2d6bd] w-fit">
                About • Products • Businesses
              </span>
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              Replace images on the About, Products & Services, and Our Businesses pages. Empty slots automatically show the default image.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {PAGE_IMAGE_SLOTS.map((slot) => (
                <div key={slot.key} className="border border-[#e7ddc8] rounded-2xl p-4 bg-[#fdfbf7]">
                  <ReplaceablePicture
                    label={slot.label}
                    sublabel={slot.sublabel}
                    value={formData.cms_images?.[slot.key] || ''}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        cms_images: { ...(prev.cms_images || {}), [slot.key]: val },
                      }))
                    }
                    aspectRatio={slot.aspectRatio}
                    badgeText={slot.badge}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="h-px flex-1 bg-[#e7ddc8]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#b37d14]">
              Branding & Signatures
            </span>
            <span className="h-px flex-1 bg-[#e7ddc8]" />
          </div>

          {/* Section 11: Replaceable Company Branding & Signatures */}
          <div id="cms-branding" className="scroll-mt-24 bg-white rounded-2xl border border-[#e7ddc8] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eee5d3] pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#b37d14]" />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#071426]">
                  11. Company Logos, Digital Signature & Page Banner
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#fbf5ea] text-[#8a5f0a] border border-[#e2d6bd] w-fit">
                Always Visible • Click or Drag File
              </span>
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              All branding assets below are <strong>replaceable pictures</strong>. Click directly on any picture or the <strong>Replace Picture</strong> button to upload an image file from your computer. No need to copy or type links!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Transparent Logo */}
              <div className="border border-[#b37d14]/30 rounded-2xl p-5 bg-gradient-to-b from-[#fbf5ea] to-white shadow-2xs">
                <ReplaceablePicture
                  label="Transparent Logo (PDF & Top Navbar)"
                  sublabel="High-resolution transparent PNG used on panel header and all official printed PDFs."
                  value={formData.logo_transparent_path}
                  onChange={(val) => setFormData((p) => ({ ...p, logo_transparent_path: val }))}
                  darkBg={true}
                  aspectRatio="logo"
                  badgeText="PDF & Navbar"
                />
              </div>

              {/* 2. Digital Signature */}
              <div className="border border-[#b37d14]/30 rounded-2xl p-5 bg-gradient-to-b from-[#fbf5ea] to-white shadow-2xs">
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
              <div className="border border-[#e7ddc8] rounded-2xl p-5 bg-[#fdfbf7] shadow-2xs">
                <ReplaceablePicture
                  label="Solid Background Logo"
                  sublabel="General solid background logo for public cards, emails, and website sections."
                  value={formData.logo_path}
                  onChange={(val) => setFormData((p) => ({ ...p, logo_path: val }))}
                  darkBg={false}
                  aspectRatio="logo"
                  badgeText="General Web"
                />
              </div>

              {/* 4. Hero Banner */}
              <div className="border border-[#e7ddc8] rounded-2xl p-5 bg-[#fdfbf7] shadow-2xs">
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
          <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#b37d14]/35 shadow-xl">
            <div className="text-xs text-[#334155] font-medium">
              Save changes to update invoices, settlement bills, and website pages for{' '}
              <strong className="text-[#071426]">{formData.company_name || 'selected company'}</strong>.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-[#0b3558] hover:bg-[#07233b] text-white border border-[#b37d14]/40 shadow-lg shadow-[#0b3558]/15 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#E0BD55]" />
                  Saving Updates...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#E0BD55]" />
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
