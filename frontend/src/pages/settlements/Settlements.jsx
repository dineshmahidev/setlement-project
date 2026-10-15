import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiErrorMessage, openPdf, downloadPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Plus, Search, Scale, FileDown, Eye, Edit3, Ban, Calendar, Building, Printer, ChevronRight } from 'lucide-react'
import { PageSpinner, StatusBadge, Modal, SettlementBillModal } from '../../components'
import { extractList, formatDate } from '../../utils/helpers'

export default function Settlements() {
  const { branchId } = useAuth()
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Preview Modal
  const [previewSettlement, setPreviewSettlement] = useState(null)

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [settlementToCancel, setSettlementToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchSettlements = async () => {
    setLoading(true)
    try {
      const res = await api.get('/settlements', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          branch_id: branchId || undefined,
        },
      })
      setSettlements(extractList(res))
    } catch (err) {
      console.error(err)
      setSettlements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettlements()
  }, [search, statusFilter, fromDate, toDate, branchId])

  const handlePrintPdf = async (s) => {
    try {
      await openPdf(`/settlements/${s.id}/pdf`, `${s.settlement_number}.pdf`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleViewSettlement = async (s) => {
    setPreviewSettlement(s)
    try {
      const res = await api.get(`/settlements/${s.id}`)
      if (res.data?.data) {
        setPreviewSettlement(res.data.data)
      }
    } catch (err) {
      // Keep shallow settlement as fallback
    }
  }

  const handleCancelSubmit = async (e) => {
    e.preventDefault()
    if (!settlementToCancel || !cancelReason.trim()) return

    setCancelling(true)
    try {
      await api.post(`/settlements/${settlementToCancel.id}/cancel`, {
        cancellation_reason: cancelReason,
      })
      setCancelModalOpen(false)
      setSettlementToCancel(null)
      setCancelReason('')
      fetchSettlements()
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to cancel settlement'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Settlement Bills</h1>
          <p className="text-xs text-slate-500">
            Precision agro oil calculations, QC test parameters, bran valuation & debit note generation
          </p>
        </div>
        <Link
          to="/panel/settlements/new"
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          Create Settlement Bill
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settlement no, lot no, bill no, vendor..."
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

      {/* Settlements Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <PageSpinner label="Loading settlements..." />
          </div>
        ) : settlements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No settlement bills found. Click "Create Settlement Bill" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="py-3.5 px-4">Settlement No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Branch & Vendor</th>
                  <th className="py-3.5 px-4 text-right">Final Wt (MT)</th>
                  <th className="py-3.5 px-4 text-center">Oil %</th>
                  <th className="py-3.5 px-4 text-right">Oil Qty (KG)</th>
                  <th className="py-3.5 px-4 text-right">Bran Value (₹)</th>
                  <th className="py-3.5 px-4 text-right">Rebate (₹)</th>
                  <th className="py-3.5 px-4 text-right">Net Payable (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(settlements) ? settlements : []).map((s) => (
                  <tr key={s.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">
                      <Link to={`/panel/settlements/${s.id}/edit`} className="hover:text-[#b37d14] hover:underline">
                        {s.settlement_number}
                      </Link>
                      <span className="block text-[10px] text-slate-400 font-mono">Lot: {s.lot_number || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(s.settlement_date)}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.vendor?.vendor_name}</span>
                      <span className="text-[10.5px] text-slate-400 block">{s.branch?.branch_name}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {Number(s.final_weight_mt).toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#b37d14]">
                      {Number(s.oil_content).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {Number(s.oil_quantity_kg).toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ₹{Number(s.bran_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {Number(s.rebate_amount) > 0 ? (
                        (s.debit_notes?.[0]?.transaction_type === 'credit' ||
                         s.note_type === 'credit' ||
                         (parseFloat(s.original_invoice_value) > 0 && ((parseFloat(s.original_invoice_value) - parseFloat(s.bran_value) + (parseFloat(s.manual_adjustment) || 0)) < 0)) ||
                         (!parseFloat(s.original_invoice_value) && parseFloat(s.manual_adjustment) < 0)) ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold inline-block">
                            +₹{Number(s.rebate_amount).toLocaleString('en-IN')} (CN)
                          </span>
                        ) : (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-bold inline-block">
                            -₹{Number(s.rebate_amount).toLocaleString('en-IN')} (DN)
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0b3558]">
                      ₹{Number(s.net_payable).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewSettlement(s)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-[#0b3558] shadow-xs hover:bg-[#fbf5ea] hover:border-[#b37d14] transition-colors cursor-pointer"
                          title="View exact Settlement Bill & Note"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#b37d14]" />
                          <span>View</span>
                        </button>

                        <Link
                          to={`/panel/settlements/${s.id}/edit`}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-[#fbf5ea] hover:text-[#0b3558] hover:border-[#0b3558] transition-colors"
                          title="Edit Settlement Bill"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </Link>

                        <button
                          onClick={() => handlePrintPdf(s)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-[#fbf5ea] hover:text-[#0b3558] transition-colors cursor-pointer"
                          title="Print / View Settlement Bill PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>PDF</span>
                        </button>

                        {s.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setSettlementToCancel(s)
                              setCancelReason('')
                              setCancelModalOpen(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Cancel settlement"
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

      {/* Cancel Settlement Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Settlement Bill"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Cancelling Settlement <strong>{settlementToCancel?.settlement_number}</strong> will cancel all linked debit notes and reverse the vendor ledger adjustments.
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
              placeholder="State the audit reason for settlement cancellation..."
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

      {/* Exact Combined Settlement Bill & Debit Note Preview Modal */}
      <SettlementBillModal
        settlement={previewSettlement}
        isOpen={Boolean(previewSettlement)}
        onClose={() => setPreviewSettlement(null)}
      />
    </div>
  )
}
