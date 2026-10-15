import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiErrorMessage, openPdf, downloadPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Plus, Search, Scale, FileDown, Edit3, Calendar, Building, Printer, ChevronRight, Trash2 } from 'lucide-react'
import { PageSpinner, Modal, SettlementBillModal, ConfirmDialog } from '../../components'
import { extractList, formatDate } from '../../utils/helpers'

export default function Settlements() {
  const { branchId } = useAuth()
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Preview Modal
  const [previewSettlement, setPreviewSettlement] = useState(null)

  // Delete Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [settlementToDelete, setSettlementToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteSettlement = async () => {
    if (!settlementToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/settlements/${settlementToDelete.id}`)
      setSettlements((prev) => prev.filter((s) => s.id !== settlementToDelete.id))
      setDeleteConfirmOpen(false)
      setSettlementToDelete(null)
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to delete settlement'))
    } finally {
      setDeleting(false)
    }
  }

  const fetchSettlements = async () => {
    setLoading(true)
    try {
      const res = await api.get('/settlements', {
        params: {
          search: search || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
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
  }, [search, fromDate, toDate])

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
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4 text-right">Final Wt (MT)</th>
                  <th className="py-3.5 px-4 text-center">Oil %</th>
                  <th className="py-3.5 px-4 text-right">Oil Qty (KG)</th>
                  <th className="py-3.5 px-4 text-right">Bran Value (₹)</th>
                  <th className="py-3.5 px-4 text-right">Rebate (₹)</th>
                  <th className="py-3.5 px-4 text-right">Net Payable (₹)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(settlements) ? settlements : []).map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleViewSettlement(s)}
                    className="hover:bg-[#fbf5ea]/80 transition-colors cursor-pointer group"
                    title="Click to view Settlement Bill & Debit Note"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558] group-hover:text-[#b37d14] transition-colors">
                      <span className="hover:underline">
                        {s.settlement_number}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">Lot: {s.lot_number || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(s.settlement_date)}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.vendor?.vendor_name}</span>
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
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

                        <button
                          onClick={() => {
                            setSettlementToDelete(s)
                            setDeleteConfirmOpen(true)
                          }}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-[11px] font-semibold text-red-600 shadow-xs hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                          title="Delete Settlement Bill"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exact Combined Settlement Bill & Debit Note Preview Modal */}
      <SettlementBillModal
        settlement={previewSettlement}
        isOpen={Boolean(previewSettlement)}
        onClose={() => setPreviewSettlement(null)}
      />

      {/* Delete Confirmation Alert Box */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSettlement}
        loading={deleting}
        danger
        confirmText={deleting ? 'Deleting...' : 'Yes, Delete'}
        title="Delete Settlement Bill"
        message={`Are you sure you want to delete Settlement Bill "${settlementToDelete?.settlement_number}"? This will permanently delete the settlement bill and remove all linked debit notes and vendor ledger postings.`}
      />
    </div>
  )
}
