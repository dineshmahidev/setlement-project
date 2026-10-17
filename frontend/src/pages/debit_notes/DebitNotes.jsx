import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { apiErrorMessage, openPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Plus, Search, FileText, Printer, Edit3, Ban, Calendar, Building } from 'lucide-react'
import { PageSpinner, StatusBadge, Modal } from '../../components'
import { extractList, formatDate } from '../../utils/helpers'

export default function DebitNotes() {
  const { branchId } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [debitNotes, setDebitNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [noteToCancel, setNoteToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchDebitNotes = async () => {
    setLoading(true)
    try {
      const res = await api.get('/debit-notes', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          transaction_type: typeFilter || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        },
      })
      setDebitNotes(extractList(res))
    } catch (err) {
      console.error(err)
      setDebitNotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebitNotes()
  }, [search, statusFilter, typeFilter, fromDate, toDate])

  useEffect(() => {
    const params = {}
    searchParams.forEach((value, key) => {
      if (value) params[key] = value
    })
    if (typeFilter) params.type = typeFilter
    else delete params.type
    setSearchParams(params, { replace: true })
  }, [typeFilter])

  const handlePrintPdf = async (dn) => {
    try {
      await openPdf(`/debit-notes/${dn.id}/pdf`, `${dn.debit_note_number}.pdf`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCancelSubmit = async (e) => {
    e.preventDefault()
    if (!noteToCancel || !cancelReason.trim()) return

    setCancelling(true)
    try {
      await api.post(`/debit-notes/${noteToCancel.id}/cancel`, {
        cancellation_reason: cancelReason,
      })
      setCancelModalOpen(false)
      setNoteToCancel(null)
      setCancelReason('')
      fetchDebitNotes()
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to cancel debit note'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Debit / Credit Notes</h1>
          <p className="text-xs text-slate-500">
            Manage rebate debit notes, rate difference adjustments & vendor ledger impacts
          </p>
        </div>
        <Link
          to="/panel/debit-notes/new"
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          Create Debit Note
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search note number, invoice, lot, vendor..."
            className="w-full rounded-lg border border-slate-200 bg-[#fdfbf7] pl-9 pr-3 py-1.5 text-xs text-slate-700 focus:border-[#0b3558] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-[#fdfbf7] px-2.5 py-1.5 text-xs text-slate-700"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-[#fdfbf7] px-2.5 py-1.5 text-xs text-slate-700"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-[#fdfbf7] px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#0b3558] focus:bg-white focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-[#fdfbf7] px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#0b3558] focus:bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="posted">Posted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <PageSpinner label="Loading debit notes..." />
          </div>
        ) : debitNotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No debit notes found. Click "Create Debit Note" to record one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="py-3.5 px-4">Note Number</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Invoice / Lot Ref</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(debitNotes) ? debitNotes : []).map((dn) => (
                  <tr key={dn.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">
                      <Link to={`/panel/debit-notes/${dn.id}/edit`} className="hover:text-[#b37d14] hover:underline">
                        {dn.debit_note_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(dn.date)}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{dn.vendor?.vendor_name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium block">{dn.invoice_number ? `Inv: ${dn.invoice_number}` : 'Settlement'}</span>
                      <span className="font-mono text-[10.5px] text-slate-400 block">Lot: {dn.lot_number || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{dn.reason}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase ${
                          dn.transaction_type === 'debit'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {dn.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ₹{Number(dn.taxable_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#b37d14]">
                      ₹{Number(dn.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={dn.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/panel/debit-notes/${dn.id}/edit`}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-[#fbf5ea] hover:text-[#0b3558] hover:border-[#0b3558] transition-colors"
                          title="Edit Debit / Credit Note"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </Link>

                        <button
                          onClick={() => handlePrintPdf(dn)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-[#fbf5ea] hover:text-[#0b3558] transition-colors cursor-pointer"
                          title="Print Debit Note PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#b37d14]" />
                          <span>PDF</span>
                        </button>

                        {dn.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setNoteToCancel(dn)
                              setCancelReason('')
                              setCancelModalOpen(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            title="Cancel Debit Note"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Debit Note & Reverse Ledger"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Cancelling Debit Note <strong>{noteToCancel?.debit_note_number}</strong> will automatically reverse the ledger deduction for vendor <strong>{noteToCancel?.vendor?.vendor_name}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="State the audit reason for debit note cancellation..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={cancelling}
              className="rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
