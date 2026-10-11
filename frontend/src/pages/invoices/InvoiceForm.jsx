import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Save, Sparkles, Building, Users2, Package, Calculator, CheckCircle2 } from 'lucide-react'
import { Autocomplete, PageSpinner } from '../../components'
import { today, extractList } from '../../utils/helpers'

export default function InvoiceForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { branchId, branches } = useAuth()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [branchesList, setBranchesList] = useState([])
  const [vendorsList, setVendorsList] = useState([])
  const [productsList, setProductsList] = useState([])
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: today(),
    branch_id: branchId || '',
    vendor_id: '',
    product_id: '',
    lot_number: '',
    vehicle_number: '',
    net_weight_mt: '',
    rate: '',
    is_interstate: false,
    cgst_rate: 2.5,
    sgst_rate: 2.5,
    igst_rate: 5.0,
    remarks: '',
  })

  // Live calculated fields
  const [calculations, setCalculations] = useState({
    taxable_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    total_amount: 0,
  })

  // Load masters
  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true)
      try {
        const [bRes, vRes, pRes] = await Promise.all([
          api.get('/branches?all=true').catch(() => ({ data: { data: [] } })),
          api.get('/vendors?all=true').catch(() => ({ data: { data: [] } })),
          api.get('/products?all=true').catch(() => ({ data: { data: [] } })),
        ])
        const bList = extractList(bRes)
        const vList = extractList(vRes)
        const pList = extractList(pRes)

        setBranchesList(bList)
        setVendorsList(vList)
        setProductsList(pList)

        if (!isEdit && bList.length > 0 && !formData.branch_id) {
          setFormData((prev) => ({ ...prev, branch_id: bList[0].id }))
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load master configuration data')
      } finally {
        setLoading(false)
      }
    }
    loadMasters()
  }, [])

  // Load invoice if editing
  useEffect(() => {
    if (isEdit) {
      const loadInvoice = async () => {
        try {
          const res = await api.get(`/invoices/${id}`)
          const inv = res.data?.data || res.data
          if (inv) {
            setFormData({
              invoice_number: inv.invoice_number || '',
              invoice_date: inv.invoice_date ? inv.invoice_date.split('T')[0] : today(),
              branch_id: inv.branch_id || '',
              vendor_id: inv.vendor_id || '',
              product_id: inv.product_id || '',
              lot_number: inv.lot_number || '',
              vehicle_number: inv.vehicle_number || '',
              net_weight_mt: inv.net_weight_mt ?? '',
              rate: inv.rate ?? '',
              is_interstate: Boolean(inv.is_interstate),
              cgst_rate: inv.cgst_rate ?? 2.5,
              sgst_rate: inv.sgst_rate ?? 2.5,
              igst_rate: inv.igst_rate ?? 5.0,
              remarks: inv.remarks || '',
            })
          }
        } catch (err) {
          toast.error(apiErrorMessage(err, 'Failed to load invoice details'))
          navigate('/panel/invoices')
        }
      }
      loadInvoice()
    }
  }, [id, isEdit])

  // Instant calculation effect
  useEffect(() => {
    const weight = parseFloat(formData.net_weight_mt) || 0
    const rate = parseFloat(formData.rate) || 0
    const taxable = Number((weight * rate).toFixed(2))

    let cgst = 0
    let sgst = 0
    let igst = 0

    if (formData.is_interstate) {
      const igstRate = parseFloat(formData.igst_rate) || 0
      igst = Number(((taxable * igstRate) / 100).toFixed(2))
    } else {
      const cgstRate = parseFloat(formData.cgst_rate) || 0
      const sgstRate = parseFloat(formData.sgst_rate) || 0
      cgst = Number(((taxable * cgstRate) / 100).toFixed(2))
      sgst = Number(((taxable * sgstRate) / 100).toFixed(2))
    }

    const total = Number((taxable + cgst + sgst + igst).toFixed(2))

    setCalculations({
      taxable_amount: taxable,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      total_amount: total,
    })
  }, [formData.net_weight_mt, formData.rate, formData.is_interstate, formData.cgst_rate, formData.sgst_rate, formData.igst_rate])

  const handleProductSelect = (prod) => {
    if (prod) {
      setFormData((prev) => ({
        ...prev,
        product_id: prod.id,
        rate: prev.rate || prod.default_rate || '',
        cgst_rate: prod.default_cgst ?? 2.5,
        sgst_rate: prod.default_sgst ?? 2.5,
        igst_rate: prod.default_igst ?? 5.0,
      }))
    }
  }

  const handleVendorSelect = (vendor) => {
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendor_id: vendor.id,
        is_interstate: vendor.state && vendor.state.toLowerCase() !== 'tamil nadu',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const payload = {
        ...formData,
        net_weight_mt: parseFloat(formData.net_weight_mt) || 0,
        rate: parseFloat(formData.rate) || 0,
        cgst_rate: parseFloat(formData.cgst_rate) || 0,
        sgst_rate: parseFloat(formData.sgst_rate) || 0,
        igst_rate: parseFloat(formData.igst_rate) || 0,
      }

      if (isEdit) {
        await api.put(`/invoices/${id}`, payload)
        toast.success('Purchase invoice updated successfully')
      } else {
        await api.post('/invoices', payload)
        toast.success('Purchase invoice created and posted to ledger')
      }
      navigate('/panel/invoices')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
        toast.error('Please check the required fields')
      } else {
        toast.error(apiErrorMessage(err, 'Failed to save invoice'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <PageSpinner label="Loading invoice workspace..." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/panel/invoices"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b3558] text-white hover:bg-[#07233b] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0b3558]">
              {isEdit ? 'Edit Purchase Invoice' : 'New Vendor Delivery Invoice'}
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Record original consignments and post to vendor accounting ledger
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Basic & Reference Details (Solid Background) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="bg-[#0b3558] text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#d69e2e]" />
              Basic Billing & Delivery Information
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              >
                <option value="">Select Branch</option>
                {(Array.isArray(branchesList) ? branchesList : []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name} ({b.branch_code})
                  </option>
                ))}
              </select>
              {errors.branch_id && <p className="text-[11px] text-red-500 mt-1">{errors.branch_id[0]}</p>}
            </div>

            <div className="sm:col-span-2">
              <Autocomplete
                label="Vendor / Rice Mill"
                required
                items={vendorsList}
                value={formData.vendor_id}
                onChange={(val) => setFormData({ ...formData, vendor_id: val })}
                onSelect={handleVendorSelect}
                displayKey="vendor_name"
                secondaryKey="vendor_code"
                extraInfoKey="gstin"
                placeholder="Type to search vendor by name, code or GSTIN..."
                error={errors.vendor_id ? errors.vendor_id[0] : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="Leave blank for auto-generate"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
              {errors.invoice_number && <p className="text-[11px] text-red-500 mt-1">{errors.invoice_number[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
              {errors.invoice_date && <p className="text-[11px] text-red-500 mt-1">{errors.invoice_date[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Lot Number</label>
              <input
                type="text"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                placeholder="e.g. LOT-2026-092"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                placeholder="e.g. TN 33 BM 4567"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Weight, Product & Calculations */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="bg-[#b37d14] text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-white" />
              Product, Net Weight & Live Calculations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Autocomplete
                label="Product"
                items={productsList}
                value={formData.product_id}
                onChange={(val) => setFormData({ ...formData, product_id: val })}
                onSelect={handleProductSelect}
                displayKey="product_name"
                secondaryKey="product_code"
                placeholder="Select Agro Product"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Net Weight (MT) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={formData.net_weight_mt}
                onChange={(e) => setFormData({ ...formData, net_weight_mt: e.target.value })}
                placeholder="0.000"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
              />
              {errors.net_weight_mt && <p className="text-[11px] text-red-500 mt-1">{errors.net_weight_mt[0]}</p>}
              <span className="text-[10.5px] font-bold text-slate-500 mt-1 block">
                = {(parseFloat(formData.net_weight_mt || 0) * 1000).toLocaleString('en-IN')} KG
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Contract Rate (â‚¹ / MT) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
              />
              {errors.rate && <p className="text-[11px] text-red-500 mt-1">{errors.rate[0]}</p>}
            </div>
          </div>

          {/* GST Configuration (Solid Container) */}
          <div className="rounded-xl bg-[#f4f6f9] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0b3558] uppercase">GST Tax Configuration</span>
              <label className="flex items-center gap-2 text-xs text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_interstate}
                  onChange={(e) => setFormData({ ...formData, is_interstate: e.target.checked })}
                  className="rounded text-[#0b3558] focus:ring-0"
                />
                <span>Interstate Sale (IGST applies)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {!formData.is_interstate ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">CGST (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cgst_rate}
                      onChange={(e) => setFormData({ ...formData, cgst_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl bg-white px-3 py-2 text-xs font-bold font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">SGST (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sgst_rate}
                      onChange={(e) => setFormData({ ...formData, sgst_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl bg-white px-3 py-2 text-xs font-bold font-mono text-slate-900"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">IGST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.igst_rate}
                    onChange={(e) => setFormData({ ...formData, igst_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-bold font-mono text-slate-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Calculation Summary Banner (Solid Royal Navy) */}
          <div className="rounded-2xl bg-[#0b3558] p-6 text-white shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">Taxable Base</span>
                <span className="text-xl font-black text-white">â‚¹{calculations.taxable_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {!formData.is_interstate ? (
                <>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">CGST 2.5%</span>
                    <span className="text-xl font-black text-white">â‚¹{calculations.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">SGST 2.5%</span>
                    <span className="text-xl font-black text-white">â‚¹{calculations.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">IGST 5.0%</span>
                  <span className="text-xl font-black text-white">â‚¹{calculations.igst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="bg-emerald-600 rounded-xl p-3 shadow-inner">
                <span className="text-[11px] uppercase tracking-wider text-emerald-100 font-black block">Total Invoice</span>
                <span className="text-2xl font-black text-white">
                  â‚¹{calculations.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Remarks / Notes</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              placeholder="Any invoice notes..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/panel/invoices')}
            className="rounded-xl bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#07233b] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save Invoice & Post Ledger'}
          </button>
        </div>
      </form>
    </div>
  )
}
