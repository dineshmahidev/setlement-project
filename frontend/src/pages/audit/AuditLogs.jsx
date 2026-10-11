import React, { useState, useEffect, useCallback } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import {
  History,
  Search,
  Eye,
  Filter,
  Calendar,
  User,
  Activity,
  Layers,
  FileCode,
} from 'lucide-react'
import { formatDateTime, formatDate, extractList } from '../../utils/helpers'

export default function AuditLogs() {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)

  // Filters
  const [action, setAction] = useState('')
  const [auditableType, setAuditableType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // View Log Detail Modal
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/audit-logs', {
        params: {
          page,
          per_page: 20,
          action: action || undefined,
          auditable_type: auditableType || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
        },
      })
      const list = extractList(res)
      setLogs(list)
      setMeta(res.data?.data || res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to fetch audit logs'))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [page, action, auditableType, dateFrom, dateTo, toast])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getActionBadge = (act) => {
    const map = {
      created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      updated: 'bg-blue-50 text-blue-700 border-blue-200',
      deleted: 'bg-red-50 text-red-700 border-red-200',
      cancelled: 'bg-amber-50 text-amber-700 border-amber-200',
      posted: 'bg-purple-50 text-purple-700 border-purple-200',
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${
          map[act?.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200'
        }`}
      >
        {act}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Trail</h1>
        <p className="text-sm text-slate-500">
          Complete, tamper-evident chronological activity log tracking all document creations, edits, status transitions and adjustments.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Module / Entity</label>
          <select
            value={auditableType}
            onChange={(e) => {
              setAuditableType(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:border-[#0b3558] focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="Settlement">Settlement Bills</option>
            <option value="DebitNote">Debit Notes</option>
            <option value="Invoice">Purchase Invoices</option>
            <option value="Vendor">Vendor Master</option>
            <option value="Branch">Branch Master</option>
            <option value="Product">Product Master</option>
            <option value="VendorLedger">Vendor Ledger</option>
            <option value="Setting">Settings</option>
            <option value="User">Users</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Action Type</label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:border-[#0b3558] focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="cancelled">Cancelled</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#0b3558] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#0b3558] focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-[#0b3558] text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-white">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-white">User / Performer</th>
                <th className="px-4 py-3 text-center font-semibold text-white">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Entity & Ref #</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Description / Reason</th>
                <th className="px-4 py-3 text-left font-semibold text-white">IP Address</th>
                <th className="px-4 py-3 text-right font-semibold text-white">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#b37d14] border-t-transparent"></div>
                      <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No activity logs recorded for this period.
                  </td>
                </tr>
              ) : (
                (Array.isArray(logs) ? logs : []).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.user?.name || 'System / Auto'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">
                        {log.auditable_type || log.module || '—'}
                      </span>
                      {log.auditable_id && (
                        <span className="text-slate-400 ml-1">#{log.auditable_id}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {log.description || '—'}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-500">
                      {log.ip_address || '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {(log.old_values || log.new_values) ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2.5 py-1 text-slate-700 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Diff
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">
                  Audit Snapshot #{selectedLog.id} — {selectedLog.auditable_type} ({selectedLog.action})
                </h3>
                <p className="text-xs text-slate-500">
                  Performed by {selectedLog.user?.name || 'System'} at{' '}
                  {formatDateTime(selectedLog.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {selectedLog.description && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Log Note: </span>
                  {selectedLog.description}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-red-500" />
                    Previous State (Old Values)
                  </h4>
                  <pre className="bg-slate-950 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-72">
                    {selectedLog.old_values
                      ? JSON.stringify(selectedLog.old_values, null, 2)
                      : 'None (New Record)'}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                    Updated State (New Values)
                  </h4>
                  <pre className="bg-slate-950 text-emerald-300 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-72">
                    {selectedLog.new_values
                      ? JSON.stringify(selectedLog.new_values, null, 2)
                      : 'None (Deleted Record)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
