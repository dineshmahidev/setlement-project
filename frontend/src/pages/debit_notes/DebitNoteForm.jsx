import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api, { apiErrorMessage, openPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Save, Printer, Building, Users2, FileText, Calculator, Plus, Trash2 } from 'lucide-react'
import { Autocomplete, PageSpinner } from '../../components'
import { today, extractList } from '../../utils/helpers'

export default function DebitNoteForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { branchId } = useAuth()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [branchesList, setBranchesList] = useState([])
  const [vendorsList, setVendorsList] = useState([])
  const [invoicesList, setInvoicesList] = useState([])
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    debit_note_number: '',
    date: today(),
    branch_id: branchId || '',
    vendor_id: '',
    settlement_id: '',
    invoice_id: '',
    invoice_number: '',
    invoice_date: '',
    lot_number: '',
    reason: 'Rebate on Oil Content Settlement',
    transaction_type: 'debit',
    taxable_amount: 0,
    is_interstate: false,
    cgst_rate: 2.5,
    sgst_rate: 2.5,
    igst_rate: 5.0,
    remarks: '',
    items: [
      { particulars: 'Rebate difference on Oil Content quality settlement', amount: 0 },
    ],
  })

  // Calculations
  const [calc, setCalc] = useState({
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    total_amount: 0,
  })

  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true)
      try {
        const [bRes, vRes] = await Promise.all([
          api.get('/branches?all=true').catch(() => ({ data: { data: [] } })),
          api.get('/vendors?all=true').catch(() => ({ data: { data: [] } })),
        ])
        const bList = extractList(bRes)
        const vList = extractList(vRes)

        setBranchesList(bList)
        setVendorsList(vList)

        if (!isEdit && bList.length > 0 && !formData.branch_id) {
          setFormData((prev) => ({ ...prev, branch_id: bList[0].id }))
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load master data')
      } finally {
        setLoading(false)
      }
    }
    loadMasters()
  }, [])

  useEffect(() => {
    if (isEdit) {
      const loadNote = async () => {
        try {
          const res = await api.get(`/debit-notes/${id}`)
          const dn = res.data?.data || res.data
          if (dn) {
            setFormData({
              debit_note_number: dn.debit_note_number || '',
              date: dn.date || today(),
              branch_id: dn.branch_id || '',
              vendor_id: dn.vendor_id || '',
              settlement_id: dn.settlement_id || '',
              invoice_id: dn.invoice_id || '',
              invoice_number: dn.invoice_number || '',
              invoice_date: dn.invoice_date || '',
              lot_number: dn.lot_number || '',
              reason: dn.reason || 'Rebate',
              transaction_type: dn.transaction_type || 'debit',
              taxable_amount: parseFloat(dn.taxable_amount) || 0,
              is_interstate: Boolean(dn.is_interstate),
              cgst_rate: parseFloat(dn.cgst_rate) || 2.5,
              sgst_rate: parseFloat(dn.sgst_rate) || 2.5,
              igst_rate: parseFloat(dn.igst_rate) || 5.0,
              remarks: dn.remarks || '',
              items: dn.items?.length > 0 ? dn.items.map((i) => ({ particulars: i.particulars, amount: parseFloat(i.amount) })) : [
                { particulars: dn.reason || 'Rebate', amount: parseFloat(dn.taxable_amount) || 0 },
              ],
            })
          }
        } catch (err) {
          toast.error('Failed to load debit note')
          navigate('/panel/debit-notes')
        }
      }
      loadNote()
    }
  }, [id, isEdit])

  // Instant calculation effect
  useEffect(() => {
    const taxable = parseFloat(formData.taxable_amount) || 0
    let cgst = 0
    let sgst = 0
    let igst = 0

    if (formData.is_interstate) {
      const igstRate = parseFloat(formData.igst_rate) || 0
      igst = Number(((taxable * igstRate) / 100.0).toFixed(2))
    } else {
      const cgstRate = parseFloat(formData.cgst_rate) || 0
      const sgstRate = parseFloat(formData.sgst_rate) || 0
      cgst = Number(((taxable * cgstRate) / 100.0).toFixed(2))
      sgst = Number(((taxable * sgstRate) / 100.0).toFixed(2))
    }

    const total = Number((taxable + cgst + sgst + igst).toFixed(2))

    setCalc({
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      total_amount: total,
    })
  }, [formData.taxable_amount, formData.is_interstate, formData.cgst_rate, formData.sgst_rate, formData.igst_rate])

  const handleVendorSelect = async (vendor) => {
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendor_id: vendor.id,
        is_interstate: vendor.state && vendor.state.toLowerCase() !== 'tamil nadu',
      }))
      try {
        const res = await api.get('/invoices', {
          params: { vendor_id: vendor.id, per_page: 15 },
        })
        setInvoicesList(extractList(res))
      } catch (err) {
        console.error(err)
        setInvoicesList([])
      }
    }
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { particulars: '', amount: 0 }],
    }))
  }

  const handleRemoveItem = (index) => {
    const updated = formData.items.filter((_, i) => i !== index)
    const sumTaxable = updated.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
    setFormData((prev) => ({
      ...prev,
      items: updated,
      taxable_amount: sumTaxable,
    }))
  }

  const handleItemChange = (index, field, val) => {
    const updated = [...formData.items]
    updated[index][field] = val
    const sumTaxable = updated.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
    setFormData((prev) => ({
      ...prev,
      items: updated,
      taxable_amount: sumTaxable > 0 ? sumTaxable : prev.taxable_amount,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const payload = {
        ...formData,
        branch_id: formData.branch_id || branchId || (branchesList[0]?.id || 1),
      }
      if (isEdit) {
        await api.put(`/debit-notes/${id}`, payload)
        toast.success('Debit note updated successfully')
      } else {
        await api.post('/debit-notes', payload)
        toast.success('Debit note created and posted to ledger')
      }
      navigate('/panel/debit-notes')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
        toast.error('Please verify required fields')
      } else {
        toast.error(apiErrorMessage(err, 'Failed to save debit note'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <PageSpinner label="Loading debit note workspace..." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/panel/debit-notes"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b3558] text-white hover:bg-[#07233b] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0b3558]">
              {isEdit ? `Edit ${formData.transaction_type.toUpperCase()} Note #${formData.debit_note_number}` : 'Create Debit / Credit Note'}
            </h1>
            <p className="text-xs font-semibold text-slate-500">Record price difference, quality rebate, and update vendor ledger balance</p>
          </div>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={() => openPdf(`/debit-notes/${id}/pdf`, `${formData.debit_note_number}.pdf`)}
            className="flex items-center gap-2 rounded-xl bg-[#b37d14] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#96670e] transition-colors"
          >
            <Printer className="w-4 h-4 text-white" />
            Print Note PDF
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Accounting Nature & Party (Solid Container) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="bg-[#0b3558] text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#d69e2e]" />
              Accounting Nature & Party
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Transaction Nature <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="w-full rounded-xl bg-[#0b3558] px-3.5 py-2.5 text-xs font-black text-white focus:outline-none"
              >
                <option value="debit">Debit Note (Decreases Vendor Balance - Rebate)</option>
                <option value="credit">Credit Note (Increases Vendor Balance - Premium)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Note Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Autocomplete
              label="Vendor / Party"
              required
              items={vendorsList}
              value={formData.vendor_id}
              onChange={(val) => setFormData({ ...formData, vendor_id: val })}
              onSelect={handleVendorSelect}
              displayKey="vendor_name"
              secondaryKey="vendor_code"
              extraInfoKey="gstin"
              placeholder="Search vendor name, code, GSTIN..."
              error={errors.vendor_id ? errors.vendor_id[0] : ''}
            />

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Reason for Adjustment <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Rebate on Oil Content Settlement"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
          </div>

          {/* Reference Invoice Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Original Invoice No</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="e.g. 68"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Original Invoice Date</label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Lot Number</label>
              <input
                type="text"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                placeholder="e.g. RB-G2/080803/26-27"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Note Number</label>
              <input
                type="text"
                value={formData.debit_note_number}
                onChange={(e) => setFormData({ ...formData, debit_note_number: e.target.value })}
                placeholder="Leave blank for auto-generate"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Items, Taxable Base & GST Breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="bg-[#b37d14] text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-white" />
              Adjustment Particulars & GST Calculation
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 rounded-lg bg-[#96670e] px-2.5 py-1 text-xs font-black text-white hover:bg-[#78350f] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Particular Row
            </button>
          </div>

          {/* Particular items table */}
          <div className="space-y-3">
            {(Array.isArray(formData.items) ? formData.items : []).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    value={item.particulars}
                    onChange={(e) => handleItemChange(index, 'particulars', e.target.value)}
                    placeholder="Description / Particulars (e.g. Rebate difference on 15.095 MT)"
                    className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
                  />
                </div>
                <div className="w-52">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="Taxable Amount (₹)"
                    className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-black text-slate-900 text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
                  />
                </div>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="rounded-xl p-2.5 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Tax Rates Configuration */}
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
                <span className="text-xl font-black text-white">₹{Number(formData.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {!formData.is_interstate ? (
                <>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">CGST 2.5%</span>
                    <span className="text-xl font-black text-white">₹{calc.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">SGST 2.5%</span>
                    <span className="text-xl font-black text-white">₹{calc.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">IGST 5.0%</span>
                  <span className="text-xl font-black text-white">₹{calc.igst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="bg-[#b37d14] rounded-xl p-3 shadow-inner">
                <span className="text-[11px] uppercase tracking-wider text-amber-100 font-black block">Total Note Value</span>
                <span className="text-2xl font-black text-white">
                  ₹{calc.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Remarks / Audit Note</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              placeholder="Reason for adjustment, lab reference..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/panel/debit-notes')}
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
            {saving ? 'Processing...' : isEdit ? 'Update Note' : 'Save Note & Post Ledger'}
          </button>
        </div>
      </form>
    </div>
  )
}
