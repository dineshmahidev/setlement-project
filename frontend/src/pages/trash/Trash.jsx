import React, { useState, useEffect, useMemo } from 'react'
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Layers,
  FileText,
  Package,
  Boxes,
  Users2,
  Building2,
  Receipt,
  Scale,
  ArrowRightLeft,
  Calendar,
  AlertCircle
} from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'

const TABS = [
  { id: 'all', label: 'All Items', icon: Layers },
  { id: 'inward', label: 'Inward Receipts', icon: Package },
  { id: 'outward', label: 'Outward Dispatches', icon: Package },
  { id: 'stock_transfer', label: 'Stock Transfers', icon: ArrowRightLeft },
  { id: 'production', label: 'Mixing / Batches', icon: Layers },
  { id: 'settlement', label: 'Settlements', icon: Scale },
  { id: 'debit_note', label: 'Debit Notes', icon: FileText },
  { id: 'invoice', label: 'Invoices', icon: Receipt },
  { id: 'vendor', label: 'Vendors / Parties', icon: Users2 },
  { id: 'item', label: 'Items Master', icon: Boxes },
  { id: 'branch', label: 'Godowns / Branches', icon: Building2 },
]

const TYPE_CONFIG = {
  inward: { label: 'Inward', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  outward: { label: 'Outward', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  stock_transfer: { label: 'Transfer', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  production: { label: 'Mixing', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  settlement: { label: 'Settlement', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  debit_note: { label: 'Debit Note', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  invoice: { label: 'Invoice', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  vendor: { label: 'Vendor', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  item: { label: 'Item', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  branch: { label: 'Godown', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
}

export default function Trash() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [counts, setCounts] = useState({})
  const [items, setItems] = useState([])

  // Confirm Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: '', // 'restore', 'force-delete', 'empty'
    item: null,
  })

  const fetchTrash = async () => {
    setLoading(true)
    try {
      const res = await api.get('/trash', {
        params: { type: activeTab }
      })
      if (res.data?.success) {
        setCounts(res.data.counts || {})
        setItems(res.data.items || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load trashed items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrash()
  }, [activeTab])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(it =>
      (it.title || '').toLowerCase().includes(q) ||
      (it.subtitle || '').toLowerCase().includes(q) ||
      (it.type || '').toLowerCase().includes(q)
    )
  }, [items, search])

  const handleRestore = async (item) => {
    setActionLoading(true)
    try {
      const res = await api.post(`/trash/${item.type}/${item.id}/restore`)
      if (res.data?.success) {
        toast.success(res.data.message || 'Restored successfully')
        setModalState({ isOpen: false, type: '', item: null })
        fetchTrash()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore item')
    } finally {
      setActionLoading(false)
    }
  }

  const handleForceDelete = async (item) => {
    setActionLoading(true)
    try {
      const res = await api.delete(`/trash/${item.type}/${item.id}/force-delete`)
      if (res.data?.success) {
        toast.success(res.data.message || 'Item permanently deleted')
        setModalState({ isOpen: false, type: '', item: null })
        fetchTrash()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to permanently delete item')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEmptyTrash = async () => {
    setActionLoading(true)
    try {
      const res = await api.post('/trash/empty', {
        type: activeTab === 'all' ? 'all' : activeTab
      })
      if (res.data?.success) {
        toast.success(res.data.message || 'Trash emptied successfully')
        setModalState({ isOpen: false, type: '', item: null })
        fetchTrash()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to empty trash')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-rose-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Trash & Recycle Bin
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/40 font-bold">
                  Soft-Delete Protected
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Deleted records are kept safe here. Document numbers increment sequentially without duplicate ID errors.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchTrash}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setModalState({ isOpen: true, type: 'empty', item: null })}
            disabled={loading || (counts.all || 0) === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Empty {activeTab === 'all' ? 'All Trash' : TABS.find(t => t.id === activeTab)?.label}
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const count = counts[tab.id] ?? 0
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-rose-900 text-white border-rose-700 shadow-md shadow-rose-950/20'
                  : 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-900 border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-300' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-rose-800 text-rose-200' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trashed items by title, party..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400/40 focus:border-rose-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> of {items.length} items
        </div>
      </div>

      {/* Trashed Items List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-rose-500 mb-2" />
            <p className="text-xs font-bold">Loading trashed records...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Trash is Empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are no deleted {activeTab !== 'all' ? TABS.find(t => t.id === activeTab)?.label : 'items'} in the trash. All active records are healthy and intact!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Document / Reference No</th>
                  <th className="py-3 px-4">Details & Party</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Trashed At</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it, idx) => {
                  const cfg = TYPE_CONFIG[it.type] || { label: it.type, color: 'bg-slate-100 text-slate-800 border-slate-300' }
                  const isEven = idx % 2 === 0
                  return (
                    <tr
                      key={`${it.type}-${it.id}`}
                      className={`border-b border-slate-100 transition-colors hover:bg-rose-50/40 ${
                        isEven ? 'bg-[#f8fafc]' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {it.title}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-xs text-slate-800">{it.subtitle}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {it.amount !== null && it.amount !== undefined ? (
                          <span>₹ {Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {it.deleted_at || 'Recently'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setModalState({ isOpen: true, type: 'restore', item: it })}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                            title="Restore record to active system"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-600" />
                            Restore
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalState({ isOpen: true, type: 'force-delete', item: it })}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-all cursor-pointer shadow-2xs"
                            title="Permanently remove"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  modalState.type === 'restore'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {modalState.type === 'restore' ? (
                  <RotateCcw className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {modalState.type === 'restore'
                    ? 'Confirm Restore'
                    : modalState.type === 'empty'
                    ? 'Empty Entire Trash?'
                    : 'Permanently Delete Record?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {modalState.type === 'restore'
                    ? `Restore "${modalState.item?.title}" back to active records?`
                    : modalState.type === 'empty'
                    ? 'All items currently in trash will be permanently wiped out. This cannot be undone.'
                    : `Permanently delete "${modalState.item?.title}"? ID sequence continues monotonically without duplicates.`}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Sequential ID Protection:</strong> Even when records are completely purged, new IDs will continue to increment sequentially without reusing numbers or causing duplicate errors.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalState({ isOpen: false, type: '', item: null })}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (modalState.type === 'restore') handleRestore(modalState.item)
                  else if (modalState.type === 'force-delete') handleForceDelete(modalState.item)
                  else if (modalState.type === 'empty') handleEmptyTrash()
                }}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl text-white transition-all shadow-md cursor-pointer ${
                  modalState.type === 'restore'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                }`}
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {modalState.type === 'restore'
                  ? 'Yes, Restore'
                  : modalState.type === 'empty'
                  ? 'Yes, Empty Trash'
                  : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
