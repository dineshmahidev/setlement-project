import React, { useState, useEffect, useCallback } from 'react'
import api, { apiErrorMessage, apiUrl, requestHeaders } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Users2,
  Package,
  ArrowDownToLine,
  FileText,
  Percent,
  Wallet,
  TrendingDown,
  Layers,
  Boxes,
  ArrowRightLeft,
  Factory,
  Scale,
} from 'lucide-react'
import { today, monthStart, formatDate, extractList } from '../../utils/helpers'

const REPORT_TABS = [
  { id: 'settlements', label: '1. Settlement Report', icon: FileText },
  { id: 'invoices', label: '2. Purchase Invoice Report', icon: FileSpreadsheet },
  { id: 'debit_notes', label: '3. Debit Note Report', icon: TrendingDown },
  { id: 'rebate', label: '4. Rebate Summary', icon: Percent },
  { id: 'outstanding', label: '5. Vendor Outstanding', icon: Wallet },
  { id: 'payments', label: '6. Payment / Ledger Adjustments', icon: Wallet },
  { id: 'branch_wise', label: '7. Branch-wise Report', icon: Building2 },
  { id: 'product_wise', label: '8. Product-wise Quality/Value', icon: Package },
  { id: 'gst', label: '9. GST 2B / Tax Summary', icon: Percent },
  { id: 'stock', label: '10. Current Stock', icon: Boxes },
  { id: 'lots', label: '11. Lot Register', icon: Layers },
  { id: 'inward', label: '12. Inward Register', icon: ArrowDownToLine },
  { id: 'outward', label: '13. Outward / Dispatch', icon: ArrowRightLeft },
  { id: 'valuation', label: '14. Stock Valuation', icon: Scale },
  { id: 'production', label: '15. Production / Mixing', icon: Factory },
]

