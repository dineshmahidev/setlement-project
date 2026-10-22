import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Package,
  TrendingDown,
  Building2,
  Users,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Boxes,
  RefreshCw,
  Eye,
  X,
  MapPin,
  Truck,
  ArrowDownUp,
  CheckCircle2,
  Printer,
  Calendar,
  Plus,
  ArrowRightLeft,
  Filter,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import api, { apiErrorMessage, openPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from '../../components'
import { formatDate, formatNumber, today, extractList } from '../../utils/helpers'

function FormField({ label, required, className, children }) {
  return (
    <div className={className || ''}>
      {label && (
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
    </div>
  )
}

function useMasters() {
  const [vendors, setVendors] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    const list = (d) => (Array.isArray(d) ? d : d.data?.data || d.data || [])
    Promise.all([
      api.get('/vendors?per_page=100').catch(() => ({ data: [] })),
      api.get('/vehicles?per_page=100').catch(() => ({ data: [] })),
      api.get('/items?all=1').catch(() => ({ data: [] })),
      api.get('/branches?per_page=100').catch(() => ({ data: [] })),
      api.get('/units?all=1').catch(() => ({ data: [] })),
    ]).then(([v, veh, it, br, u]) => {
      setVendors(list(v.data))
      setVehicles(list(veh.data))
      setItems(list(it.data))
      setBranches(list(br.data))
      setUnits(list(u.data))
    })
  }, [])

  return { vendors, vehicles, items, branches, units }
}

/* ---------------- GOLD PARTY INVENTORY DASHBOARD ---------------- */
export function PartyStockDashboard() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { branches, items: masterItems } = useMasters()
  const [loading, setLoading] = useState(true)
  const [summaryData, setSummaryData] = useState({
    summary: {
      total_inlet_mt: 0,
      total_inlet_bags: 0,
      total_outlet_mt: 0,
      total_outlet_bags: 0,
      net_holding_mt: 0,
      net_holding_bags: 0,
      active_parties: 0,
      active_godowns: 0,
    },
    parties: [],
    godowns: [],
    recent_movements: [],
  })
  const [search, setSearch] = useState('')
  const [filterGodown, setFilterGodown] = useState('')
  const [filterItem, setFilterItem] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedMovementParty, setSelectedMovementParty] = useState(null)
  const [viewMode, setViewMode] = useState('godown') // 'godown' | 'table' | 'movements'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/party-summary', {
        params: {
          branch_id: filterGodown || branchId || undefined,
          item_id: filterItem || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      })
      setSummaryData(
        res.data || {
          summary: {},
          parties: [],
          godowns: [],
          recent_movements: [],
        },
      )
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load gold inventory dashboard'))
    } finally {
      setLoading(false)
    }
  }, [branchId, filterGodown, filterItem, dateFrom, dateTo, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter parties by search, godown, and item
  const filteredParties = (summaryData.parties || []).filter((p) => {
    const matchesSearch =
      !search ||
      (p.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.vendor_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.branch_name || '').toLowerCase().includes(search.toLowerCase())
    const matchesGodown = !filterGodown || String(p.branch_id) === String(filterGodown)
    const matchesItem = !filterItem || String(p.product_id) === String(filterItem)
    return matchesSearch && matchesGodown && matchesItem
  })

  // Filter godowns
  const filteredGodowns = (summaryData.godowns || []).filter((g) => {
    if (filterGodown && String(g.branch_id) !== String(filterGodown)) return false
    if (!filterItem) return true
    return (g.vendors || []).some((v) => String(v.product_id) === String(filterItem))
  })

  return (
    <div className="space-y-4">
      {/* Sleek Compact Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-4 text-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-[#C9A227] text-slate-950 shadow-2xs">
              <Package className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-[#0B1A2D] uppercase tracking-wide">
                  Inventory Dashboard
                </h1>
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.2 text-[9px] font-bold text-amber-900">
                  LIVE CONSOLIDATED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Godown-Wise Vendors • Stock In & Stock Out Counts • Remaining Stock Balance
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#C9A227] ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Compact Metric Summary Cards - Soft pastel (3 Cards) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-3.5 shadow-sm border border-violet-200/70 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[11px] text-violet-500 font-bold uppercase tracking-wider">
              <span>Stock In</span>
              <ArrowUpRight className="h-4 w-4 text-violet-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900">
                {formatNumber(summaryData.summary.total_inlet_mt || 0)}
              </span>
              <span className="text-xs font-bold text-violet-400">MT</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {formatNumber(summaryData.summary.total_inlet_bags || 0)} Bags Imported
            </p>
          </div>

          <div className="rounded-xl bg-white p-3.5 shadow-sm border border-rose-200/70 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[11px] text-rose-500 font-bold uppercase tracking-wider">
              <span>Stock Out</span>
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900">
                {formatNumber(summaryData.summary.total_outlet_mt || 0)}
              </span>
              <span className="text-xs font-bold text-rose-400">MT</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {formatNumber(summaryData.summary.total_outlet_bags || 0)} Bags Exported
            </p>
          </div>

          <div className="rounded-xl bg-white p-3.5 shadow-sm border border-lime-300/80 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[11px] text-lime-600 font-bold uppercase tracking-wider">
              <span>Stock Balance</span>
              <Layers className="h-4 w-4 text-lime-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">
                {formatNumber(summaryData.summary.net_holding_mt || 0)}
              </span>
              <span className="text-xs font-bold text-lime-500">MT</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              {formatNumber(summaryData.summary.net_holding_bags || 0)} Bags Remaining
            </p>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-3 shadow-2xs space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#C9A227]" />
              <label className="text-xs font-semibold text-slate-700">Godown:</label>
              <select
                value={filterGodown}
                onChange={(e) => setFilterGodown(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-[#0B1A2D] focus:border-[#C9A227] focus:bg-white focus:outline-none"
              >
                <option value="">All Godowns ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name || b.name} {b.branch_code ? `(${b.branch_code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-[#C9A227]" />
              <label className="text-xs font-semibold text-slate-700">Item:</label>
              <select
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-[#0B1A2D] focus:border-[#C9A227] focus:bg-white focus:outline-none"
              >
                <option value="">All Items ({masterItems.length})</option>
                {masterItems.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name || it.product_name} {it.code ? `(${it.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#C9A227]" />
              <label className="text-xs font-semibold text-slate-700">Duration:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50/80 px-2 py-1 text-xs font-medium text-[#0B1A2D] focus:border-[#C9A227] focus:bg-white focus:outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50/80 px-2 py-1 text-xs font-medium text-[#0B1A2D] focus:border-[#C9A227] focus:bg-white focus:outline-none"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="text-[11px] text-rose-600 font-bold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative min-w-[160px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search party or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50/80 pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  ...(filterGodown && { branch_id: filterGodown }),
                  ...(filterItem && { item_id: filterItem }),
                  ...(dateFrom && { date_from: dateFrom }),
                  ...(dateTo && { date_to: dateTo }),
                })
                openPdf(`/inventory/stock/pdf?${params.toString()}`, `Stock_Summary.pdf`)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1A2D] shadow-2xs hover:bg-[#faedcd] transition-all"
            >
              <Printer className="h-3.5 w-3.5 text-[#b37d14]" />
              Export Stock PDF
            </button>

            {/* View Switcher Segmented Control */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('godown')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'godown'
                  ? 'bg-gradient-to-r from-amber-400 to-[#C9A227] text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Godown View
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-amber-400 to-[#C9A227] text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="h-4 w-4" />
              Party Table
            </button>

            <button
              onClick={() => setViewMode('movements')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'movements'
                  ? 'bg-gradient-to-r from-amber-400 to-[#C9A227] text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownUp className="h-4 w-4" />
              Movement Log
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* VIEW MODE 1: GODOWN-WISE CARDS WITH VENDORS & MOVEMENT FLOW */}
      {viewMode === 'godown' && (
        <div className="space-y-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-semibold text-slate-500">
              <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#b37d14] mb-2" />
              Loading Godowns & Vendor stock data...
            </div>
          ) : filteredGodowns.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <h3 className="text-base font-extrabold text-[#0b3558]">No Godown stock records found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try clearing your dropdown filters or post stock transactions to view godown-wise vendor stocks.
              </p>
            </div>
          ) : (
            filteredGodowns.map((g) => {
              const godownVendors = (g.vendors || []).filter((v) => {
                if (!search) return true
                return (
                  v.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
                  v.product_name.toLowerCase().includes(search.toLowerCase())
                )
              })

              return (
                <div
                  key={g.branch_id}
                  className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm transition-all"
                >
                  {/* Godown Card Header */}
                  <div className="bg-gradient-to-r from-[#0b3558] via-[#12426c] to-[#0b3558] p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-black">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-amber-300">{g.branch_name}</h3>
                          <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                            {g.vendors_count} Vendors Attached
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Godown Total Inlet: <strong>{formatNumber(g.total_inlet_mt)} MT</strong> ({g.total_inlet_bags} Bags) • Total Outlet: <strong>{formatNumber(g.total_outlet_mt)} MT</strong> ({g.total_outlet_bags} Bags)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-right">
                        <span className="block text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                          Godown Remaining Stock
                        </span>
                        <div className="text-lg font-black text-amber-200">
                          {formatNumber(g.current_holding_mt)} <span className="text-xs font-semibold">MT</span>
                        </div>
                        <div className="text-[10px] text-amber-300/80">({g.current_holding_bags} Bags Balance)</div>
                      </div>
                    </div>
                  </div>

                    {/* Vendor Stock Matrix for this Godown */}
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="flex items-center gap-1.5 text-[#0b3558]">
                        <Users className="h-4 w-4 text-[#b37d14]" />
                        Vendor Stock Accounts in {g.branch_name}
                      </span>
                      <span className="text-[11px] font-normal text-slate-500">
                        Stock In, Stock Out & Stock Balance
                      </span>
                    </div>

                    {godownVendors.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No vendor stock matches search in this godown.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-100 text-[#0b3558] uppercase text-[10px] font-black tracking-wider">
                            <tr>
                              <th className="px-3 py-2.5 rounded-l-lg">Vendor / Party</th>
                              <th className="px-3 py-2.5">Commodity / Item</th>
                              <th className="px-3 py-2.5 text-right">Stock In</th>
                              <th className="px-3 py-2.5 text-right">Stock Out</th>
                              <th className="px-3 py-2.5 text-right rounded-r-lg">Stock Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {godownVendors.map((v, vIdx) => (
                              <tr key={vIdx} className="hover:bg-amber-50/50 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="font-extrabold text-[#0b3558]">{v.vendor_name}</div>
                                  <div className="text-[10px] font-semibold text-slate-400">{v.vendor_code}</div>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/90 px-2 py-0.5 text-xs font-bold text-amber-900 border border-amber-300/50">
                                    {v.product_name}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <div className="font-extrabold text-emerald-700">
                                    {formatNumber(v.inlet_mt)} MT
                                  </div>
                                  <div className="text-[10px] font-semibold text-emerald-600">
                                    {v.inlet_bags} Bags
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <div className="font-extrabold text-rose-700">
                                    {formatNumber(v.outlet_mt)} MT
                                  </div>
                                  <div className="text-[10px] font-semibold text-rose-600">
                                    {v.outlet_bags} Bags
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <div className="inline-block rounded-lg border border-amber-400/60 bg-gradient-to-r from-amber-400/20 to-yellow-500/10 px-2.5 py-1 text-right">
                                    <div className="font-black text-amber-950">{formatNumber(v.holding_mt)} MT</div>
                                    <div className="text-[10px] font-bold text-amber-800">{v.holding_bags} Bags</div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: CONSOLIDATED PARTY MASTER TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0b3558] flex items-center gap-2">
                <Boxes className="h-5 w-5 text-[#b37d14]" />
                All Vendors Master Inventory Stock Table
              </h2>
              <p className="text-xs text-slate-500">
                Consolidated Stock In vs Stock Out and Stock Balance across all Godowns
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-500">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#b37d14] mb-2" />
              Loading party stock table...
            </div>
          ) : filteredParties.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No party stock records found matching filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#0b3558] text-white uppercase text-[10px] tracking-wider font-black">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Godown Location</th>
                    <th className="px-4 py-3">Party (Vendor)</th>
                    <th className="px-4 py-3">Item / Commodity</th>
                    <th className="px-4 py-3 text-right">Stock In</th>
                    <th className="px-4 py-3 text-right">Stock Out</th>
                    <th className="px-4 py-3 text-right rounded-tr-xl">Stock Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParties.map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-[#0b3558] flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-[#b37d14]" />
                          {row.branch_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900">{row.vendor_name}</div>
                        <div className="text-[10px] font-semibold text-slate-400">{row.vendor_code}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                          {row.product_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-emerald-700 font-extrabold">{formatNumber(row.inlet_mt)} MT</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{row.inlet_bags} Bags</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-rose-700 font-extrabold">{formatNumber(row.outlet_mt)} MT</div>
                        <div className="text-[10px] text-rose-600 font-medium">{row.outlet_bags} Bags</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-block rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-400/20 to-yellow-500/10 px-3 py-1 font-black text-amber-950">
                          {formatNumber(row.holding_mt)} MT
                          <span className="block text-[10px] font-bold text-amber-800">
                            ({row.holding_bags} Bags)
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 3: GLOBAL STOCK MOVEMENT FLOW LOG */}
      {viewMode === 'movements' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#0b3558] flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5 text-[#b37d14]" />
              Recent Stock Movement Flow Audit Log
            </h2>
            <p className="text-xs text-slate-500">
              Detailed tracking showing exact Source (Vendor/Origin), Destination (Godown/Customer), Vehicle & Quantities
            </p>
          </div>

          {summaryData.recent_movements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent stock movement logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#0b3558] text-white uppercase text-[10px] tracking-wider font-black">
                  <tr>
                    <th className="px-3 py-2.5 rounded-tl-lg">Date</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Ref / Bill #</th>
                    <th className="px-3 py-2.5">Source (From)</th>
                    <th className="px-3 py-2.5">Destination (To)</th>
                    <th className="px-3 py-2.5 text-right">Quantity MT</th>
                    <th className="px-3 py-2.5 text-right">Bags Count</th>
                    <th className="px-3 py-2.5 rounded-tr-lg">Vehicle #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryData.recent_movements.map((m, mIdx) => (
                    <tr key={mIdx} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-800">{m.date}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                            m.type === 'IMPORT_INLET'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {m.type === 'IMPORT_INLET' ? 'Import (Inlet)' : 'Export (Outlet)'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-[#0b3558]">{m.ref_no}</td>
                      <td className="px-3 py-2.5 text-emerald-800 font-semibold">{m.source}</td>
                      <td className="px-3 py-2.5 text-rose-800 font-semibold">{m.destination}</td>
                      <td className="px-3 py-2.5 text-right font-black text-slate-900">
                        {formatNumber(m.quantity_mt)} MT
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-700">
                        {m.quantity_bags} Bags
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                          <Truck className="h-3 w-3 text-slate-500" />
                          {m.vehicle}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MOVEMENT DETAIL MODAL FOR A SPECIFIC VENDOR & GODOWN */}
      {selectedMovementParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-amber-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0b3558] via-[#174872] to-[#0b3558] p-5 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-amber-300">
                    Stock Movement Trace: {selectedMovementParty.vendor_name}
                  </h3>
                  <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                    {selectedMovementParty.vendor_code}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Godown: <strong className="text-amber-200">{selectedMovementParty.branch_name}</strong> • Item: <strong className="text-amber-200">{selectedMovementParty.product_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedMovementParty(null)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Summary KPI Ribbon - Solid Colors */}
            <div className="grid grid-cols-3 gap-3 bg-slate-900/10 p-4 border-b border-slate-200">
              <div className="rounded-xl bg-teal-700 text-white p-3 text-center shadow-sm">
                <span className="text-[10px] font-bold uppercase text-teal-100 tracking-wider">Total Import (Inlet)</span>
                <div className="text-lg font-black text-white">{formatNumber(selectedMovementParty.inlet_mt)} MT</div>
                <div className="text-[10px] text-teal-100 font-semibold">{selectedMovementParty.inlet_bags} Bags</div>
              </div>
              <div className="rounded-xl bg-rose-600 text-white p-3 text-center shadow-sm">
                <span className="text-[10px] font-bold uppercase text-rose-100 tracking-wider">Total Export (Outlet)</span>
                <div className="text-lg font-black text-white">{formatNumber(selectedMovementParty.outlet_mt)} MT</div>
                <div className="text-[10px] text-rose-100 font-semibold">{selectedMovementParty.outlet_bags} Bags</div>
              </div>
              <div className="rounded-xl bg-[#b37d14] text-white p-3 text-center shadow-sm">
                <span className="text-[10px] font-bold uppercase text-amber-100 tracking-wider">Remaining Balance</span>
                <div className="text-lg font-black text-white">{formatNumber(selectedMovementParty.holding_mt)} MT</div>
                <div className="text-[10px] text-amber-100 font-bold">{selectedMovementParty.holding_bags} Bags</div>
              </div>
            </div>

            {/* Modal Content: Detailed Movement Rows */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-xs font-black uppercase text-[#0b3558] tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#b37d14]" />
                Movement Flow Traceability Log (Where Stock Came From & Where Stock Went To)
              </h4>

              {(!selectedMovementParty.movements || selectedMovementParty.movements.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No individual movement logs recorded for this vendor account.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMovementParty.movements.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 hover:border-amber-300 hover:bg-white transition-all shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                              m.type === 'IMPORT_INLET'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {m.type === 'IMPORT_INLET' ? 'IMPORT (STOCK IN)' : 'EXPORT (STOCK OUT)'}
                          </span>
                          <span className="text-xs font-extrabold text-[#0b3558]">Ref: {m.ref_no}</span>
                          <span className="text-xs text-slate-400">• {m.date}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-extrabold text-slate-900">{formatNumber(m.quantity_mt)} MT</span>
                          <span className="text-slate-400">|</span>
                          <span className="font-bold text-slate-700">{m.quantity_bags} Bags</span>
                        </div>
                      </div>

                      {/* Movement Flow Arrows */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="rounded-lg bg-emerald-50/80 p-2.5 border border-emerald-200/60">
                          <span className="text-[10px] font-bold text-emerald-900 uppercase block">
                            Source (Where Stock Came From)
                          </span>
                          <div className="font-black text-emerald-950 mt-0.5 flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-emerald-600" />
                            {m.source}
                          </div>
                        </div>

                        <div className="rounded-lg bg-rose-50/80 p-2.5 border border-rose-200/60">
                          <span className="text-[10px] font-bold text-rose-900 uppercase block">
                            Destination (Where Stock Went To)
                          </span>
                          <div className="font-black text-rose-950 mt-0.5 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-rose-600" />
                            {m.destination}
                          </div>
                        </div>
                      </div>

                      {m.remarks && (
                        <div className="text-[11px] text-slate-500 italic pt-1">
                          Remarks: {m.remarks} • Vehicle: {m.vehicle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedMovementParty(null)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Close Trace Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


/* ---------------- CURRENT STOCK ---------------- */
export function CurrentStock() {
  const toast = useToast()
  const { branchId } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { branches, items } = useMasters()
  const [selBranch, setSelBranch] = useState('')
  const [selItem, setSelItem] = useState('')
  const [hideZeroStock, setHideZeroStock] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/stock', {
        params: {
          branch_id: selBranch || branchId || undefined,
          hide_zero: hideZeroStock ? 1 : undefined,
        },
      })
      let data = Array.isArray(res.data) ? res.data : res.data.data || []
      if (hideZeroStock) {
        data = data.filter((r) => Math.abs(Number(r.available || 0)) > 0.0001)
      }
      if (selItem) data = data.filter((r) => String(r.item_id) === String(selItem))
      if (search) {
        const q = search.toLowerCase()
        data = data.filter(
          (r) =>
            String(r.item_name || r.item || '').toLowerCase().includes(q) ||
            String(r.item_code || '').toLowerCase().includes(q),
        )
      }
      setRows(data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load stock'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [branchId, selBranch, selItem, search, hideZeroStock, toast])

  useEffect(() => {
    load()
  }, [load])

  function handleExportPdf() {
    const params = new URLSearchParams({
      ...(selBranch || branchId ? { branch_id: selBranch || branchId } : {}),
      ...(selItem && { item_id: selItem }),
      ...(search && { search: search }),
      ...(hideZeroStock && { hide_zero: 1 }),
    })
    openPdf(`/inventory/stock/pdf?${params.toString()}`, 'Current_Stock_Report.pdf')
  }

  const totalItemsCount = rows.length
  const availableCount = rows.filter((r) => (r.available || 0) > 0).length
  const outOfStockCount = rows.filter((r) => (r.available || 0) <= 0).length

  const totIn = rows.reduce((s, r) => s + Number(r.total_in || 0), 0)
  const totOut = rows.reduce((s, r) => s + Number(r.total_out || 0), 0)
  const totAvail = rows.reduce((s, r) => s + Number(r.available || 0), 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Current Stock"
        subtitle="Available inventory quantity by commodity & godown"
        icon={Boxes}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#C9A227] hover:bg-slate-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#C9A227] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Button
              variant="secondary"
              onClick={handleExportPdf}
              className="border-[#C9A227]/50 text-[#0b3558] font-bold hover:bg-amber-50 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-[#C9A227]" /> Export PDF
            </Button>
          </div>
        }
      />

      {/* Metric Cards - 3 Core Cards in Settlement Dashboard Style */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Total Commodities */}
        <div
          onClick={() => {
            setHideZeroStock(false)
            setSelItem('')
          }}
          className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between border border-violet-200/70 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-500 flex items-center gap-1.5">
                Total Commodities
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-violet-400" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shrink-0 border border-violet-200/70">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {totalItemsCount}
              </span>
              <span className="text-xs font-medium text-slate-500">items</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="inline-flex items-center rounded-md bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 truncate max-w-full">
              Total In: {formatNumber(totIn)} MT
            </span>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-violet-600 flex items-center gap-1 transition-colors">
              All items <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: In Stock Available */}
        <div
          onClick={() => setHideZeroStock(true)}
          className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between border border-emerald-200/70 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                In Stock Available
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-500" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 border border-emerald-200/70">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {availableCount}
              </span>
              <span className="text-xs font-medium text-slate-500">active items</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 truncate max-w-full">
              Available: {formatNumber(totAvail)} MT
            </span>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-600 flex items-center gap-1 transition-colors">
              Ready to dispatch <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Zero Stock Level */}
        <div
          onClick={() => setHideZeroStock(false)}
          className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between border border-rose-200/70 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                Zero Stock Level
                <ArrowDownRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-rose-400" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0 border border-rose-200/70">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {outOfStockCount}
              </span>
              <span className="text-xs font-medium text-slate-500">depleted items</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 truncate max-w-full">
              Total Out: {formatNumber(totOut)} MT
            </span>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-rose-600 flex items-center gap-1 transition-colors">
              Needs restock <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search item name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-52">
          <Select value={selBranch} onChange={(e) => setSelBranch(e.target.value)}>
            <option value="">All Godowns / Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Select value={selItem} onChange={(e) => setSelItem(e.target.value)}>
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Select
            value={hideZeroStock ? 'hide' : 'show'}
            onChange={(e) => setHideZeroStock(e.target.value === 'hide')}
          >
            <option value="hide">Hide Zero Stock</option>
            <option value="show">Show Zero Stock</option>
          </Select>
        </div>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="item_id"
        emptyTitle="No stock records"
        emptyMessage="Stock appears after stock-in or approved settlement bills."
        columns={[
          {
            key: 'item_name',
            label: 'Item',
            render: (r) => <span className="font-extrabold text-slate-900 text-sm">{r.item_name}</span>,
          },
          {
            key: 'total_in',
            label: 'In',
            align: 'right',
            render: (r) => (
              <span className="text-emerald-700 font-black text-sm">
                {formatNumber(r.total_in ?? 0)}
              </span>
            ),
          },
          {
            key: 'total_out',
            label: 'Out',
            align: 'right',
            render: (r) => (
              <span className="text-rose-700 font-black text-sm">
                {formatNumber(r.total_out ?? 0)}
              </span>
            ),
          },
          {
            key: 'available',
            label: 'Available',
            align: 'right',
            render: (r) => (
              <span className="text-emerald-950 font-black text-base bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {formatNumber(r.available ?? 0)}
              </span>
            ),
          },
          {
            key: 'unit',
            label: 'Unit',
            align: 'center',
            render: (r) => (
              <span className="text-xs font-bold uppercase text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {r.unit || '—'}
              </span>
            ),
          },
        ]}
        footer={
          rows.length > 0 ? (
            <tr>
              <td className="px-4 py-3 text-right text-xs font-black text-slate-700 uppercase">
                TOTAL / POSITION:
              </td>
              <td className="px-4 py-3 text-right text-xs font-black text-emerald-700">
                {formatNumber(totIn)}
              </td>
              <td className="px-4 py-3 text-right text-xs font-black text-rose-700">
                {formatNumber(totOut)}
              </td>
              <td className="px-4 py-3 text-right text-xs font-black text-[#0b3558] bg-blue-50/70">
                {formatNumber(totAvail)}
              </td>
              <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">
                —
              </td>
            </tr>
          ) : null
        }
      />
    </div>
  )
}

/* ---------------- STOCK IN ---------------- */
export function StockIn() {
  const toast = useToast()
  const { user, branchId } = useAuth()
  const { vendors, vehicles, items, branches } = useMasters()
  const [form, setForm] = useState({
    date: today(),
    branch_id: branchId || user?.default_branch_id || '',
    item_id: '',
    quantity: '',
    vehicle_id: '',
    driver_name: '',
    driver_mobile: '',
    vendor_id: '',
    lot_number: '',
    reference_type: 'Manual',
    source_reference: '',
    remarks: '',
  })
  const [saving, setSaving] = useState(false)

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/stock-in', {
        ...form,
        branch_id: Number(form.branch_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
        vendor_id: form.vendor_id ? Number(form.vendor_id) : undefined,
      })
      toast.success('Stock in recorded')
      setForm((f) => ({ ...f, quantity: '', lot_number: '', source_reference: '', remarks: '' }))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Stock in failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Stock In" subtitle="Manual stock receipt" />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
        </FormField>
        <FormField label="Branch / Godown" required>
          <Select value={form.branch_id} onChange={(e) => setF('branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name || b.name} {b.branch_code || b.code ? `(${b.branch_code || b.code})` : ''}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Item / Product" required>
          <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)} required>
            <option value="">Select…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name || i.product_name} {i.code || i.product_code ? `(${i.code || i.product_code})` : ''}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity (MT/Bags)" required>
          <Input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} required />
        </FormField>
        <FormField label="Vehicle">
          <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
            <option value="">Select…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number || v.number || `Vehicle #${v.id}`}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Party (Vendor)">
          <Select value={form.vendor_id} onChange={(e) => setF('vendor_id', e.target.value)}>
            <option value="">Select…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vendor_name || v.name || v.business_name} ({v.vendor_code || v.code || `V-${v.id}`})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Driver Name">
          <Input value={form.driver_name} onChange={(e) => setF('driver_name', e.target.value)} />
        </FormField>
        <FormField label="Driver Mobile">
          <Input value={form.driver_mobile} onChange={(e) => setF('driver_mobile', e.target.value)} />
        </FormField>
        <FormField label="Lot Number">
          <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
        </FormField>
        <FormField label="Reference Type">
          <Select value={form.reference_type} onChange={(e) => setF('reference_type', e.target.value)}>
            {['Manual', 'Purchase', 'Return', 'Opening Stock', 'Settlement Bill', 'Other'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Reference" className="sm:col-span-2">
          <Input value={form.source_reference} onChange={(e) => setF('source_reference', e.target.value)} />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>Post Stock In</Button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- STOCK OUT ---------------- */
export function StockOut() {
  const toast = useToast()
  const { user, branchId } = useAuth()
  const { vehicles, items, branches } = useMasters()
  const [form, setForm] = useState({
    date: today(),
    branch_id: branchId || user?.default_branch_id || '',
    item_id: '',
    quantity: '',
    vehicle_id: '',
    driver_name: '',
    driver_mobile: '',
    destination: '',
    customer: '',
    lot_number: '',
    remarks: '',
  })
  const [saving, setSaving] = useState(false)

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/stock-out', {
        ...form,
        branch_id: Number(form.branch_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
      })
      toast.success('Stock out recorded')
      setForm((f) => ({ ...f, quantity: '', destination: '', customer: '', remarks: '' }))
    } catch (err) {
      const msg = apiErrorMessage(err, 'Stock out failed')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Stock Out" subtitle="Dispatch stock — fails if insufficient" />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
        </FormField>
        <FormField label="Branch / Godown" required>
          <Select value={form.branch_id} onChange={(e) => setF('branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name || b.name} {b.branch_code || b.code ? `(${b.branch_code || b.code})` : ''}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Item / Product" required>
          <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)} required>
            <option value="">Select…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name || i.product_name} {i.code || i.product_code ? `(${i.code || i.product_code})` : ''}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity (MT/Bags)" required>
          <Input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} required />
        </FormField>
        <FormField label="Vehicle">
          <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
            <option value="">Select…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number || v.number || `Vehicle #${v.id}`}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Driver Name">
          <Input value={form.driver_name} onChange={(e) => setF('driver_name', e.target.value)} />
        </FormField>
        <FormField label="Driver Mobile">
          <Input value={form.driver_mobile} onChange={(e) => setF('driver_mobile', e.target.value)} />
        </FormField>
        <FormField label="Destination">
          <Input value={form.destination} onChange={(e) => setF('destination', e.target.value)} />
        </FormField>
        <FormField label="Customer / Party">
          <Input value={form.customer} onChange={(e) => setF('customer', e.target.value)} />
        </FormField>
        <FormField label="Lot Number">
          <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>Post Stock Out</Button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- TRANSFER ---------------- */
export function StockTransfer() {
  const toast = useToast()
  const { user, branchId } = useAuth()
  const { items, branches, units } = useMasters()

  // New Transfer Form State
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    date: today(),
    from_branch_id: branchId || user?.default_branch_id || '',
    to_branch_id: '',
    item_id: '',
    unit_id: '',
    quantity: '',
    vehicle_number: '',
    lot_number: '',
    remarks: '',
  })
  const [saving, setSaving] = useState(false)
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Open lots for the selected From godown (drives the Lot Number dropdown)
  const [lots, setLots] = useState([])
  useEffect(() => {
    let cancelled = false
    if (!form.from_branch_id) {
      setLots([])
      return
    }
    api
      .get(`/lots?per_page=500&status=OPEN&branch_id=${form.from_branch_id}`)
      .then((res) => {
        if (cancelled) return
        setLots(extractList(res.data).filter((l) => Number(l.available_qty) > 0))
      })
      .catch(() => {
        if (!cancelled) setLots([])
      })
    return () => {
      cancelled = true
    }
  }, [form.from_branch_id])
  const visibleLots = lots.filter((l) => !form.item_id || String(l.item_id) === String(form.item_id))
  const selectedTransferLot = lots.find((l) => l.lot_number === form.lot_number)

  // Posted Transfers Table State
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDuration, setActiveDuration] = useState('all')
  const [filters, setFilters] = useState({
    branch_id: '',
    item_id: '',
    date_from: '',
    date_to: '',
    search: '',
  })

  // Export PDF State
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportDuration, setExportDuration] = useState('all')
  const [exportFilters, setExportFilters] = useState({
    branch_id: '',
    item_id: '',
    date_from: '',
    date_to: '',
  })

  // View Details Modal State
  const [viewTransfer, setViewTransfer] = useState(null)
  const openView = async (r) => {
    setViewTransfer(r)
    try {
      const res = await api.get(`/inventory/transfers/${r.id}`)
      if (res.data?.data) {
        setViewTransfer(res.data.data)
      }
    } catch {
      // keep current row data
    }
  }

  // Edit Transfer State
  const [editingTransfer, setEditingTransfer] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    date: today(),
    from_branch_id: '',
    to_branch_id: '',
    item_id: '',
    unit_id: '',
    quantity: '',
    vehicle_number: '',
    lot_number: '',
    remarks: '',
  })
  const setEditF = (k, v) => setEditForm((f) => ({ ...f, [k]: v }))
  const [editLots, setEditLots] = useState([])

  useEffect(() => {
    if (!editModalOpen || !editForm.from_branch_id) {
      setEditLots([])
      return
    }
    let cancelled = false
    api
      .get(`/lots?per_page=500&status=OPEN&branch_id=${editForm.from_branch_id}`)
      .then((res) => {
        if (cancelled) return
        setEditLots(extractList(res.data))
      })
      .catch(() => {
        if (!cancelled) setEditLots([])
      })
    return () => {
      cancelled = true
    }
  }, [editModalOpen, editForm.from_branch_id])

  const openEdit = (r) => {
    setEditingTransfer(r)
    setEditForm({
      date: r.date ? String(r.date).slice(0, 10) : today(),
      from_branch_id: String(r.from_branch_id || ''),
      to_branch_id: String(r.to_branch_id || ''),
      item_id: String(r.item_id || ''),
      unit_id: String(r.unit_id || r.item?.unit_id || ''),
      quantity: r.quantity !== undefined ? String(r.quantity) : '',
      vehicle_number: r.vehicle?.vehicle_number || r.vehicle_number || '',
      lot_number: r.lot_number || '',
      remarks: r.remarks || '',
    })
    setEditModalOpen(true)
  }

  const effectiveEditLotAvail = (lot) => {
    let qty = Number(lot?.available_qty || 0)
    if (
      editingTransfer &&
      lot &&
      String(lot.lot_number) === String(editingTransfer.lot_number) &&
      String(lot.branch_id) === String(editingTransfer.from_branch_id)
    ) {
      qty += Number(editingTransfer.quantity || 0)
    }
    return qty
  }

  async function submitEdit(e) {
    e.preventDefault()
    if (!editForm.from_branch_id || !editForm.to_branch_id) {
      toast.error('Select From and To godowns')
      return
    }
    if (String(editForm.from_branch_id) === String(editForm.to_branch_id)) {
      toast.error('From and To branches must differ')
      return
    }
    if (!Number(editForm.quantity)) {
      toast.error('Enter valid transfer quantity')
      return
    }
    setEditSaving(true)
    try {
      const matchedLot = editLots.find((l) => l.lot_number === editForm.lot_number)
      await api.put(`/inventory/transfers/${editingTransfer.id}`, {
        date: editForm.date,
        source_branch_id: Number(editForm.from_branch_id),
        dest_branch_id: Number(editForm.to_branch_id),
        lot_id: matchedLot ? Number(matchedLot.id) : undefined,
        lot_number: editForm.lot_number || undefined,
        item_id: editForm.item_id ? Number(editForm.item_id) : undefined,
        unit_id: editForm.unit_id ? Number(editForm.unit_id) : undefined,
        quantity: Number(editForm.quantity),
        vehicle_number: editForm.vehicle_number ? editForm.vehicle_number.trim() : undefined,
        remarks: editForm.remarks ? editForm.remarks.trim() : undefined,
      })
      toast.success('Stock transfer updated and inventory reconciled.')
      setEditModalOpen(false)
      setEditingTransfer(null)
      load()
      if (form.from_branch_id) {
        api
          .get(`/lots?per_page=500&status=OPEN&branch_id=${form.from_branch_id}`)
          .then((res) => setLots(extractList(res.data).filter((l) => Number(l.available_qty) > 0)))
          .catch(() => {})
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update transfer'))
    } finally {
      setEditSaving(false)
    }
  }

  // Delete State & Handler
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/inventory/transfers/${deleteTarget.id}`)
      toast.success('Stock transfer moved to trash and inventory restored.')
      setDeleteTarget(null)
      load()
      if (form.from_branch_id) {
        api
          .get(`/lots?per_page=500&status=OPEN&branch_id=${form.from_branch_id}`)
          .then((res) => setLots(extractList(res.data).filter((l) => Number(l.available_qty) > 0)))
          .catch(() => {})
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete transfer'))
    } finally {
      setDeleting(false)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/transfers', {
        params: {
          branch_id: filters.branch_id || branchId || undefined,
          item_id: filters.item_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          search: filters.search || undefined,
          all: 1,
        },
      })
      setRows(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load stock transfers'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [filters, branchId, toast])

  useEffect(() => {
    load()
  }, [load])

  function applyDuration(type) {
    setActiveDuration(type)
    if (type === 'all') {
      setFilters((f) => ({ ...f, date_from: '', date_to: '' }))
      return
    }
    const { from, to } = getDurationDates(type)
    setFilters((f) => ({ ...f, date_from: from, date_to: to }))
  }

  function applyExportDuration(type) {
    setExportDuration(type)
    if (type === 'all') {
      setExportFilters((f) => ({ ...f, date_from: '', date_to: '' }))
      return
    }
    const { from, to } = getDurationDates(type)
    setExportFilters((f) => ({ ...f, date_from: from, date_to: to }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.from_branch_id || !form.to_branch_id) {
      toast.error('Select From and To godowns')
      return
    }
    if (form.from_branch_id === form.to_branch_id) {
      toast.error('From and To branches must differ')
      return
    }
    if (!selectedTransferLot) {
      toast.error('Select the lot to transfer — stock moves lot-to-lot between godowns')
      return
    }
    if (!Number(form.quantity)) {
      toast.error('Enter transfer quantity')
      return
    }
    setSaving(true)
    try {
      await api.post('/inventory/transfer-lot', {
        date: form.date,
        source_branch_id: Number(form.from_branch_id),
        dest_branch_id: Number(form.to_branch_id),
        lot_id: Number(selectedTransferLot.id),
        quantity: Number(form.quantity),
        reference: form.remarks ? form.remarks.trim() : null,
        vehicle_number: form.vehicle_number ? form.vehicle_number.trim() : undefined,
      })
      toast.success('Stock transferred between godowns')
      setForm((f) => ({ ...f, quantity: '', vehicle_number: '', lot_number: '', remarks: '' }))
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Transfer failed'))
    } finally {
      setSaving(false)
    }
  }

  function openExportModal() {
    setExportDuration(activeDuration)
    setExportFilters({
      branch_id: filters.branch_id || '',
      item_id: filters.item_id || '',
      date_from: filters.date_from || '',
      date_to: filters.date_to || '',
    })
    setExportModalOpen(true)
  }

  function handleExportPdf(p) {
    const params = new URLSearchParams({
      ...(p.branch_id && { branch_id: p.branch_id }),
      ...(p.item_id && { item_id: p.item_id }),
      ...(p.date_from && { date_from: p.date_from }),
      ...(p.date_to && { date_to: p.date_to }),
      ...(filters.search && { search: filters.search }),
    })
    const filename = p.date_from && p.date_to
      ? `Stock_Transfers_${p.date_from}_to_${p.date_to}.pdf`
      : p.date_from
      ? `Stock_Transfers_from_${p.date_from}.pdf`
      : `Stock_Transfers_Report.pdf`
    openPdf(`/inventory/transfers/pdf?${params.toString()}`, filename)
  }

  const totalQtyTransferred = rows.reduce((s, r) => s + Number(r.quantity || 0), 0)
  const uniqueItemsCount = new Set(rows.map((r) => r.item_id)).size
  const involvedBranchesCount = new Set([
    ...rows.map((r) => r.from_branch_id),
    ...rows.map((r) => r.to_branch_id),
  ].filter(Boolean)).size

  const columns = [
    {
      key: 'idx',
      label: '#',
      render: (_, idx) => <span className="text-xs text-slate-500 font-semibold">{idx + 1}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (r) => <span className="whitespace-nowrap font-medium text-slate-800">{formatDate(r.date)}</span>,
    },
    {
      key: 'transfer_number',
      label: 'Transfer No',
      render: (r) => <span className="font-bold text-sky-700">{r.transfer_number}</span>,
    },
    {
      key: 'from_branch',
      label: 'From Godown',
      render: (r) => (
        <span className="font-medium text-slate-700">
          {r.from_branch?.name || r.from_branch?.branch_name || `#${r.from_branch_id}`}
        </span>
      ),
    },
    {
      key: 'to_branch',
      label: 'To Godown',
      render: (r) => (
        <span className="font-medium text-slate-700">
          {r.to_branch?.name || r.to_branch?.branch_name || `#${r.to_branch_id}`}
        </span>
      ),
    },
    {
      key: 'item',
      label: 'Item / Product',
      render: (r) => <span className="font-semibold text-slate-900">{r.item?.name || `#${r.item_id}`}</span>,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      align: 'right',
      render: (r) => <span className="font-bold text-blue-700 text-sm">{formatNumber(r.quantity)}</span>,
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (r) => (
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
          {r.unit?.code || r.unit?.name || r.item?.unit?.code || r.item?.unit?.name || '—'}
        </span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (r) => (
        <span className="text-xs text-slate-800 font-medium">
          {r.vehicle?.vehicle_number || r.vehicle?.number || '—'}
        </span>
      ),
    },
    {
      key: 'lot_number',
      label: 'Lot No',
      render: (r) => <span className="text-xs text-slate-600 font-mono">{r.lot_number || '—'}</span>,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (r) => (
        <span className="text-xs text-slate-500 truncate max-w-[150px] block" title={r.remarks}>
          {r.remarks || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status || 'POSTED'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openView(r)}
            title="View Details"
          >
            <Eye className="h-3 w-3" /> View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openEdit(r)}
            className="border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100"
            title="Edit Stock Transfer"
          >
            <Edit2 className="h-3 w-3" /> Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openPdf(`/inventory/transfers/${r.id}/pdf`, `Stock_Transfer_${r.transfer_number || r.id}.pdf`)}
            title="Print Delivery Challan"
          >
            <Printer className="h-3 w-3" /> PDF
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDeleteTarget(r)}
            className="border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100"
            title="Delete Transfer (Soft Delete)"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Stock Transfer"
        subtitle="Inter-godown stock movement and posted transfer logs"
        icon={ArrowRightLeft}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={formOpen ? 'secondary' : 'primary'}
              onClick={() => setFormOpen((o) => !o)}
            >
              {formOpen ? 'Hide Entry Form' : '+ New Transfer'}
            </Button>
            <Button variant="secondary" onClick={openExportModal}>
              <Printer className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="secondary" onClick={load} loading={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Collapsible New Stock Transfer Form */}
      {formOpen && (
        <div className="rounded-xl border border-sky-200 bg-gradient-to-b from-sky-50/50 to-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-sky-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">New Inter-Godown Stock Transfer</h3>
              <p className="text-xs text-slate-500">Post stock transfer from Godown A to Godown B</p>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          <form id="transfer-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <FormField label="Date" required>
              <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
            </FormField>

            <FormField label="Vehicle">
              <Input
                value={form.vehicle_number}
                onChange={(e) => setF('vehicle_number', e.target.value)}
                placeholder="Vehicle number"
              />
            </FormField>

            <FormField label="From Godown" required>
              <Select
                value={form.from_branch_id}
                onChange={(e) => setForm((f) => ({ ...f, from_branch_id: e.target.value, lot_number: '' }))}
                required
              >
                <option value="">Select From Godown…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="To Godown" required>
              <Select value={form.to_branch_id} onChange={(e) => setF('to_branch_id', e.target.value)} required>
                <option value="">Select To Godown…</option>
                {branches.filter((b) => String(b.id) !== String(form.from_branch_id)).map((b) => (
                  <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item / Product" required>
              <Select
                value={form.item_id}
                onChange={(e) => {
                  const itId = e.target.value
                  const selectedItem = items.find((i) => String(i.id) === String(itId))
                  setForm((f) => ({
                    ...f,
                    item_id: itId,
                    unit_id: selectedItem?.unit_id || selectedItem?.unit?.id || f.unit_id || '',
                    lot_number: '',
                  }))
                }}
                required
              >
                <option value="">Select Item…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Unit">
              <Select value={form.unit_id} onChange={(e) => setF('unit_id', e.target.value)}>
                <option value="">Select Unit…</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.code ? `(${u.code})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Quantity" required>
              <Input
                type="number"
                step="0.001"
                min="0"
                max={selectedTransferLot ? selectedTransferLot.available_qty : undefined}
                value={form.quantity}
                onChange={(e) => setF('quantity', e.target.value)}
                placeholder="0.000"
                required
              />
            </FormField>

            <FormField label="Lot Number" required>
              <Select
                value={form.lot_number || ''}
                onChange={(e) => {
                  const lot = lots.find((l) => l.lot_number === e.target.value)
                  setForm((f) => ({
                    ...f,
                    lot_number: e.target.value,
                    item_id: lot ? String(lot.item_id) : f.item_id,
                    unit_id: lot
                      ? String(lot.unit_id || lot.item?.unit_id || lot.item?.unit?.id || f.unit_id || '')
                      : f.unit_id,
                  }))
                }}
              >
                <option value="">Select lot…</option>
                {visibleLots.map((l) => (
                  <option key={l.id} value={l.lot_number}>
                    {l.lot_number} — {l.item?.name || `#${l.item_id}`} (avail {formatNumber(l.available_qty)})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Remarks">
              <Input
                value={form.remarks}
                onChange={(e) => setF('remarks', e.target.value)}
                placeholder="Reference / remarks"
              />
            </FormField>

            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2 pt-1 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Post Transfer
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Transfers</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{rows.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Posted inter-godown records</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 shadow-xs">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Qty Transferred</p>
          <p className="mt-1 text-2xl font-black text-blue-800">{formatNumber(totalQtyTransferred)}</p>
          <p className="text-[11px] text-blue-500 mt-0.5">Cumulative stock moved</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Commodities</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{uniqueItemsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Unique items transferred</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Godowns</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{involvedBranchesCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Origin & destination points</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-3">
        {/* Duration Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Duration:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_fy', label: 'This FY' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyDuration(preset.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                activeDuration === preset.id
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
          {(filters.date_from || filters.date_to || filters.branch_id || filters.item_id || filters.search) && (
            <button
              type="button"
              onClick={() => {
                setActiveDuration('all')
                setFilters({ branch_id: '', item_id: '', date_from: '', date_to: '', search: '' })
              }}
              className="ml-auto text-xs text-rose-600 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Inputs Filter Row */}
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">From Date</label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => {
                setActiveDuration('custom')
                setFilters((f) => ({ ...f, date_from: e.target.value }))
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">To Date</label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => {
                setActiveDuration('custom')
                setFilters((f) => ({ ...f, date_to: e.target.value }))
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Godown</label>
            <Select
              value={filters.branch_id}
              onChange={(e) => setFilters((f) => ({ ...f, branch_id: e.target.value }))}
            >
              <option value="">{branchId ? 'As per godown switch' : 'All Godowns'}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Item / Commodity</label>
            <Select
              value={filters.item_id}
              onChange={(e) => setFilters((f) => ({ ...f, item_id: e.target.value }))}
            >
              <option value="">All Items</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Transfer #, vehicle, lot..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Posted Stock Transfers DataTable */}
      <DataTable
        columns={columns}
        rows={rows}
        data={rows}
        loading={loading}
        emptyMessage="No stock transfers found matching the filter criteria."
        footer={
          rows.length > 0 ? (
            <tr>
              <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-xs font-bold text-slate-700">
                TOTAL TRANSFERS: {rows.length} | TOTAL TRANSFERRED:
              </td>
              <td className="py-2.5 px-3 text-right font-black text-blue-900 bg-blue-100/80 text-sm">
                {formatNumber(totalQtyTransferred)}
              </td>
              <td colSpan={5}></td>
            </tr>
          ) : null
        }
      />

      {/* Export PDF Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Stock Transfers Report (PDF)"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Select the date period, godown, and commodity filters to generate the official printable PDF report.
          </p>

          {/* Modal Duration Presets */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Quick Duration</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'this_fy', label: 'This FY' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyExportDuration(preset.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    exportDuration === preset.id
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">From Date</label>
              <Input
                type="date"
                value={exportFilters.date_from}
                onChange={(e) => {
                  setExportDuration('custom')
                  setExportFilters((f) => ({ ...f, date_from: e.target.value }))
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">To Date</label>
              <Input
                type="date"
                value={exportFilters.date_to}
                onChange={(e) => {
                  setExportDuration('custom')
                  setExportFilters((f) => ({ ...f, date_to: e.target.value }))
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Godown</label>
              <Select
                value={exportFilters.branch_id}
                onChange={(e) => setExportFilters((f) => ({ ...f, branch_id: e.target.value }))}
              >
                <option value="">All Godowns</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Item / Commodity</label>
              <Select
                value={exportFilters.item_id}
                onChange={(e) => setExportFilters((f) => ({ ...f, item_id: e.target.value }))}
              >
                <option value="">All Items</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleExportPdf(exportFilters)
                setExportModalOpen(false)
              }}
            >
              <Printer className="h-4 w-4" />
              Generate PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Transfer Details Modal */}
      <Modal
        open={Boolean(viewTransfer)}
        onClose={() => setViewTransfer(null)}
        title={
          viewTransfer ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Transfer {viewTransfer.transfer_number}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {viewTransfer.status || 'POSTED'}
              </span>
            </div>
          ) : (
            'Transfer Details'
          )
        }
      >
        {viewTransfer && (
          <div className="space-y-4">
            {/* Route Card */}
            <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/50 via-slate-50 to-indigo-50/40 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Inter-Godown Transfer Route
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 rounded-lg bg-white p-2.5 shadow-2xs border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">From (Source)</div>
                  <div className="text-sm font-bold text-slate-800">
                    {viewTransfer.from_branch?.branch_name || viewTransfer.from_branch?.name || `#${viewTransfer.from_branch_id}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Code: {viewTransfer.from_branch?.branch_code || '—'}{' '}
                    {viewTransfer.from_branch?.city ? `• ${viewTransfer.from_branch?.city}` : ''}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center text-sky-600 px-1">
                  <ArrowRightLeft className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">Move</span>
                </div>

                <div className="flex-1 rounded-lg bg-white p-2.5 shadow-2xs border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">To (Destination)</div>
                  <div className="text-sm font-bold text-slate-800">
                    {viewTransfer.to_branch?.branch_name || viewTransfer.to_branch?.name || `#${viewTransfer.to_branch_id}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Code: {viewTransfer.to_branch?.branch_code || '—'}{' '}
                    {viewTransfer.to_branch?.city ? `• ${viewTransfer.to_branch?.city}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Item & Lot Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">Date</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{formatDate(viewTransfer.date)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">Lot Number</div>
                <div className="mt-1 text-xs font-mono font-bold text-slate-800">{viewTransfer.lot_number || '—'}</div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 sm:col-span-2">
                <div className="text-[10px] font-bold uppercase text-blue-600">Transferred Quantity</div>
                <div className="mt-1 text-lg font-black text-blue-900">
                  {formatNumber(viewTransfer.quantity)}{' '}
                  <span className="text-xs font-semibold text-blue-700">
                    {viewTransfer.unit?.code || viewTransfer.unit?.symbol || viewTransfer.item?.unit?.code || 'KG'}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-slate-400">Product / Commodity</div>
              <div className="text-sm font-bold text-slate-900">{viewTransfer.item?.name || `#${viewTransfer.item_id}`}</div>
              {viewTransfer.item?.code && (
                <div className="text-xs text-slate-500">Item Code: {viewTransfer.item.code}</div>
              )}
            </div>

            {/* Transport & Metadata */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle Number</span>
                  <span className="font-semibold text-slate-800">
                    {viewTransfer.vehicle?.vehicle_number || viewTransfer.vehicle_number || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Driver Name / Mobile</span>
                  <span className="font-semibold text-slate-800">
                    {viewTransfer.driver_name || '—'} {viewTransfer.driver_mobile ? `(${viewTransfer.driver_mobile})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Posted By</span>
                  <span className="text-slate-700">{viewTransfer.creator?.name || 'System / Admin'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Created At</span>
                  <span className="text-slate-700">{formatDate(viewTransfer.created_at)}</span>
                </div>
              </div>
              {viewTransfer.remarks && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Remarks / Reference</span>
                  <p className="mt-0.5 text-slate-700 italic">{viewTransfer.remarks}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  onClick={() => {
                    const t = viewTransfer
                    setViewTransfer(null)
                    setDeleteTarget(t)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  onClick={() => {
                    const t = viewTransfer
                    setViewTransfer(null)
                    openEdit(t)
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    openPdf(
                      `/inventory/transfers/${viewTransfer.id}/pdf`,
                      `Stock_Transfer_${viewTransfer.transfer_number || viewTransfer.id}.pdf`
                    )
                  }
                >
                  <Printer className="h-3.5 w-3.5" /> Print Transfer Note
                </Button>
                <Button size="sm" onClick={() => setViewTransfer(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Stock Transfer Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingTransfer(null)
        }}
        title={`Edit Stock Transfer ${editingTransfer?.transfer_number || ''}`}
      >
        {editingTransfer && (
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-2.5 text-xs text-amber-900">
              <p className="font-semibold">Inventory Reconciliation on Edit:</p>
              <p className="text-amber-700 mt-0.5">
                Saving changes will dynamically revert the previous transfer on both godowns and post updated movements without creating orphaned stock.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <FormField label="Date" required>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditF('date', e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Vehicle Number">
                <Input
                  value={editForm.vehicle_number}
                  onChange={(e) => setEditF('vehicle_number', e.target.value)}
                  placeholder="e.g. TN-38-AA-1234"
                />
              </FormField>

              <FormField label="From Godown" required>
                <Select
                  value={editForm.from_branch_id}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, from_branch_id: e.target.value, lot_number: '' }))
                  }
                  required
                >
                  <option value="">Select From Godown…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.branch_name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="To Godown" required>
                <Select
                  value={editForm.to_branch_id}
                  onChange={(e) => setEditF('to_branch_id', e.target.value)}
                  required
                >
                  <option value="">Select To Godown…</option>
                  {branches
                    .filter((b) => String(b.id) !== String(editForm.from_branch_id))
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || b.branch_name}
                      </option>
                    ))}
                </Select>
              </FormField>

              <FormField label="Item / Product" required>
                <Select
                  value={editForm.item_id}
                  onChange={(e) => {
                    const itId = e.target.value
                    const selectedItem = items.find((i) => String(i.id) === String(itId))
                    setEditForm((f) => ({
                      ...f,
                      item_id: itId,
                      unit_id: selectedItem?.unit_id || selectedItem?.unit?.id || f.unit_id || '',
                      lot_number: '',
                    }))
                  }}
                  required
                >
                  <option value="">Select Item…</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Unit">
                <Select value={editForm.unit_id} onChange={(e) => setEditF('unit_id', e.target.value)}>
                  <option value="">Select Unit…</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.code ? `(${u.code})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Lot Number" required>
                <Select
                  value={editForm.lot_number || ''}
                  onChange={(e) => {
                    const lot = editLots.find((l) => l.lot_number === e.target.value)
                    setEditForm((f) => ({
                      ...f,
                      lot_number: e.target.value,
                      item_id: lot ? String(lot.item_id) : f.item_id,
                      unit_id: lot
                        ? String(lot.unit_id || lot.item?.unit_id || lot.item?.unit?.id || f.unit_id || '')
                        : f.unit_id,
                    }))
                  }}
                  required
                >
                  <option value="">Select lot…</option>
                  {editingTransfer.lot_number &&
                    !editLots.some((l) => l.lot_number === editingTransfer.lot_number) && (
                      <option value={editingTransfer.lot_number}>
                        {editingTransfer.lot_number} (Current Lot — Transfer Qty:{' '}
                        {formatNumber(editingTransfer.quantity)})
                      </option>
                    )}
                  {editLots
                    .filter((l) => !editForm.item_id || String(l.item_id) === String(editForm.item_id))
                    .map((l) => {
                      const effAvail = effectiveEditLotAvail(l)
                      return (
                        <option key={l.id} value={l.lot_number}>
                          {l.lot_number} — {l.item?.name || `#${l.item_id}`} (avail{' '}
                          {formatNumber(effAvail)})
                        </option>
                      )
                    })}
                </Select>
              </FormField>

              <FormField label="Quantity" required>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={editForm.quantity}
                  onChange={(e) => setEditF('quantity', e.target.value)}
                  placeholder="0.000"
                  required
                />
              </FormField>

              <FormField label="Remarks" className="sm:col-span-2 md:col-span-1">
                <Input
                  value={editForm.remarks}
                  onChange={(e) => setEditF('remarks', e.target.value)}
                  placeholder="Reference / remarks"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditModalOpen(false)
                  setEditingTransfer(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={editSaving}>
                Save & Reconcile Stock
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Stock Transfer"
        message={`Are you sure you want to move stock transfer "${deleteTarget?.transfer_number}" to trash? The transferred quantity (${formatNumber(deleteTarget?.quantity)}) will be returned back to the source godown/lot and deducted from the destination godown/lot.`}
        confirmText="Yes, Move to Trash"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function getDurationDates(type) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const pad = (n) => String(n).padStart(2, '0')

  if (type === 'today') {
    const todayStr = `${y}-${pad(m + 1)}-${pad(d)}`
    return { from: todayStr, to: todayStr }
  }
  if (type === 'this_month') {
    const from = `${y}-${pad(m + 1)}-01`
    const to = `${y}-${pad(m + 1)}-${pad(d)}`
    return { from, to }
  }
  if (type === 'last_month') {
    const lastMonthDate = new Date(y, m - 1, 1)
    const ly = lastMonthDate.getFullYear()
    const lm = lastMonthDate.getMonth()
    const lastDay = new Date(ly, lm + 1, 0).getDate()
    return {
      from: `${ly}-${pad(lm + 1)}-01`,
      to: `${ly}-${pad(lm + 1)}-${pad(lastDay)}`,
    }
  }
  if (type === 'this_fy') {
    const fyStartYear = m >= 3 ? y : y - 1
    return {
      from: `${fyStartYear}-04-01`,
      to: `${y}-${pad(m + 1)}-${pad(d)}`,
    }
  }
  return { from: '', to: '' }
}

/* ---------------- LEDGER ---------------- */
export function StockLedger() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { items, branches } = useMasters()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ item_id: '', branch_id: '', date_from: '', date_to: '', lot_number: '' })
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportFilters, setExportFilters] = useState({
    branch_id: '',
    item_id: '',
    date_from: '',
    date_to: '',
    lot_number: '',
  })
  const [lotList, setLotList] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/ledger', {
        params: {
          branch_id: filters.branch_id || branchId || undefined,
          item_id: filters.item_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          lot_number: filters.lot_number || undefined,
        },
      })
      setRows(res.data.data || res.data || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load ledger'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [branchId, filters, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let alive = true
    api.get('/lots?per_page=500')
      .then((res) => {
        if (!alive) return
        const data = res.data?.data || res.data || []
        setLotList([...new Set(data.map((l) => l.lot_number).filter(Boolean))].sort())
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  function openExportModal() {
    setExportFilters({
      branch_id: filters.branch_id || branchId || '',
      item_id: filters.item_id || '',
      date_from: filters.date_from || '',
      date_to: filters.date_to || '',
      lot_number: filters.lot_number || '',
    })
    setExportModalOpen(true)
  }

  function handleExportPdf(p) {
    const params = new URLSearchParams({
      ...(p.branch_id && { branch_id: p.branch_id }),
      ...(p.item_id && { item_id: p.item_id }),
      ...(p.date_from && { date_from: p.date_from }),
      ...(p.date_to && { date_to: p.date_to }),
      ...(p.lot_number && { lot_number: p.lot_number }),
    })
    const filename = p.date_from && p.date_to
      ? `Stock_Ledger_${p.date_from}_to_${p.date_to}.pdf`
      : p.date_from
      ? `Stock_Ledger_from_${p.date_from}.pdf`
      : `Stock_Ledger.pdf`
    openPdf(`/inventory/ledger/pdf?${params.toString()}`, filename)
  }

  const ledgerTotIn = rows.reduce((s, r) => s + Number(r.in ?? r.stock_in ?? 0), 0)
  const ledgerTotOut = rows.reduce((s, r) => s + Number(r.out ?? r.stock_out ?? 0), 0)
  const latestByKey = {}
  rows.forEach((r) => {
    const k = `${r.branch_id || ''}_${r.item_id || r.item || ''}`
    latestByKey[k] = Number(r.closing_balance ?? 0)
  })
  const ledgerTotClosing = Object.values(latestByKey).reduce((s, v) => s + v, 0)
  const ledgerInEntries = rows.filter((r) => Number(r.in ?? r.stock_in ?? 0) > 0).length
  const ledgerOutEntries = rows.filter((r) => Number(r.out ?? r.stock_out ?? 0) > 0).length
  const ledgerActiveStreams = Object.keys(latestByKey).length
  const ledgerPeriodLabel = filters.date_from || filters.date_to ? 'Filtered period' : 'All time'
  const lotOptions = [...new Set([...lotList, ...rows.map((r) => r.lot).filter((v) => v && v !== '—')])].sort()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Ledger"
        subtitle="Traceable movements with opening/closing"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={load}>Refresh</Button>
            <Button
              variant="secondary"
              onClick={openExportModal}
              className="border-[#C9A227]/50 text-[#0b3558] font-bold hover:bg-amber-50"
            >
              <Printer className="h-4 w-4 text-[#C9A227]" /> Export PDF
            </Button>
          </div>
        }
      />

      {/* KPI Mini-Metrics Ribbon for Stock Ledger — Settlement Dashboard stat-card style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Stock In */}
        <div className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between border border-violet-200/70">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-500 flex items-center gap-1.5">
                Total Stock In
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-violet-400" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shrink-0 border border-violet-200/70">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{formatNumber(ledgerTotIn)}</span>
              <span className="text-xs font-medium text-slate-500">received</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="inline-flex items-center rounded-md bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 truncate max-w-full">
              {ledgerInEntries} entries
            </span>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-violet-600 transition-colors">
              {ledgerPeriodLabel}
            </span>
          </div>
        </div>

        {/* Card 2: Total Stock Out */}
        <div className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between border border-rose-200/70">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                Total Stock Out
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-rose-400" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0 border border-rose-200/70">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{formatNumber(ledgerTotOut)}</span>
              <span className="text-xs font-medium text-slate-500">dispatched</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 truncate max-w-full">
              {ledgerOutEntries} entries
            </span>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-rose-600 transition-colors">
              {ledgerPeriodLabel}
            </span>
          </div>
        </div>

        {/* Card 3: Net Closing Total */}
        <div className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between border border-lime-300/80">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-lime-600 flex items-center gap-1.5">
                Net Closing Total
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-lime-500" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-100 text-lime-700 shrink-0 border border-lime-200/80">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-900">{formatNumber(ledgerTotClosing)}</span>
              <span className="text-xs font-medium text-slate-500">balance</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="inline-flex items-center rounded-md bg-lime-100 px-2.5 py-1 text-[11px] font-bold text-lime-800 truncate max-w-full">
              {ledgerActiveStreams} active
            </span>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-lime-600 transition-colors">
              Latest closing
            </span>
          </div>
        </div>
      </div>

      {/* Duration Presets Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-[#C9A227]" /> Duration:
          </span>
          {[
            { label: 'All Dates', key: 'all' },
            { label: 'Today', key: 'today' },
            { label: 'This Month', key: 'this_month' },
            { label: 'Last Month', key: 'last_month' },
            { label: 'This FY (Apr-Mar)', key: 'this_fy' },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                const dates = getDurationDates(p.key)
                setFilters((f) => ({ ...f, date_from: dates.from, date_to: dates.to }))
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-[#C9A227] hover:bg-amber-50 transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
        {Boolean(filters.date_from || filters.date_to) && (
          <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {filters.date_from ? formatDate(filters.date_from) : 'Start'} → {filters.date_to ? formatDate(filters.date_to) : 'Present'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Godown</label>
          <Select value={filters.branch_id} onChange={(e) => setFilters((f) => ({ ...f, branch_id: e.target.value }))}>
            <option value="">All godowns</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Item</label>
          <Select value={filters.item_id} onChange={(e) => setFilters((f) => ({ ...f, item_id: e.target.value }))}>
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Lot</label>
          <Select value={filters.lot_number} onChange={(e) => setFilters((f) => ({ ...f, lot_number: e.target.value }))}>
            <option value="">All lots</option>
            {lotOptions.map((ln) => (
              <option key={ln} value={ln}>{ln}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Duration From</label>
          <Input type="date" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Duration To</label>
          <Input type="date" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
        </div>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        emptyTitle="No ledger entries"
        columns={[
          {
            key: 'date',
            label: 'Date',
            render: (r) => (
              <span className="font-bold text-slate-900 text-xs">
                {formatDate(r.date)}
              </span>
            ),
          },
          {
            key: 'lot',
            label: 'Lot',
            render: (r) => (
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {r.lot || '—'}
              </span>
            ),
          },
          {
            key: 'party',
            label: 'Party',
            render: (r) => (
              <span className="font-bold text-slate-900 text-xs">
                {r.party || r.vendor_customer || '—'}
              </span>
            ),
          },
          {
            key: 'item',
            label: 'Item',
            render: (r) => (
              <span className="font-extrabold text-slate-900 text-xs">
                {r.item || '—'}
              </span>
            ),
          },
          {
            key: 'type',
            label: 'Type',
            render: (r) => {
              const t = String(r.type || '')
              const labelMap = {
                STOCK_IN: 'STOCK IN',
                STOCK_OUT: 'STOCK OUT',
                TRANSFER_IN: 'TRANSFER IN',
                TRANSFER_OUT: 'TRANSFER OUT',
                MIXING_IN: 'MIXING IN',
                MIXING_OUT: 'MIXING OUT',
                ADJUSTMENT_IN: 'ADJUSTMENT IN',
                ADJUSTMENT_OUT: 'ADJUSTMENT OUT',
                OPENING: 'OPENING',
              }
              const isIn = ['STOCK_IN', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'OPENING', 'MIXING_IN', 'PRODUCTION_OUT'].includes(t)
                || Number(r.in ?? r.stock_in ?? 0) > 0
              let tone
              if (t.startsWith('TRANSFER')) tone = 'bg-sky-50 text-sky-700 border border-sky-200'
              else if (t.startsWith('MIXING') || t.startsWith('PRODUCTION')) tone = 'bg-violet-50 text-violet-700 border border-violet-200'
              else tone = isIn
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
              const typeLabel = labelMap[t] || (isIn ? 'STOCK IN' : 'STOCK OUT')
              return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${tone}`}>
                  {typeLabel}
                </span>
              )
            },
          },
          {
            key: 'in',
            label: 'In',
            align: 'right',
            render: (r) => {
              const val = Number(r.in ?? r.stock_in ?? 0)
              return (
                <span className={`font-bold text-xs ${val > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {val > 0 ? formatNumber(val) : '—'}
                </span>
              )
            },
          },
          {
            key: 'out',
            label: 'Out',
            align: 'right',
            render: (r) => {
              const val = Number(r.out ?? r.stock_out ?? 0)
              return (
                <span className={`font-bold text-xs ${val > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {val > 0 ? formatNumber(val) : '—'}
                </span>
              )
            },
          },
          {
            key: 'closing_balance',
            label: 'Closing',
            align: 'right',
            render: (r) => {
              const val = Number(r.closing_balance ?? 0)
              return (
                <span className="font-black text-xs text-[#0b3558]">
                  {formatNumber(val)}
                </span>
              )
            },
          },
        ]}
        footer={
          rows.length > 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right text-xs font-black text-slate-700 uppercase">
                TOTAL / NET CLOSING:
              </td>
              <td className="px-4 py-3 text-right text-xs font-black text-emerald-700">
                {formatNumber(ledgerTotIn)}
              </td>
              <td className="px-4 py-3 text-right text-xs font-black text-rose-700">
                {formatNumber(ledgerTotOut)}
              </td>
              <td className="px-4 py-3 text-right text-xs font-black text-[#0b3558] bg-blue-50/70">
                {formatNumber(ledgerTotClosing)}
              </td>
            </tr>
          ) : null
        }
      />

      {/* Export PDF with Duration Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Stock Ledger PDF with Duration"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleExportPdf(exportFilters)
                setExportModalOpen(false)
              }}
              className="bg-[#0b3558] text-white hover:bg-[#07233b]"
            >
              <Printer className="h-4 w-4 mr-1.5 text-[#C9A227]" /> Download / Print PDF
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Quick Duration Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Today', key: 'today' },
                { label: 'This Month', key: 'this_month' },
                { label: 'Last Month', key: 'last_month' },
                { label: 'This FY (Apr-Mar)', key: 'this_fy' },
                { label: 'All History', key: 'all' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    const dates = getDurationDates(p.key)
                    setExportFilters((f) => ({ ...f, date_from: dates.from, date_to: dates.to }))
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#0b3558] hover:text-white transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Duration From">
              <Input
                type="date"
                value={exportFilters.date_from}
                onChange={(e) => setExportFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
            </FormField>
            <FormField label="Duration To">
              <Input
                type="date"
                value={exportFilters.date_to}
                onChange={(e) => setExportFilters((f) => ({ ...f, date_to: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Godown / Branch">
              <Select
                value={exportFilters.branch_id}
                onChange={(e) => setExportFilters((f) => ({ ...f, branch_id: e.target.value }))}
              >
                <option value="">All Godowns</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Item / Commodity">
              <Select
                value={exportFilters.item_id}
                onChange={(e) => setExportFilters((f) => ({ ...f, item_id: e.target.value }))}
              >
                <option value="">All Items</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Lot">
              <Select
                value={exportFilters.lot_number}
                onChange={(e) => setExportFilters((f) => ({ ...f, lot_number: e.target.value }))}
              >
                <option value="">All Lots</option>
                {lotOptions.map((ln) => (
                  <option key={ln} value={ln}>{ln}</option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ---------------- MAIN INVENTORY PAGE WITH TABS ---------------- */
export default function Inventory() {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'gold-dashboard'

  return (
    <div className="space-y-4">
      {/* Active Tab View Render */}
      <div>
        {activeTab === 'gold-dashboard' && <PartyStockDashboard />}
        {activeTab === 'current-stock' && <CurrentStock />}
        {activeTab === 'stock-in' && <StockIn />}
        {activeTab === 'stock-out' && <StockOut />}
        {activeTab === 'transfer' && <StockTransfer />}
        {activeTab === 'ledger' && <StockLedger />}
      </div>
    </div>
  )
}
