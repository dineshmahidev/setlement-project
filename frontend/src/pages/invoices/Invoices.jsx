import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Plus, Search, Receipt, Eye, Edit3, Ban, Calendar, Building, Users } from 'lucide-react'
import { PageSpinner, StatusBadge, Modal } from '../../components'
import { extractList, formatDate } from '../../utils/helpers'

export default function Invoices() {
  const { branchId } = useAuth()
  const toast = useToast()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [invoiceToCancel, setInvoiceToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await api.get('/invoices', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          branch_id: branchId || undefined,
        },
      })
      setInvoices(extractList(res))
    } catch (err) {
      console.error(err)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [search, statusFilter, fromDate, toDate, branchId])

  const handleCancelSubmit = async (e) => {
    e.preventDefault()
    if (!invoiceToCancel || !cancelReason.trim()) return

    setCancelling(true)
    try {
      await api.post(`/invoices/${invoiceToCancel.id}/cancel`, {
        cancellation_reason: cancelReason,
      })
      toast.success('Invoice cancelled successfully')
      setCancelModalOpen(false)
      setInvoiceToCancel(null)
      setCancelReason('')
      fetchInvoices()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to cancel invoice'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Purchase Invoices</h1>
          <p className="text-xs text-slate-500">Record vendor delivery invoices, weights, contract rates and GST</p>
        </div>
        <Link
          to="/panel/invoices/new"
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          Enter New Invoice
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
            placeholder="Search invoice no, lot no, vehicle, vendor..."
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
            <option value="approved">Approved / Active</option>
            <option value="settled">Settled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <PageSpinner label="Loading invoices..." />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No invoices found. Click "Enter New Invoice" to record one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Branch & Vendor</th>
                  <th className="py-3.5 px-4">Product / Lot</th>
                  <th className="py-3.5 px-4 text-right">Net Weight</th>
                  <th className="py-3.5 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(invoices) ? invoices : []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">
                      <Link to={`/panel/invoices/${inv.id}/edit`} className="hover:text-[#b37d14] hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.invoice_date)}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{inv.vendor?.vendor_name}</span>
                      <span className="text-[10.5px] text-slate-400 block">{inv.branch?.branch_name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold block">{inv.product?.product_name || 'Agro Product'}</span>
                      <span className="font-mono text-[10.5px] text-slate-400 block">Lot: {inv.lot_number || '-'} | {inv.vehicle_number || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {Number(inv.net_weight_mt).toFixed(3)} MT
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ₹{Number(inv.taxable_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0b3558]">
                      ₹{Number(inv.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/panel/invoices/${inv.id}/edit`}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-[#fbf5ea] hover:text-[#0b3558] hover:border-[#0b3558] transition-colors"
                          title="Edit Purchase Invoice"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </Link>

                        {inv.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setInvoiceToCancel(inv)
                              setCancelReason('')
                              setCancelModalOpen(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            title="Cancel Invoice"
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

      {/* Cancel Invoice Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Invoice & Reverse Ledger"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Cancelling Invoice <strong>{invoiceToCancel?.invoice_number}</strong> will automatically post a reversal debit entry to the vendor ledger.
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
              placeholder="State the audit reason for invoice cancellation..."
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