export default function Reports() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('settlements')
  const [rows, setRows] = useState([])
  const [gstSummary, setGstSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [fromDate, setFromDate] = useState(() => monthStart())
  const [toDate, setToDate] = useState(() => today())
  const [branchId, setBranchId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [productId, setProductId] = useState('')

  // Dropdowns
  const [branches, setBranches] = useState([])
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/branches?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/vendors?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/products?per_page=100').catch(() => ({ data: { data: [] } })),
    ]).then(([bRes, vRes, pRes]) => {
      setBranches(extractList(bRes))
      setVendors(extractList(vRes))
      setProducts(extractList(pRes))
    })
  }, [])

  const runReport = useCallback(async () => {
    setLoading(true)
    setGstSummary(null)
    try {
      const res = await api.get(`/reports/${activeTab}`, {
        params: {
          from_date: fromDate,
          to_date: toDate,
          branch_id: branchId || undefined,
          vendor_id: vendorId || undefined,
          product_id: productId || undefined,
        },
      })
      if (activeTab === 'gst') {
        setGstSummary(res.data?.data || null)
        setRows([])
      } else {
        setRows(extractList(res))
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to generate report'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, fromDate, toDate, branchId, vendorId, productId, toast])

  useEffect(() => {
    runReport()
  }, [activeTab])

  const handleExport = async (format) => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        format,
        from_date: fromDate,
        to_date: toDate,
      })
      if (branchId) params.append('branch_id', branchId)
      if (vendorId) params.append('vendor_id', vendorId)
      if (productId) params.append('product_id', productId)

      const response = await fetch(apiUrl(`/reports/${activeTab}/export?${params.toString()}`), {
        headers: requestHeaders({
          Accept: format === 'pdf' ? 'application/pdf' : 'text/csv',
        }),
      })

      if (!response.ok) throw new Error('Export request failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${activeTab}_${fromDate}_to_${toDate}.${format === 'pdf' ? 'pdf' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Exported ${format.toUpperCase()} successfully`)
    } catch (err) {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agro Business Reports</h1>
          <p className="text-sm text-slate-500">
            Real-time multi-dimensional reports, settlement analytics, vendor ledgers and tax reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-[#fdfbf7] hover:text-[#0b3558] disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#0b3558]" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#b37d14]/40 bg-[#0b3558] px-3.5 py-2 text-xs font-semibold text-[#fdfbf7] shadow-xs hover:bg-[#07233b] disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-[#d69e2e]" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                active
                  ? 'bg-[#0b3558] text-[#fdfbf7] font-semibold shadow-xs border-b-2 border-[#b37d14]'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-[#fdfbf7] hover:text-[#0b3558]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#d69e2e]' : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filter Parameters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#0b3558] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#0b3558] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Branch</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-[#0b3558] focus:outline-none"
          >
            <option value="">All Branches</option>
            {(Array.isArray(branches) ? branches : []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name || b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Vendor</label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white focus:border-[#0b3558] focus:outline-none"
          >
            <option value="">All Vendors</option>
            {(Array.isArray(vendors) ? vendors : []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.vendor_name || v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={runReport}
            disabled={loading}
            className="w-full rounded-lg bg-[#0b3558] px-4 py-2 text-xs font-semibold text-white hover:bg-[#07233b] border border-[#b37d14]/30 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Filtering...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Report Data Table Rendering */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {activeTab === 'gst' ? (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900">GST Input / Output Tax Reconciliation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Settlement Bills GST */}
              {/* Settlements GST (Purchases) - Solid Colors */}
              <div className="rounded-xl bg-teal-800 text-white p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">Settlement Purchases GST</h4>
                  <span className="rounded bg-teal-900/80 px-2 py-0.5 text-xs font-semibold text-teal-100">
                    Input Tax Credit
                  </span>
                </div>
                <div className="space-y-2 text-sm text-teal-50">
                  <div className="flex justify-between border-b border-teal-700/60 pb-1">
                    <span>Taxable Purchases Value:</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.settlements_gst?.taxable_value)}</span>
                  </div>
                  <div className="flex justify-between border-b border-teal-700/60 pb-1">
                    <span>CGST (2.5%):</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.settlements_gst?.total_cgst)}</span>
                  </div>
                  <div className="flex justify-between border-b border-teal-700/60 pb-1">
                    <span>SGST (2.5%):</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.settlements_gst?.total_sgst)}</span>
                  </div>
                  <div className="flex justify-between border-b border-teal-700/60 pb-1">
                    <span>IGST (5% Interstate):</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.settlements_gst?.total_igst)}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-white text-base">
                    <span>Total GST on Settlements:</span>
                    <span>{formatCurrency(gstSummary?.settlements_gst?.total_gst)}</span>
                  </div>
                </div>
              </div>

              {/* Debit Notes GST (Rebates) - Solid Colors */}
              <div className="rounded-xl bg-[#0b3558] text-white p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">Debit Notes (Rebates) GST</h4>
                  <span className="rounded bg-[#07233b] px-2 py-0.5 text-xs font-semibold text-[#faedcd]">
                    Tax Reversal
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-100">
                  <div className="flex justify-between border-b border-blue-900/60 pb-1">
                    <span>Taxable Rebate Amount:</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.debit_notes_gst?.taxable_value)}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-900/60 pb-1">
                    <span>CGST Reversal (2.5%):</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.debit_notes_gst?.total_cgst)}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-900/60 pb-1">
                    <span>SGST Reversal (2.5%):</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.debit_notes_gst?.total_sgst)}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-900/60 pb-1">
                    <span>IGST Reversal (5%):</span>
                    <span className="font-semibold text-white">{formatCurrency(gstSummary?.debit_notes_gst?.total_igst)}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-white text-base">
                    <span>Total GST on Debit Notes:</span>
                    <span>{formatCurrency(gstSummary?.debit_notes_gst?.total_gst)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                {activeTab === 'settlements' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Settlement #</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Product</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Weight (MT)</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Oil %</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Oil (KG)</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Bran Value</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Rebate</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Net Payable</th>
                  </tr>
                )}

                {activeTab === 'invoices' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Invoice #</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Product</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Billed MT</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Unit Rate</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Taxable Value</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">GST</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Total Invoice (₹)</th>
                  </tr>
                )}

                {activeTab === 'debit_notes' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Debit Note #</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Invoice Ref #</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Reason</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Taxable Rebate</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">CGST</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">SGST</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Total Debit (₹)</th>
                  </tr>
                )}

                {activeTab === 'rebate' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Settlement #</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Original Inv Value</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Settlement Bran Value</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Calculated Rebate (₹)</th>
                  </tr>
                )}

                {activeTab === 'outstanding' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor Name</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Phone</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">GSTIN</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Current Balance</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Accounting Nature</th>
                  </tr>
                )}

                {activeTab === 'branch_wise' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Branch Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Branch Name</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Settlements Count</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Total Weight (MT)</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Total Bran Value</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Total Rebate</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Total Net Payable</th>
                  </tr>
                )}

                {activeTab === 'product_wise' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Product Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Product Name</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Total MT</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Total Oil KG</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-700">Average Oil %</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Total Bran Value</th>
                  </tr>
                )}

                {activeTab === 'payments' && (
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendor</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Doc # / Ref</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Type</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Description</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Debit (₹)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Credit (₹)</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                        <span>Calculating report data...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      No records found for the selected period.
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(rows) ? rows : []).map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      {activeTab === 'settlements' && (
                        <>
                          <td className="px-4 py-2.5 font-bold font-mono text-emerald-700">{r.settlement_number}</td>
                          <td className="px-3 py-2.5 text-slate-600">{formatDate(r.settlement_date)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.vendor?.vendor_name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{r.product?.product_name || 'Rice Bran'}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{r.final_weight_mt} MT</td>
                          <td className="px-3 py-2.5 text-right font-mono text-amber-700">{r.oil_content}%</td>
                          <td className="px-3 py-2.5 text-right font-mono">{r.oil_quantity_kg} KG</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(r.bran_value)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-red-600">{formatCurrency(r.rebate_amount)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{formatCurrency(r.net_payable)}</td>
                        </>
                      )}

                      {activeTab === 'invoices' && (
                        <>
                          <td className="px-4 py-2.5 font-bold font-mono text-blue-700">{r.invoice_number}</td>
                          <td className="px-3 py-2.5 text-slate-600">{formatDate(r.invoice_date)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.vendor?.vendor_name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{r.product?.product_name || 'Rice Bran'}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{r.quantity_mt} MT</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(r.unit_rate)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(r.taxable_value)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(Number(r.cgst_amount || 0) + Number(r.sgst_amount || 0) + Number(r.igst_amount || 0))}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(r.total_amount)}</td>
                        </>
                      )}

                      {activeTab === 'debit_notes' && (
                        <>
                          <td className="px-4 py-2.5 font-bold font-mono text-red-700">{r.debit_note_number}</td>
                          <td className="px-3 py-2.5 text-slate-600">{formatDate(r.date)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.vendor?.vendor_name}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">{r.invoice_number || '—'}</td>
                          <td className="px-3 py-2.5 text-slate-600">{r.reason}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(r.taxable_amount)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(r.cgst_amount)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatCurrency(r.sgst_amount)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-red-700">{formatCurrency(r.total_amount)}</td>
                        </>
                      )}

                      {activeTab === 'rebate' && (
                        <>
                          <td className="px-4 py-2.5 font-bold font-mono text-emerald-700">{r.settlement_number}</td>
                          <td className="px-3 py-2.5 text-slate-600">{formatDate(r.settlement_date)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.vendor?.vendor_name}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(r.original_invoice_value)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(r.bran_value)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-red-600">{formatCurrency(r.rebate_amount)}</td>
                        </>
                      )}

                      {activeTab === 'outstanding' && (
                        <>
                          <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">{r.vendor_code}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.vendor_name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{r.phone || '—'}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">{r.gstin || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-bold font-mono text-slate-900">{formatCurrency(r.balance)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              r.balance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.nature}
                            </span>
                          </td>
                        </>
                      )}

                      {activeTab === 'branch_wise' && (
                        <>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{r.branch_code}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.branch_name}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{r.total_settlements}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{r.total_weight_mt} MT</td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold">{formatCurrency(r.total_bran_value)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-red-600">{formatCurrency(r.total_rebate)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(r.total_net_payable)}</td>
                        </>
                      )}

                      {activeTab === 'product_wise' && (
                        <>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{r.product_code}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.product_name}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{r.total_weight_mt} MT</td>
                          <td className="px-3 py-2.5 text-right font-mono">{r.total_oil_kg} KG</td>
                          <td className="px-3 py-2.5 text-right font-mono text-amber-700">{Number(r.avg_oil_percent || 0).toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">{formatCurrency(r.total_bran_value)}</td>
                        </>
                      )}

                      {activeTab === 'payments' && (
                        <>
                          <td className="px-4 py-2.5 text-slate-600">{r.transaction_date}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">{r.vendor?.vendor_name}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-700">{r.document_number}</td>
                          <td className="px-3 py-2.5 uppercase font-semibold text-[11px] text-slate-600">{r.document_type}</td>
                          <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">{r.description}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">{r.debit_amount > 0 ? formatCurrency(r.debit_amount) : '—'}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-blue-700">{r.credit_amount > 0 ? formatCurrency(r.credit_amount) : '—'}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
