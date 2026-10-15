import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { apiErrorMessage, openPdf, downloadFile } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  BookOpen,
  Search,
  Printer,
  FileSpreadsheet,
  Plus,
  Building,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
} from 'lucide-react'
import { Autocomplete, PageSpinner, Modal } from '../../components'
import { today, formatDate, extractList } from '../../utils/helpers'

export default function VendorLedger() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialVendorId = searchParams.get('vendor_id') || ''
  const { branchId, branches } = useAuth()

  const [vendorsList, setVendorsList] = useState([])
  const [selectedVendorId, setSelectedVendorId] = useState(initialVendorId)
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || '')
  const [docTypeFilter, setDocTypeFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [ledgerData, setLedgerData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Adjustment Modal
  const [adjModalOpen, setAdjModalOpen] = useState(false)
  const [adjSaving, setAdjSaving] = useState(false)
  const [adjForm, setAdjForm] = useState({
    transaction_date: today(),
    transaction_type: 'debit',
    amount: '',
    document_number: '',
    description: '',
    branch_id: branchId || '',
  })

  // Load vendors list
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const res = await api.get('/vendors?all=true')
        const list = extractList(res)
        setVendorsList(list)
        if (!selectedVendorId && list.length > 0) {
          setSelectedVendorId(list[0].id)
        }
      } catch (err) {
        console.error(err)
        setVendorsList([])
      }
    }
    loadVendors()
  }, [])

  const fetchLedger = async () => {
    if (!selectedVendorId) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/ledger', {
        params: {
          vendor_id: selectedVendorId,
          branch_id: selectedBranchId || undefined,
          document_type: docTypeFilter || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        },
      })
      setLedgerData(res.data.data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to fetch vendor ledger'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedVendorId) {
      fetchLedger()
    }
  }, [selectedVendorId, selectedBranchId, docTypeFilter, fromDate, toDate])

  const handleExportPdf = async () => {
    if (!selectedVendorId) return
    try {
      const params = new URLSearchParams({
        vendor_id: selectedVendorId,
        ...(fromDate && { from_date: fromDate }),
        ...(toDate && { to_date: toDate }),
        ...(selectedBranchId && { branch_id: selectedBranchId }),
        ...(docTypeFilter && { document_type: docTypeFilter }),
      })
      await openPdf(`/ledger/pdf?${params.toString()}`, `Vendor_Ledger_${selectedVendorId}.pdf`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleExportCsv = () => {
    if (!ledgerData?.entries?.length) return
    const vendor = ledgerData.vendor
    const headers = ['Date,Document No,Type,Description,Debit (₹),Credit (₹),Balance (₹)\n']
    const rows = (Array.isArray(ledgerData.entries) ? ledgerData.entries : []).map((e) =>
      `"${e.transaction_date}","${e.document_number || ''}","${e.document_type}","${e.description || ''}",${e.debit || 0},${e.credit || 0},${e.balance || 0}`
    )
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Vendor_Ledger_${vendor?.vendor_code || 'statement'}.csv`
    a.click()
  }

  const handleAdjSubmit = async (e) => {
    e.preventDefault()
    if (!selectedVendorId) return
    setAdjSaving(true)
    try {
      await api.post('/ledger/adjustment', {
        ...adjForm,
        vendor_id: selectedVendorId,
        amount: parseFloat(adjForm.amount) || 0,
      })
      setAdjModalOpen(false)
      setAdjForm({
        transaction_date: today(),
        transaction_type: 'debit',
        amount: '',
        document_number: '',
        description: '',
        branch_id: branchId || '',
      })
      fetchLedger()
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to post adjustment'))
    } finally {
      setAdjSaving(false)
    }
  }

  const vendor = ledgerData?.vendor
  const entries = ledgerData?.entries || []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Vendor Statement of Account & Ledger</h1>
          <p className="text-xs text-slate-500">
            Real-time double-entry debit/credit ledger, running balances, and statement exports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAdjModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#0b3558] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30"
          >
            <Plus className="w-4 h-4 text-[#d69e2e]" />
            Post Payment / Adjustment
          </button>
          <button
            onClick={handleExportPdf}
            disabled={!selectedVendorId}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-[#fbf5ea] hover:text-[#0b3558] disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-[#b37d14]" />
            Print PDF
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!entries.length}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-[#fbf5ea] hover:text-[#0b3558] disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#b37d14]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Vendor Selector & Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Autocomplete
              label="Select Vendor Account"
              items={vendorsList}
              value={selectedVendorId}
              onChange={(val) => {
                setSelectedVendorId(val)
                setSearchParams({ vendor_id: val })
              }}
              displayKey="vendor_name"
              secondaryKey="vendor_code"
              extraInfoKey="gstin"
              placeholder="Search vendor name, code, GSTIN..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Branch</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none font-medium"
            >
              <option value="">All Branches (Consolidated)</option>
              {(Array.isArray(branches) ? branches : []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Date Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Document:</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
            >
              <option value="">All Document Types</option>
              <option value="debit_note">Debit Notes</option>
              <option value="credit_note">Credit Notes</option>
            </select>
          </div>

          {(fromDate || toDate || docTypeFilter) && (
            <button
              onClick={() => {
                setFromDate('')
                setToDate('')
                setDocTypeFilter('')
              }}
              className="text-xs text-red-600 hover:underline font-semibold ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Vendor Profile & Balance Overview Header */}
      {vendor && (
        <div className="rounded-2xl bg-[#0b3558] border border-[#b37d14]/40 p-5 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#f7eedb] bg-[#07233b] px-2 py-0.5 rounded border border-[#b37d14]/50">
                  {vendor.vendor_code}
                </span>
                <h2 className="text-lg font-bold text-white">{vendor.vendor_name}</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {vendor.address ? `${vendor.address}, ` : ''}{vendor.city} | <strong>GSTIN:</strong> {vendor.gstin || 'N/A'} | <strong>PAN:</strong> {vendor.pan || 'N/A'}
              </p>
              {vendor.bank_name && (
                <p className="text-[11px] text-slate-300/80 mt-0.5">
                  Bank: {vendor.bank_name} | A/C: {vendor.account_number} | IFSC: {vendor.ifsc}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 bg-[#07233b]/80 backdrop-blur-xs p-3.5 rounded-xl border border-[#b37d14]/40 text-right">
              <div>
                <span className="text-[10.5px] uppercase tracking-wider text-slate-300 font-semibold block">Total Debited</span>
                <span className="text-base font-bold text-[#faedcd] font-mono">
                  ₹{Number(ledgerData?.total_debit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <span className="text-[10.5px] uppercase tracking-wider text-slate-300 font-semibold block">Total Credited</span>
                <span className="text-base font-bold text-sky-200 font-mono">
                  ₹{Number(ledgerData?.total_credit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <PageSpinner label="Loading vendor statement..." />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No transactions found for this vendor account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Document No</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description / Particulars</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(entries) ? entries : []).map((entry) => (
                  <tr key={entry.id} className="odd:bg-[#f1f5f9] even:bg-white hover:bg-amber-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-medium">{formatDate(entry.transaction_date)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">{entry.document_number || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10.5px] font-bold uppercase border ${
                        Number(entry.debit) > 0 
                          ? 'bg-amber-50 border-amber-200 text-[#b37d14]' 
                          : 'bg-sky-50 border-sky-200 text-[#0b3558]'
                      }`}>
                        {Number(entry.debit) > 0 ? 'DEBIT NOTE' : 'CREDIT NOTE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {entry.description}
                      {entry.lot_number && <span className="block text-[10px] text-slate-400">Lot: {entry.lot_number}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#b37d14]">
                      {Number(entry.debit) > 0 ? `₹${Number(entry.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sky-700">
                      {Number(entry.credit) > 0 ? `₹${Number(entry.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-[#fdfbf7] font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-600">
                    Statement Totals:
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#b37d14] font-mono">
                    ₹{Number(ledgerData?.total_debit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right text-sky-800 font-mono">
                    ₹{Number(ledgerData?.total_credit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Manual Adjustment / Journal Entry Modal */}
      <Modal
        open={adjModalOpen}
        onClose={() => setAdjModalOpen(false)}
        title="Post Manual Ledger Adjustment / Payment"
      >
        <form onSubmit={handleAdjSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Posting manual entries directly impacts vendor account balance with an audit log.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Entry Nature</label>
              <select
                value={adjForm.transaction_type}
                onChange={(e) => setAdjForm({ ...adjForm, transaction_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold"
              >
                <option value="debit">Debit (Payment made to vendor / Deduction)</option>
                <option value="credit">Credit (Additional liability / Receipt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Transaction Date</label>
              <input
                type="date"
                required
                value={adjForm.transaction_date}
                onChange={(e) => setAdjForm({ ...adjForm, transaction_date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={adjForm.amount}
                onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Voucher / Ref No</label>
              <input
                type="text"
                value={adjForm.document_number}
                onChange={(e) => setAdjForm({ ...adjForm, document_number: e.target.value })}
                placeholder="e.g. NEFT-84920"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description / Particulars *</label>
            <textarea
              rows={2}
              required
              value={adjForm.description}
              onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })}
              placeholder="e.g. Bank payment via NEFT against invoices..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjSaving}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {adjSaving ? 'Posting...' : 'Post Entry to Ledger'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
