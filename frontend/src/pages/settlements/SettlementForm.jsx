import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api, { apiErrorMessage, openPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  ArrowLeft,
  Save,
  Printer,
  Scale,
  FlaskConical,
  Calculator,
  Receipt,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Eye,
  Percent,
  Truck,
  Building2,
  Coins,
} from 'lucide-react'
import { Autocomplete, PageSpinner, SettlementBillModal } from '../../components'
import { today, extractList } from '../../utils/helpers'

export default function SettlementForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { branchId } = useAuth()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [branchesList, setBranchesList] = useState([])
  const [vendorsList, setVendorsList] = useState([])
  const [productsList, setProductsList] = useState([])
  const [invoicesList, setInvoicesList] = useState([])
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    settlement_number: '',
    settlement_date: today(),
    branch_id: branchId || '',
    vendor_id: '',
    product_id: '',
    invoice_id: '',
    po_number: '',
    lot_number: '',
    bill_number: '',
    bill_date: '',
    vehicle_number: '',

    // Weights
    net_weight_mt: '',
    jute_bag: '',
    pp_bag: '',
    final_weight_mt: '',

    // QC Tests
    oil_content: '',
    ffa: 'PASS',
    ss: 'PASS',
    fibre: 'PASS',
    moisture: 'PASS',
    iv: '',
    calcium: '',
    protein: '',

    // Rates & Rate Basis
    rate_basis: 'per_10kg', // 'per_10kg', 'per_kg', 'per_mt'
    contract_unit_rate: '',
    final_unit_rate: '',

    // Charges
    bag_amount: '',
    loading_charges: '',
    unloading_charges: '',
    tds_rate: '', // Percentage input (e.g. 0.10 for 0.1% TDS)
    tds: '',      // Computed or manual TDS amount in ₹
    advance_paid: '',
    lorry_freight: '',
    other_charges: '',

    // Original Invoice & Rebate
    original_invoice_value: '',
    manual_adjustment: '',
    manual_adjustment_reason: '',

    // Taxes
    is_interstate: false,
    cgst_rate: 2.5,
    sgst_rate: 2.5,
    igst_rate: 5.0,

    remarks: '',
  })

  // Live calculation output state
  const [calc, setCalc] = useState({
    final_weight_mt: 0,
    final_weight_kg: 0,
    oil_quantity_kg: 0,
    bran_value: 0,
    rebate_amount: 0,
    subtotal_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    total_amount: 0,
    net_payable: 0,
    debit_note: {
      taxable_amount: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      total_amount: 0,
    },
  })

  const selectedVendor = useMemo(
    () => vendorsList.find((v) => String(v.id) === String(formData.vendor_id)),
    [vendorsList, formData.vendor_id]
  )
  const selectedBranch = useMemo(
    () => branchesList.find((b) => String(b.id) === String(formData.branch_id)),
    [branchesList, formData.branch_id]
  )
  const selectedProduct = useMemo(
    () => productsList.find((p) => String(p.id) === String(formData.product_id)),
    [productsList, formData.product_id]
  )

  const previewSettlement = useMemo(
    () => ({
      ...formData,
      id: id || 0,
      ...calc,
      vendor: selectedVendor || {
        vendor_name: 'SRI RAM AGRO',
        address: 'ARIYALUR, Tamil Nadu',
        city: 'ARIYALUR',
        state: 'Tamil Nadu',
        pincode: '621704',
        gstin: '33BWLPR6363A3ZN',
      },
      branch: selectedBranch || { branch_name: 'Head Office' },
      product: selectedProduct || { product_name: 'BOILED BRAN' },
      debit_notes: [
        {
          debit_note_number: `DN/${(formData.settlement_number || '1019').replace(/\D/g, '') || '1019'}/26-27`,
          taxable_amount: calc.rebate_amount || 0,
          total_amount: calc.debit_note?.total_amount || 0,
          date: formData.settlement_date,
        },
      ],
    }),
    [formData, calc, selectedVendor, selectedBranch, selectedProduct, id]
  )

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
        toast.error('Failed to load master configuration')
      } finally {
        setLoading(false)
      }
    }
    loadMasters()
  }, [])

  // Load settlement if edit mode
  useEffect(() => {
    if (isEdit && id) {
      const loadSettlement = async () => {
        try {
          const res = await api.get(`/settlements/${id}`)
          const s = res.data?.data
          if (s) {
            setFormData({
              settlement_number: s.settlement_number || '',
              settlement_date: s.settlement_date ? s.settlement_date.split('T')[0] : today(),
              branch_id: s.branch_id || '',
              vendor_id: s.vendor_id || '',
              product_id: s.product_id || '',
              invoice_id: s.invoice_id || '',
              po_number: s.po_number || '',
              lot_number: s.lot_number || '',
              bill_number: s.bill_number || '',
              bill_date: s.bill_date ? s.bill_date.split('T')[0] : '',
              vehicle_number: s.vehicle_number || '',

              net_weight_mt: s.net_weight_mt ? parseFloat(s.net_weight_mt) : '',
              jute_bag: s.jute_bag ? parseFloat(s.jute_bag) : '',
              pp_bag: s.pp_bag ? parseFloat(s.pp_bag) : '',
              final_weight_mt: s.final_weight_mt ? parseFloat(s.final_weight_mt) : '',

              oil_content: s.oil_content ? parseFloat(s.oil_content) : '',
              ffa: s.ffa || 'PASS',
              ss: s.ss || 'PASS',
              fibre: s.fibre || 'PASS',
              moisture: s.moisture || 'PASS',
              iv: s.iv !== null && s.iv !== undefined && s.iv !== '' ? s.iv : '',
              calcium: s.calcium !== null && s.calcium !== undefined && s.calcium !== '' ? s.calcium : '',
              protein: s.protein !== null && s.protein !== undefined && s.protein !== '' ? s.protein : '',

              rate_basis: s.rate_basis || (parseFloat(s.final_unit_rate) >= 500 ? 'per_10kg' : 'per_kg'),
              contract_unit_rate: s.contract_unit_rate ? parseFloat(s.contract_unit_rate) : '',
              final_unit_rate: s.final_unit_rate ? parseFloat(s.final_unit_rate) : '',

              bag_amount: s.bag_amount ? parseFloat(s.bag_amount) : '',
              loading_charges: s.loading_charges ? parseFloat(s.loading_charges) : '',
              unloading_charges: s.unloading_charges ? parseFloat(s.unloading_charges) : '',
              tds_rate: s.tds_rate ? parseFloat(s.tds_rate) : '',
              tds: s.tds ? parseFloat(s.tds) : '',
              advance_paid: s.advance_paid ? parseFloat(s.advance_paid) : '',
              lorry_freight: s.lorry_freight ? parseFloat(s.lorry_freight) : '',
              other_charges: s.other_charges ? parseFloat(s.other_charges) : '',

              original_invoice_value: s.original_invoice_value ? parseFloat(s.original_invoice_value) : '',
              manual_adjustment: s.manual_adjustment ? parseFloat(s.manual_adjustment) : '',
              manual_adjustment_reason: s.manual_adjustment_reason || '',

              is_interstate: Boolean(s.is_interstate),
              cgst_rate: parseFloat(s.cgst_rate) || 2.5,
              sgst_rate: parseFloat(s.sgst_rate) || 2.5,
              igst_rate: parseFloat(s.igst_rate) || 5.0,

              remarks: s.remarks || '',
            })
          }
        } catch (err) {
          toast.error('Failed to load settlement details')
          navigate('/panel/settlements')
        }
      }
      loadSettlement()
    }
  }, [id, isEdit])

  // Instant calculation effect with exact Agro Industry math
  useEffect(() => {
    // 1. Calculate final weight MT
    const netWeight = parseFloat(formData.net_weight_mt) || 0
    const juteBag = parseFloat(formData.jute_bag) || 0
    const ppBag = parseFloat(formData.pp_bag) || 0
    const autoFinalWeightMt = Math.max(0, netWeight - (juteBag + ppBag))
    const finalWeightMt = (formData.final_weight_mt !== '' && formData.final_weight_mt !== undefined && parseFloat(formData.final_weight_mt) > 0)
      ? parseFloat(formData.final_weight_mt)
      : autoFinalWeightMt
    const finalWeightKg = finalWeightMt * 1000

    // 2. Oil & Bran Value Calculation: Final Weight (MT) × Final Rate × Oil Content
    const oilContent = parseFloat(formData.oil_content) || 0
    const finalRate = parseFloat(formData.final_unit_rate) || 0
    const oilQtyKg = (finalWeightKg * oilContent) / 100.0

    // Formula: Final Weight (MT) × Final Rate × Oil Content
    const rawBranValue = finalWeightMt * finalRate * oilContent
    const branValue = Number(rawBranValue.toFixed(2))

    // 3. Charges & Deductions (TDS percentage calculation)
    const bagAmount = parseFloat(formData.bag_amount) || 0
    const loading = parseFloat(formData.loading_charges) || 0
    const unloading = parseFloat(formData.unloading_charges) || 0
    
    const tdsRate = parseFloat(formData.tds_rate) || 0
    const computedTds = tdsRate > 0 ? Number(((branValue * tdsRate) / 100.0).toFixed(2)) : (parseFloat(formData.tds) || 0)
    const tds = computedTds

    const adv = parseFloat(formData.advance_paid) || 0
    const freight = parseFloat(formData.lorry_freight) || 0
    const other = parseFloat(formData.other_charges) || 0
    const manualAdj = parseFloat(formData.manual_adjustment) || 0

    // 4. Note Calculation (Debit Note or Credit Note)
    const originalInvoice = parseFloat(formData.original_invoice_value) || 0
    let noteType = 'debit'
    let noteAmount = 0

    if (originalInvoice > 0) {
      const diff = (originalInvoice - branValue) + manualAdj
      if (diff >= 0) {
        noteType = 'debit'
        noteAmount = Number(diff.toFixed(2))
      } else {
        noteType = 'credit'
        noteAmount = Number(Math.abs(diff).toFixed(2))
      }
    } else if (manualAdj !== 0) {
      if (manualAdj >= 0) {
        noteType = 'debit'
        noteAmount = Number(manualAdj.toFixed(2))
      } else {
        noteType = 'credit'
        noteAmount = Number(Math.abs(manualAdj).toFixed(2))
      }
    }

    // 5. GST Calculation (Goods Taxable Base = Bran Value + Bag Amount)
    const taxableBase = Number(Math.max(0, branValue + bagAmount).toFixed(2))
    let cgst = 0
    let sgst = 0
    let igst = 0

    if (formData.is_interstate) {
      const igstRate = parseFloat(formData.igst_rate) || 0
      igst = Number(((taxableBase * igstRate) / 100.0).toFixed(2))
    } else {
      const cgstRate = parseFloat(formData.cgst_rate) || 0
      const sgstRate = parseFloat(formData.sgst_rate) || 0
      cgst = Number(((taxableBase * cgstRate) / 100.0).toFixed(2))
      sgst = Number(((taxableBase * sgstRate) / 100.0).toFixed(2))
    }

    const totalGst = Number((cgst + sgst + igst).toFixed(2))
    const subtotalAmount = Number((taxableBase + totalGst).toFixed(2))
    const totalAmount = subtotalAmount
    const netPayable = Number((subtotalAmount + loading - unloading - tds - adv - freight + other).toFixed(2))

    // Note on Rebate / Bonus (Auto calculation)
    let dnCgst = 0
    let dnSgst = 0
    let dnIgst = 0
    if (noteAmount > 0) {
      if (formData.is_interstate) {
        dnIgst = Number(((noteAmount * (parseFloat(formData.igst_rate) || 5.0)) / 100.0).toFixed(2))
      } else {
        dnCgst = Number(((noteAmount * (parseFloat(formData.cgst_rate) || 2.5)) / 100.0).toFixed(2))
        dnSgst = Number(((noteAmount * (parseFloat(formData.sgst_rate) || 2.5)) / 100.0).toFixed(2))
      }
    }
    const dnTotal = Number((noteAmount + dnCgst + dnSgst + dnIgst).toFixed(2))

    setCalc({
      final_weight_mt: finalWeightMt,
      final_weight_kg: finalWeightKg,
      oil_quantity_kg: oilQtyKg,
      bran_value: branValue,
      rebate_amount: noteAmount,
      note_type: noteType,
      note_amount: noteAmount,
      subtotal_amount: taxableBase,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      total_amount: totalAmount,
      net_payable: netPayable,
      tds_amount: tds,
      debit_note: {
        transaction_type: noteType,
        taxable_amount: noteAmount,
        cgst_amount: dnCgst,
        sgst_amount: dnSgst,
        igst_amount: dnIgst,
        total_amount: dnTotal,
      },
    })
  }, [
    formData.net_weight_mt,
    formData.jute_bag,
    formData.pp_bag,
    formData.final_weight_mt,
    formData.oil_content,
    formData.final_unit_rate,
    formData.rate_basis,
    formData.bag_amount,
    formData.loading_charges,
    formData.unloading_charges,
    formData.tds_rate,
    formData.tds,
    formData.advance_paid,
    formData.lorry_freight,
    formData.other_charges,
    formData.original_invoice_value,
    formData.manual_adjustment,
    formData.is_interstate,
    formData.cgst_rate,
    formData.sgst_rate,
    formData.igst_rate,
  ])

  const handleVendorSelect = async (vendor) => {
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendor_id: vendor.id,
        is_interstate: vendor.state && vendor.state.toLowerCase() !== 'tamil nadu',
      }))
      // Fetch vendor's open invoices
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

  const handleInvoiceSelect = (inv) => {
    if (inv) {
      setFormData((prev) => ({
        ...prev,
        invoice_id: inv.id,
        bill_number: inv.invoice_number,
        bill_date: inv.invoice_date ? inv.invoice_date.split('T')[0] : '',
        lot_number: inv.lot_number || prev.lot_number,
        vehicle_number: inv.vehicle_number || prev.vehicle_number,
        net_weight_mt: parseFloat(inv.net_weight_mt) || prev.net_weight_mt,
        contract_unit_rate: parseFloat(inv.rate) || prev.contract_unit_rate,
        final_unit_rate: prev.final_unit_rate || parseFloat(inv.rate) || prev.contract_unit_rate,
        original_invoice_value: parseFloat(inv.taxable_amount) || prev.original_invoice_value,
        product_id: inv.product_id || prev.product_id,
      }))
    }
  }

  const handleProductSelect = (prod) => {
    if (prod) {
      setFormData((prev) => ({
        ...prev,
        product_id: prod.id,
        contract_unit_rate: prev.contract_unit_rate || parseFloat(prod.default_rate) || 0,
        final_unit_rate: prev.final_unit_rate || parseFloat(prod.default_rate) || 0,
        cgst_rate: parseFloat(prod.default_cgst) || 2.5,
        sgst_rate: parseFloat(prod.default_sgst) || 2.5,
        igst_rate: parseFloat(prod.default_igst) || 5.0,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // Client-side validation to prevent ghost required field issues
    const validationErrors = {}
    if (!formData.branch_id) validationErrors.branch_id = ['Branch is required']
    if (!formData.vendor_id) validationErrors.vendor_id = ['Vendor is required']
    if (!formData.settlement_date) validationErrors.settlement_date = ['Settlement date is required']
    if (!formData.net_weight_mt || Number(formData.net_weight_mt) <= 0) validationErrors.net_weight_mt = ['Net weight must be greater than 0']
    if (formData.oil_content === undefined || formData.oil_content === '' || Number(formData.oil_content) < 0) validationErrors.oil_content = ['Oil content (%) is required']
    if (!formData.final_unit_rate || Number(formData.final_unit_rate) <= 0) validationErrors.final_unit_rate = ['Final unit rate is required']

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstError = Object.values(validationErrors)[0][0]
      toast.error(firstError || 'Please check required fields')
      return
    }

    setSaving(true)

    const payload = {
      ...formData,
      net_weight_mt: parseFloat(formData.net_weight_mt) || 0,
      jute_bag: parseFloat(formData.jute_bag) || 0,
      pp_bag: parseFloat(formData.pp_bag) || 0,
      final_weight_mt: calc.final_weight_mt,
      final_weight_kg: calc.final_weight_kg,
      oil_content: parseFloat(formData.oil_content) || 0,
      contract_unit_rate: parseFloat(formData.contract_unit_rate) || 0,
      final_unit_rate: parseFloat(formData.final_unit_rate) || 0,
      bag_amount: parseFloat(formData.bag_amount) || 0,
      loading_charges: parseFloat(formData.loading_charges) || 0,
      unloading_charges: parseFloat(formData.unloading_charges) || 0,
      tds_rate: parseFloat(formData.tds_rate) || 0,
      tds: calc.tds_amount ?? (parseFloat(formData.tds) || 0),
      advance_paid: parseFloat(formData.advance_paid) || 0,
      lorry_freight: parseFloat(formData.lorry_freight) || 0,
      other_charges: parseFloat(formData.other_charges) || 0,
      original_invoice_value: parseFloat(formData.original_invoice_value) || 0,
      manual_adjustment: parseFloat(formData.manual_adjustment) || 0,
      oil_quantity_kg: calc.oil_quantity_kg,
      bran_value: calc.bran_value,
      rebate_amount: calc.rebate_amount,
      note_type: calc.note_type,
      subtotal_amount: calc.subtotal_amount,
      cgst_amount: calc.cgst_amount,
      sgst_amount: calc.sgst_amount,
      igst_amount: calc.igst_amount,
      total_amount: calc.total_amount,
      net_payable: calc.net_payable,
    }

    try {
      if (isEdit) {
        await api.put(`/settlements/${id}`, payload)
        toast.success('Settlement bill & debit note updated successfully')
      } else {
        await api.post('/settlements', payload)
        toast.success('Settlement bill & debit note created and posted to ledger')
      }
      navigate('/panel/settlements')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
        toast.error('Please check required fields')
      } else {
        toast.error(apiErrorMessage(err, 'Failed to save settlement bill'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <PageSpinner label="Loading settlement calculation workspace..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/panel/settlements"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b3558] text-white hover:bg-[#07233b] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0b3558]">
              {isEdit ? `Edit Settlement Bill #${formData.settlement_number}` : 'New Agro Settlement Bill'}
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Automated Oil Valuation, Bran Value, Quality Tests & Debit Note Reversal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 rounded-xl bg-[#b37d14] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#96670e] transition-colors"
          >
            <Eye className="w-4 h-4 text-white" />
            Live Document Preview
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={() => openPdf(`/settlements/${id}/pdf`, `${formData.settlement_number}.pdf`)}
              className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#07233b] transition-colors"
            >
              <Printer className="w-4 h-4 text-white" />
              Print PDF
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ========================================================================= */}
        {/* SECTION 1: VENDOR, BRANCH & CONSIGNMENT REFERENCE                         */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          {/* Section Header Bar */}
          <div className="flex items-center justify-between bg-[#0b3558] text-white px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2.5 font-black text-xs uppercase tracking-wider">
              <Receipt className="w-4 h-4 text-[#d69e2e]" />
              Consignment & Vendor Reference
            </div>
            {invoicesList.length > 0 && (
              <span className="text-[11px] font-bold bg-[#b37d14] text-white px-2.5 py-0.5 rounded-md">
                {invoicesList.length} Invoices Available
              </span>
            )}
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
                label="Vendor / Supplier"
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

          {/* Quick Purchase Invoice Autofill */}
          {invoicesList.length > 0 && (
            <div className="rounded-xl bg-[#fef3c7] p-4 space-y-2">
              <label className="block text-xs font-black text-[#78350f] uppercase flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#b37d14]" />
                Auto-Fill From Existing Purchase Invoice
              </label>
              <select
                value={formData.invoice_id}
                onChange={(e) => {
                  const selected = invoicesList.find((inv) => String(inv.id) === e.target.value)
                  handleInvoiceSelect(selected)
                }}
                className="w-full rounded-lg bg-white px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
              >
                <option value="">-- Select Invoice to Auto-populate Bill, Date, Weight & Taxable Value --</option>
                {(Array.isArray(invoicesList) ? invoicesList : []).map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} ({inv.invoice_date}) | Wt: {inv.net_weight_mt} MT | Rate: ₹{inv.rate} | Taxable: ₹{Number(inv.taxable_amount).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Settlement Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.settlement_date}
                onChange={(e) => setFormData({ ...formData, settlement_date: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">PO Number</label>
              <input
                type="text"
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                placeholder="e.g. PO-8921"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                placeholder="e.g. TN28AH3345"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Vendor Bill Number & Date</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.bill_number}
                  onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                  placeholder="Bill No (e.g. 68)"
                  className="w-1/2 rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
                <input
                  type="date"
                  value={formData.bill_date}
                  onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                  className="w-1/2 rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
              </div>
            </div>

            <div>
              <Autocomplete
                label="Agro Product"
                items={productsList}
                value={formData.product_id}
                onChange={(val) => setFormData({ ...formData, product_id: val })}
                onSelect={handleProductSelect}
                displayKey="product_name"
                secondaryKey="product_code"
                placeholder="Select Agro Product (e.g. BOILED BRAN)"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: WEIGHT BREAKDOWN & QC TESTS (SOLID COLOR CONTAINERS)           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weight Card - Solid Emerald Theme */}
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <div className="bg-emerald-700 text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-200" />
                Weight Particulars (MT & KG)
              </span>
              <span className="text-[11px] font-bold bg-emerald-900/60 px-2.5 py-0.5 rounded-md">
                1 MT = 1,000 KG
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                  Net Weight (MT) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={formData.net_weight_mt ?? ''}
                  onChange={(e) => setFormData({ ...formData, net_weight_mt: e.target.value })}
                  placeholder="e.g. 35.500"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Jute Bag (MT)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.jute_bag ?? ''}
                  onChange={(e) => setFormData({ ...formData, jute_bag: e.target.value })}
                  placeholder="0.000"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">PP Bag (MT)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.pp_bag ?? ''}
                  onChange={(e) => setFormData({ ...formData, pp_bag: e.target.value })}
                  placeholder="0.000"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Calculated & Editable Final Weight Solid Container */}
            <div className="rounded-xl bg-emerald-600 p-4 text-white shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">Final Weight (MT)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      step="0.001"
                      value={formData.final_weight_mt !== '' && formData.final_weight_mt !== undefined ? formData.final_weight_mt : (calc.final_weight_mt > 0 ? Number(calc.final_weight_mt).toFixed(3) : '')}
                      onChange={(e) => setFormData({ ...formData, final_weight_mt: e.target.value })}
                      placeholder="0.000"
                      className="w-32 rounded-lg bg-white px-2.5 py-1 text-base font-black font-mono text-emerald-950 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      title="Directly editable Final Weight MT"
                    />
                    <span className="text-xs font-bold text-emerald-100">MT</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">Final Weight (KG)</span>
                  <span className="text-2xl font-black font-mono">
                    {Number(calc.final_weight_kg).toLocaleString('en-IN', { maximumFractionDigits: 2 })} KG
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-100/90 font-medium block">
                Auto-calculated from Net Wt - Bags (or directly override above)
              </span>
            </div>
          </div>

          {/* QC Test Parameters - Solid Royal Navy Theme */}
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <div className="bg-[#0b3558] text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#d69e2e]" />
                Quality Control (QC) Test Parameters
              </span>
              <span className="text-[11px] font-bold bg-[#07233b] px-2.5 py-0.5 rounded-md text-[#d69e2e]">
                Lab Specification
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Oil Content Primary Driver */}
              <div className="col-span-2 rounded-xl bg-[#fef3c7] p-3">
                <label className="block text-xs font-black text-[#78350f] uppercase mb-1">
                  Oil Content (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.oil_content ?? ''}
                  onChange={(e) => setFormData({ ...formData, oil_content: e.target.value })}
                  className="w-full rounded-lg bg-white px-3 py-2 text-base font-black text-[#78350f] focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
                  placeholder="e.g. 25.52 or 13.10"
                />
                <span className="text-[10px] font-bold text-[#b37d14] mt-1 block">Crucial: Multiplied with Weight for Oil Qty</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">FFA (%)</label>
                <input
                  type="text"
                  value={formData.ffa ?? ''}
                  onChange={(e) => setFormData({ ...formData, ffa: e.target.value })}
                  placeholder="PASS or 2.92"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sand / Silica (SS)</label>
                <input
                  type="text"
                  value={formData.ss ?? ''}
                  onChange={(e) => setFormData({ ...formData, ss: e.target.value })}
                  placeholder="PASS or 11.77"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Fibre (%)</label>
                <input
                  type="text"
                  value={formData.fibre ?? ''}
                  onChange={(e) => setFormData({ ...formData, fibre: e.target.value })}
                  placeholder="PASS or 32.79"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Moisture (%)</label>
                <input
                  type="text"
                  value={formData.moisture ?? ''}
                  onChange={(e) => setFormData({ ...formData, moisture: e.target.value })}
                  placeholder="PASS or 6.32"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">IV</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.iv ?? ''}
                  onChange={(e) => setFormData({ ...formData, iv: e.target.value })}
                  placeholder="-"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Protein (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.protein ?? ''}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="-"
                  className="w-full rounded-xl bg-[#f4f6f9] px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: EXACT SETTLEMENT CALCULATION: FINAL WEIGHT × FINAL RATE × OIL CONTENT */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-[#0b3558] p-6 text-white shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#d69e2e] font-black flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#d69e2e]" />
                Live Settlement Calculation (Final Weight × Final Rate × Oil Content)
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Formula: <strong>Final Weight (MT) × Final Rate (₹) × Oil Content (%) = Bran Value / Total Value</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Cont. Rate */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Cont. Unit Rate (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.contract_unit_rate ?? ''}
                  onChange={(e) => setFormData({ ...formData, contract_unit_rate: e.target.value })}
                  className="w-28 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white focus:bg-white focus:text-slate-900 focus:outline-none"
                  placeholder="e.g. 1880.00"
                />
              </div>

              {/* Final Rate */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#d69e2e] mb-1">
                  Final Unit Rate (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.final_unit_rate ?? ''}
                  onChange={(e) => setFormData({ ...formData, final_unit_rate: e.target.value })}
                  className="w-32 rounded-xl bg-white px-3 py-1.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d69e2e]"
                  placeholder="e.g. 1830.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="rounded-xl bg-[#07233b] p-3.5 shadow-sm">
              <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold block">
                1. Final Weight (MT)
              </span>
              <span className="text-xl font-black text-white mt-1 block font-mono">
                {Number(calc.final_weight_mt).toFixed(3)} MT
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">({Number(calc.final_weight_kg).toLocaleString('en-IN', { maximumFractionDigits: 2 })} KG)</span>
            </div>

            <div className="rounded-xl bg-[#07233b] p-3.5 shadow-sm">
              <span className="text-[10.5px] uppercase tracking-wider text-[#d69e2e] font-bold block">
                2. Final Unit Rate (₹)
              </span>
              <span className="text-xl font-black text-[#d69e2e] mt-1 block font-mono">
                ₹{Number(formData.final_unit_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-amber-200/80 font-semibold">(Unit Rate)</span>
            </div>

            <div className="rounded-xl bg-[#07233b] p-3.5 shadow-sm">
              <span className="text-[10.5px] uppercase tracking-wider text-sky-300 font-bold block">
                3. Oil Content (%)
              </span>
              <span className="text-xl font-black text-sky-300 mt-1 block font-mono">
                {Number(formData.oil_content || 0).toFixed(2)} %
              </span>
              <span className="text-[10px] text-sky-200/80 font-semibold">({Number(calc.oil_quantity_kg).toLocaleString('en-IN', { maximumFractionDigits: 3 })} KG Oil)</span>
            </div>

            <div className="rounded-xl bg-emerald-600 p-3.5 shadow-md flex flex-col justify-center">
              <span className="text-[10.5px] uppercase tracking-wider text-emerald-100 font-black block">
                Bran Value (₹)
              </span>
              <span className="text-xl font-black text-white mt-1 block font-mono">
                ₹{Number(calc.bran_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9.5px] text-emerald-100 font-bold mt-0.5">
                {Number(calc.final_weight_mt).toFixed(3)} × {Number(formData.final_unit_rate || 0).toFixed(2)} × {Number(formData.oil_content || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: ORIGINAL INVOICE vs SETTLEMENT (AUTO DEBIT NOTE GENERATION)    */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="bg-[#b37d14] text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-white" />
              Original Purchase Invoice vs Settlement (Debit Note Auto-Generation)
            </span>
            <span className="text-[11px] font-bold bg-[#96670e] px-2.5 py-0.5 rounded-md">
              Rebate & Tax Reversal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Original Invoice Taxable Value (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.original_invoice_value ?? ''}
                onChange={(e) => setFormData({ ...formData, original_invoice_value: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Manual Adjustment (+/- ₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.manual_adjustment ?? ''}
                onChange={(e) => setFormData({ ...formData, manual_adjustment: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Adjustment Reason</label>
              <input
                type="text"
                value={formData.manual_adjustment_reason ?? ''}
                onChange={(e) => setFormData({ ...formData, manual_adjustment_reason: e.target.value })}
                placeholder="Audit explanation for adjustment"
                className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b37d14]"
              />
            </div>
          </div>

          {/* Rebate / Note Live Container (Debit or Credit Note) */}
          {calc.rebate_amount > 0 ? (
            calc.note_type === 'credit' ? (
              <div className="rounded-xl bg-[#065f46] p-5 text-white shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">
                        Credit Note Value Detected: ₹{Number(calc.rebate_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h3>
                      <p className="text-xs text-emerald-100">
                        Settlement Value (₹{Number(calc.bran_value).toLocaleString('en-IN')}) exceeds Original Bill Value (₹{Number(formData.original_invoice_value || 0).toLocaleString('en-IN')}).
                        A <strong>Credit Note</strong> will be automatically generated and credited to the Vendor Ledger.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-[#047857] px-3 py-1 text-xs font-black text-white shadow-sm border border-emerald-400/30">
                    Credit Note Auto-Calculated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-white/10 p-3.5 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-200 uppercase block">Credit Taxable</span>
                    <span className="text-base font-black text-white">₹{Number(calc.debit_note.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {!formData.is_interstate ? (
                    <>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-200 uppercase block">CGST 2.5%</span>
                        <span className="text-base font-black text-white">₹{Number(calc.debit_note.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-200 uppercase block">SGST 2.5%</span>
                        <span className="text-base font-black text-white">₹{Number(calc.debit_note.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-emerald-200 uppercase block">IGST 5.0%</span>
                      <span className="text-base font-black text-white">₹{Number(calc.debit_note.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="bg-[#047857] rounded-lg p-1.5 shadow-sm">
                    <span className="text-[10px] font-black text-emerald-100 uppercase block">Total Credit Note</span>
                    <span className="text-base font-black text-white">
                      ₹{Number(calc.debit_note.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-[#78350f] p-5 text-white shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-[#f59e0b] shrink-0" />
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">
                        Rebate / Debit Note Detected: ₹{Number(calc.rebate_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h3>
                      <p className="text-xs text-amber-200">
                        Original Invoice (₹{Number(formData.original_invoice_value || 0).toLocaleString('en-IN')}) exceeds Settlement Value (₹{Number(calc.bran_value).toLocaleString('en-IN')}).
                        A <strong>Debit Note</strong> will be automatically generated and debited to the Vendor Ledger.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-[#b37d14] px-3 py-1 text-xs font-black text-white shadow-sm border border-amber-400/30">
                    Debit Note Auto-Calculated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-white/10 p-3.5 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-amber-200 uppercase block">Rebate Taxable</span>
                    <span className="text-base font-black text-white">₹{Number(calc.debit_note.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {!formData.is_interstate ? (
                    <>
                      <div>
                        <span className="text-[10px] font-bold text-amber-200 uppercase block">CGST 2.5%</span>
                        <span className="text-base font-black text-white">₹{Number(calc.debit_note.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-200 uppercase block">SGST 2.5%</span>
                        <span className="text-base font-black text-white">₹{Number(calc.debit_note.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-amber-200 uppercase block">IGST 5.0%</span>
                      <span className="text-base font-black text-white">₹{Number(calc.debit_note.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="bg-[#b37d14] rounded-lg p-1.5 shadow-sm">
                    <span className="text-[10px] font-black text-amber-100 uppercase block">Total Debit Note</span>
                    <span className="text-base font-black text-white">
                      ₹{Number(calc.debit_note.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="rounded-xl bg-[#f4f6f9] p-3.5 text-xs font-bold text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settlement value matches or is equal to bill value. No debit / credit note adjustment needed.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: CHARGES, GST TAXES & GRAND NET PAYABLE                         */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="bg-[#0b3558] text-white px-4 py-3 rounded-xl flex items-center justify-between font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#d69e2e]" />
              Charges, GST Taxes & Net Payable Summary
            </span>
            <span className="text-[11px] font-bold bg-[#07233b] px-2.5 py-0.5 rounded-md text-[#d69e2e]">
              Final Accounting
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-800 uppercase mb-1.5">Bag Amount (+)</label>
              <input
                type="number"
                step="0.01"
                value={formData.bag_amount ?? ''}
                onChange={(e) => setFormData({ ...formData, bag_amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-emerald-50/80 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 placeholder-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-800 uppercase mb-1.5">Loading Charges (+)</label>
              <input
                type="number"
                step="0.01"
                value={formData.loading_charges ?? ''}
                onChange={(e) => setFormData({ ...formData, loading_charges: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-emerald-50/80 border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 placeholder-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Unloading Charges (-)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unloading_charges ?? ''}
                onChange={(e) => setFormData({ ...formData, unloading_charges: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-red-50/80 border border-red-300 px-3.5 py-2 text-xs font-bold text-red-700 placeholder-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs transition-all"
              />
            </div>

            {/* Percentage-based TDS Deduction */}
            <div className="rounded-xl bg-[#fff7ed] p-2.5 border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-[#9a3412] uppercase">
                  TDS Deduction (%)
                </label>
                {calc.tds_amount > 0 && (
                  <span className="text-[10.5px] font-black text-red-600">
                    -₹{Number(calc.tds_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tds_rate ?? ''}
                  onChange={(e) => setFormData({ ...formData, tds_rate: e.target.value })}
                  placeholder="e.g. 0.10"
                  className="w-full rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-[#9a3412] focus:outline-none focus:ring-2 focus:ring-amber-500 border border-amber-300"
                />
                <span className="text-xs font-black text-[#9a3412]">%</span>
              </div>
              <div className="flex gap-1 mt-1.5">
                {['0.10', '1.00', '2.00', '0.00'].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFormData({ ...formData, tds_rate: rate === '0.00' ? '' : rate })}
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                      formData.tds_rate === rate || (rate === '0.00' && !formData.tds_rate)
                        ? 'bg-[#9a3412] text-white'
                        : 'bg-amber-100 text-[#9a3412] hover:bg-amber-200'
                    }`}
                  >
                    {rate === '0.10' ? '0.1% (194Q)' : rate === '0.00' ? 'None' : `${rate}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Advance Paid (-)</label>
              <input
                type="number"
                step="0.01"
                value={formData.advance_paid ?? ''}
                onChange={(e) => setFormData({ ...formData, advance_paid: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-red-50/80 border border-red-300 px-3.5 py-2 text-xs font-bold text-red-700 placeholder-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Lorry Freight (-)</label>
              <input
                type="number"
                step="0.01"
                value={formData.lorry_freight ?? ''}
                onChange={(e) => setFormData({ ...formData, lorry_freight: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl bg-red-50/80 border border-red-300 px-3.5 py-2 text-xs font-bold text-red-700 placeholder-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs transition-all"
              />
            </div>
            <div>
              {(() => {
                const otherVal = parseFloat(formData.other_charges) || 0
                const otherStyle = otherVal > 0 
                  ? { label: 'text-emerald-800', input: 'bg-emerald-50/80 border-emerald-300 text-emerald-800 focus:ring-emerald-500 placeholder-emerald-400' }
                  : otherVal < 0 
                    ? { label: 'text-red-800', input: 'bg-red-50/80 border-red-300 text-red-700 focus:ring-red-500 placeholder-red-400' }
                    : { label: 'text-amber-800', input: 'bg-amber-50/80 border-amber-300 text-amber-900 focus:ring-amber-500 placeholder-amber-400' }
                return (
                  <>
                    <label className={`block text-xs font-bold uppercase mb-1.5 ${otherStyle.label}`}>Other Adjustments (+/-)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.other_charges ?? ''}
                      onChange={(e) => setFormData({ ...formData, other_charges: e.target.value })}
                      placeholder="0.00"
                      className={`w-full rounded-xl border px-3.5 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 shadow-xs transition-all ${otherStyle.input}`}
                    />
                  </>
                )
              })()}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Interstate IGST</label>
              <label className="flex items-center gap-2 rounded-xl bg-[#f4f6f9] border border-slate-300 px-3.5 py-2 cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.is_interstate}
                  onChange={(e) => setFormData({ ...formData, is_interstate: e.target.checked })}
                  className="rounded text-[#0b3558] focus:ring-0"
                />
                <span className="text-xs font-black text-slate-800">IGST Interstate Sale</span>
              </label>
            </div>
          </div>

          {/* Grand Net Payable Display (Solid Emerald) */}
          <div className="rounded-2xl bg-emerald-700 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-200 font-bold">
                Settlement Net Payable Breakdown
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100 mt-1 font-semibold">
                <span>Taxable Base: <strong>₹{Number(calc.subtotal_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                {!formData.is_interstate ? (
                  <>
                    <span>CGST 2.5%: <strong>₹{Number(calc.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    <span>SGST 2.5%: <strong>₹{Number(calc.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                  </>
                ) : (
                  <span>IGST 5.0%: <strong>₹{Number(calc.igst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                )}
                <span>Deductions: <strong>₹{Number(formData.tds + formData.advance_paid + formData.lorry_freight).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-black text-emerald-200 uppercase tracking-wider block">FINAL NET PAYABLE</span>
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                ₹{Number(calc.net_payable).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">Remarks / Settlement Notes</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full rounded-xl bg-[#f4f6f9] px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]"
              placeholder="Any quality test remarks or settlement notes..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/panel/settlements')}
            className="rounded-xl bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#b37d14] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#96670e] transition-colors"
          >
            <Eye className="w-4 h-4 text-white" />
            Preview Document
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#07233b] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Processing Settlement...' : isEdit ? 'Update Settlement Bill' : 'Save Settlement Bill & Post Accounting'}
          </button>
        </div>
      </form>

      {/* Live Exact Document Preview Modal */}
      <SettlementBillModal
        settlement={previewSettlement}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  )
}
