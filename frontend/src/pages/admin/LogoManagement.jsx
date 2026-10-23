import React, { useEffect, useState } from 'react'
import { Image as ImageIcon, Globe, FileText, Save, CheckCircle2, Monitor } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ReplaceablePicture from '../../components/ReplaceablePicture'
import { PageHeader, Select, Button } from '../../components'
import { companyInitials } from '../../utils/helpers'

function Toggle({ checked, onChange, label, hint, icon: Icon }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 cursor-pointer hover:border-amber-300 transition-all">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-200" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

export default function LogoManagement() {
  const { companies, activeCompany, setCompanyById } = useAuth()
  const toast = useToast()

  const [companyList, setCompanyList] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [logo, setLogo] = useState('')
  const [showWebsite, setShowWebsite] = useState(true)
  const [showPdf, setShowPdf] = useState(true)
  const [companyName, setCompanyName] = useState('')

  // Load all companies for the selector
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/companies/all')
        const list = res.data?.data || []
        setCompanyList(list)
        if (list.length > 0) {
          setSelectedCompanyId(String(activeCompany?.id || list[0].id))
        }
      } catch {
        if (companies && companies.length > 0) {
          setCompanyList(companies)
          setSelectedCompanyId(String(activeCompany?.id || companies[0].id))
        }
      }
    }
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load selected company's logo settings
  useEffect(() => {
    if (!selectedCompanyId) return
    let alive = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/companies/${selectedCompanyId}`)
        const data = res.data?.data || {}
        if (!alive) return
        setLogo(data.logo_transparent_path || data.logo_path || '')
        setShowWebsite(data.show_logo_website !== false)
        setShowPdf(data.show_logo_pdf !== false)
        setCompanyName(data.company_name || '')
      } catch {
        toast.error('Failed to load company logo settings')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId])

  const handleSave = async () => {
    if (!selectedCompanyId) return
    setSaving(true)
    try {
      const payload = {
        logo_transparent_path: logo || null,
        logo_path: logo || null,
        show_logo_website: showWebsite,
        show_logo_pdf: showPdf,
      }
      const res = await api.put(`/companies/${selectedCompanyId}`, payload)
      const updated = res.data?.data
      toast.success('Logo settings saved')
      if (updated) {
        setCompanyList((list) => list.map((c) => (Number(c.id) === Number(updated.id) ? { ...c, ...updated } : c)))
        if (Number(updated.id) === Number(activeCompany?.id)) {
          setCompanyById(Number(updated.id))
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save logo settings')
    } finally {
      setSaving(false)
    }
  }

  const initials = companyInitials({ company_name: companyName || companyList.find((c) => Number(c.id) === Number(selectedCompanyId))?.company_name })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Logo Management"
        subtitle="Upload the company logo and choose where it appears"
        actions={
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <span className="text-xs font-black uppercase tracking-wide text-slate-600">Company:</span>
        <div className="w-72">
          <Select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
            {companyList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </Select>
        </div>
        {loading && <span className="text-xs font-semibold text-slate-400">Loading…</span>}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* LEFT — controls */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">Company Logo</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              One upload updates both the transparent &amp; solid logo used across the app and PDFs.
            </p>
          </div>

          <ReplaceablePicture
            label="Company Logo"
            sublabel="PNG, JPG, WEBP or SVG — transparent background recommended"
            value={logo}
            onChange={setLogo}
            darkBg
            aspectRatio="logo"
          />

          <div className="space-y-3 pt-1">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">Visibility</h3>
            <Toggle
              checked={showWebsite}
              onChange={setShowWebsite}
              label="Visible in Website"
              hint="Off → the app header shows the company initials instead of the logo."
              icon={Globe}
            />
            <Toggle
              checked={showPdf}
              onChange={setShowPdf}
              label="Visible in PDF"
              hint="Off → every PDF shows only the company initials instead of the logo."
              icon={FileText}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs font-semibold text-amber-900">
              Initials are derived from the company name — first letter of the first two words
              (e.g. <span className="font-black">Laxmi Traders → LT</span>).
            </p>
          </div>
        </div>

        {/* RIGHT — live previews */}
        <div className="space-y-4">
          {/* Website preview */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <Monitor className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-black uppercase tracking-wide text-slate-700">Website Preview</span>
              <span
                className={`ml-auto rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                  showWebsite ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {showWebsite ? 'Logo Visible' : 'Initials Only'}
              </span>
            </div>
            {/* Mini app-header mock */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow">
                  {showWebsite && logo ? (
                    <img
                      src={logo.startsWith('/') || logo.startsWith('data:') ? logo : `/${logo}`}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-md bg-[#0B1A2D] text-sm font-black text-[#C6F432]">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-white">{companyName || 'Company Name'}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Active Company</div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 text-[11px] text-slate-500">
              {showWebsite
                ? 'Header shows the uploaded logo image.'
                : 'Header hides the logo and shows the company initials instead.'}
            </div>
          </div>

          {/* PDF preview */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-black uppercase tracking-wide text-slate-700">PDF Preview</span>
              <span
                className={`ml-auto rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                  showPdf ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {showPdf ? 'Logo Visible' : 'Initials Only'}
              </span>
            </div>
            {/* Mini invoice/PDF header mock */}
            <div className="bg-slate-100 p-5">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-start gap-3 border-b border-dashed border-slate-200 pb-3">
                  <div
                    className={`flex shrink-0 items-center justify-center overflow-hidden ${
                      showPdf && logo ? '' : 'border-[1.5px] border-[#0b3558] bg-slate-50'
                    }`}
                    style={
                      showPdf && logo
                        ? undefined
                        : { width: 50, height: 50, fontSize: 18, fontWeight: 800, color: '#0b3558' }
                    }
                  >
                    {showPdf && logo ? (
                      <img
                        src={logo.startsWith('/') || logo.startsWith('data:') ? logo : `/${logo}`}
                        alt="Logo preview"
                        className="max-h-[50px] max-w-[58px] object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-800">{companyName || 'Company Name'}</div>
                    <div className="truncate text-[10px] text-slate-500">Address line · GSTIN: 00AABCU9603R1ZX</div>
                    <div className="truncate text-[10px] text-slate-500">Phone: +91 00000 00000 · info@company.com</div>
                  </div>
                  <div className="ml-auto rounded bg-slate-800 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                    Invoice
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[92, 78, 85].map((w, i) => (
                    <div key={i} className="h-2 rounded bg-slate-100" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 text-[11px] text-slate-500">
              {showPdf
                ? 'PDF headers show the uploaded logo image.'
                : 'PDF headers hide the logo and show only the company initials.'}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
            <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
            Previews update live — press <span className="font-black">Save Changes</span> to apply them across the app and PDFs.
          </div>
        </div>
      </div>
    </div>
  )
}
