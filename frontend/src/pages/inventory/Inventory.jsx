import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  DataTable,
  Input,
  PageHeader,
  Select,
  StatusBadge,
} from '../../components'
import { formatNumber, today } from '../../utils/helpers'

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
import {
  Package,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Scale,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Boxes,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  BookOpen,
  Eye,
  X,
  MapPin,
  Truck,
  ArrowRight,
  FileText,
  Filter,
  ArrowDownUp,
  CheckCircle2,
} from 'lucide-react'

function useMasters() {
  const [vendors, setVendors] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])

  useEffect(() => {
    const list = (d) => (Array.isArray(d) ? d : d.data?.data || d.data || [])
    Promise.all([
      api.get('/vendors?per_page=100').catch(() => ({ data: [] })),
      api.get('/vehicles?per_page=100').catch(() => ({ data: [] })),
      api.get('/items?per_page=100').catch(() => ({ data: [] })),
      api.get('/products?all=1').catch(() => ({ data: [] })),
      api.get('/branches?per_page=100').catch(() => ({ data: [] })),
    ]).then(([v, veh, it, pr, br]) => {
      setVendors(list(v.data))
      setVehicles(list(veh.data))
      const rawItems = list(it.data)
      const rawProducts = list(pr.data).map((p) => ({
        id: p.id,
        name: p.product_name || p.name,
        code: p.product_code || p.code,
        unit: p.unit,
      }))
      const combined = [...rawItems, ...rawProducts]
      const unique = Array.from(new Map(combined.map((i) => [i.id || i.name, i])).values())
      setItems(unique)
      setBranches(list(br.data))
    })
  }, [])

  return { vendors, vehicles, items, branches }
}

/* ---------------- GOLD PARTY INVENTORY DASHBOARD ---------------- */
export function PartyStockDashboard() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { branches, vendors: masterVendors } = useMasters()
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
  const [filterParty, setFilterParty] = useState('')
  const [selectedMovementParty, setSelectedMovementParty] = useState(null)
  const [viewMode, setViewMode] = useState('godown') // 'godown' | 'table' | 'movements'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/party-summary', {
        params: { branch_id: filterGodown || branchId || undefined, vendor_id: filterParty || undefined },
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
  }, [branchId, filterGodown, filterParty, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter parties by search
  const filteredParties = (summaryData.parties || []).filter((p) => {
    const matchesSearch =
      !search ||
      (p.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.vendor_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.branch_name || '').toLowerCase().includes(search.toLowerCase())
    const matchesGodown = !filterGodown || String(p.branch_id) === String(filterGodown)
    const matchesParty = !filterParty || String(p.vendor_id) === String(filterParty)
    return matchesSearch && matchesGodown && matchesParty
  })

  // Filter godowns
  const filteredGodowns = (summaryData.godowns || []).filter((g) => {
    if (filterGodown && String(g.branch_id) !== String(filterGodown)) return false
    if (!filterParty) return true
    return (g.vendors || []).some((v) => String(v.vendor_id) === String(filterParty))
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
                  Godown & Vendor Inventory Dashboard
                </h1>
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.2 text-[9px] font-bold text-amber-900">
                  LIVE CONSOLIDATED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Godown-Wise Vendors • Import (Inlet) & Export (Outlet) Counts • Remaining Holding Balance & Movement Flow
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

        {/* Compact Metric Summary Cards */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3">
            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
              <span>Total Import (Stock In)</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-emerald-950">
                {formatNumber(summaryData.summary.total_inlet_mt || 0)}
              </span>
              <span className="text-[10px] font-bold text-emerald-700">MT</span>
            </div>
            <p className="text-[10px] text-emerald-700/80 font-medium mt-0.5">
              {formatNumber(summaryData.summary.total_inlet_bags || 0)} Bags Imported
            </p>
          </div>

          <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3">
            <div className="flex items-center justify-between text-[11px] text-rose-800 font-semibold">
              <span>Total Export (Stock Out)</span>
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-rose-950">
                {formatNumber(summaryData.summary.total_outlet_mt || 0)}
              </span>
              <span className="text-[10px] font-bold text-rose-700">MT</span>
            </div>
            <p className="text-[10px] text-rose-700/80 font-medium mt-0.5">
              {formatNumber(summaryData.summary.total_outlet_bags || 0)} Bags Exported
            </p>
          </div>

          <div className="rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-100/60 to-amber-50/40 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold">
              <span>Remaining Stock Balance</span>
              <Layers className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-amber-950">
                {formatNumber(summaryData.summary.net_holding_mt || 0)}
              </span>
              <span className="text-[10px] font-bold text-amber-800">MT</span>
            </div>
            <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
              {formatNumber(summaryData.summary.net_holding_bags || 0)} Bags Remaining
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
              <span>Godowns & Vendors</span>
              <Users className="h-3.5 w-3.5 text-[#C9A227]" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <div>
                <span className="text-lg font-extrabold text-[#0B1A2D]">{summaryData.summary.active_godowns || 0}</span>
                <span className="text-[9px] font-bold text-slate-500 ml-0.5">Godowns</span>
              </div>
              <span className="text-slate-300">•</span>
              <div>
                <span className="text-lg font-extrabold text-[#0B1A2D]">{summaryData.summary.active_parties || 0}</span>
                <span className="text-[9px] font-bold text-slate-500 ml-0.5">Vendors</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active Stock Accounts</p>
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
              <Users className="h-3.5 w-3.5 text-[#C9A227]" />
              <label className="text-xs font-semibold text-slate-700">Vendor:</label>
              <select
                value={filterParty}
                onChange={(e) => setFilterParty(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-[#0B1A2D] focus:border-[#C9A227] focus:bg-white focus:outline-none"
              >
                <option value="">All Vendors ({masterVendors.length})</option>
                {masterVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name || v.name || v.business_name} ({v.vendor_code || v.code || `V-${v.id}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[180px]">
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
                        Import (Inlet), Export (Outlet), Balance & Stock Flow Destination
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
                              <th className="px-3 py-2.5 text-right">Import (Stock In)</th>
                              <th className="px-3 py-2.5 text-right">Export (Stock Out)</th>
                              <th className="px-3 py-2.5 text-right">Remaining Stock</th>
                              <th className="px-3 py-2.5">Source & Destination Flow</th>
                              <th className="px-3 py-2.5 text-center rounded-r-lg">Action</th>
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
                                <td className="px-3 py-3">
                                  <div className="space-y-1 text-[11px]">
                                    <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                                      <span className="font-black text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">FROM</span>
                                      <span className="truncate max-w-[140px]">{v.vendor_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-rose-800 font-semibold">
                                      <span className="font-black text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded">TO</span>
                                      <span className="truncate max-w-[140px]">
                                        {v.movements && v.movements.find((m) => m.type === 'EXPORT_OUTLET')?.destination || 'Godown Holding / Dispatch'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => setSelectedMovementParty(v)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-amber-400/80 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-400 hover:text-white transition-all shadow-2xs"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Movements
                                  </button>
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
                Consolidated Stock In (Import) vs Stock Out (Export) and Holding Balance across all Godowns
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
                    <th className="px-4 py-3 text-right">Import (Stock In)</th>
                    <th className="px-4 py-3 text-right">Export (Stock Out)</th>
                    <th className="px-4 py-3 text-right">Remaining Stock</th>
                    <th className="px-4 py-3 text-center rounded-tr-xl">Movement Flow</th>
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
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedMovementParty(row)}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-400/80 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-400 hover:text-white transition-all shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Movement Trace
                        </button>
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

            {/* Modal Summary KPI Ribbon */}
            <div className="grid grid-cols-3 gap-3 bg-amber-50 p-4 border-b border-amber-200">
              <div className="rounded-xl border border-emerald-300 bg-white p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Total Import (Inlet)</span>
                <div className="text-lg font-black text-emerald-700">{formatNumber(selectedMovementParty.inlet_mt)} MT</div>
                <div className="text-[10px] text-emerald-600 font-semibold">{selectedMovementParty.inlet_bags} Bags</div>
              </div>
              <div className="rounded-xl border border-rose-300 bg-white p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">Total Export (Outlet)</span>
                <div className="text-lg font-black text-rose-700">{formatNumber(selectedMovementParty.outlet_mt)} MT</div>
                <div className="text-[10px] text-rose-600 font-semibold">{selectedMovementParty.outlet_bags} Bags</div>
              </div>
              <div className="rounded-xl border border-amber-400 bg-gradient-to-br from-amber-100 to-amber-50 p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">Remaining Balance</span>
                <div className="text-lg font-black text-amber-950">{formatNumber(selectedMovementParty.holding_mt)} MT</div>
                <div className="text-[10px] text-amber-800 font-bold">{selectedMovementParty.holding_bags} Bags</div>
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/stock', {
        params: { branch_id: selBranch || branchId || undefined },
      })
      let data = Array.isArray(res.data) ? res.data : res.data.data || []
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
  }, [branchId, selBranch, selItem, search, toast])

  useEffect(() => {
    load()
  }, [load])

  const totalItemsCount = rows.length
  const availableCount = rows.filter((r) => (r.available || 0) > 0).length
  const outOfStockCount = rows.filter((r) => (r.available || 0) <= 0).length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Current Stock"
        subtitle="Available inventory quantity by commodity & godown"
        icon={Boxes}
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#C9A227] hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#C9A227] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stock</span>
          </button>
        }
      />

      {/* KPI Mini-Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#071426]">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Commodities</span>
            <div className="text-base font-black text-slate-900">{totalItemsCount} <span className="text-xs font-semibold text-slate-500">Items Listed</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">In Stock Available</span>
            <div className="text-base font-black text-emerald-950">{availableCount} <span className="text-xs font-semibold text-emerald-700">Ready for Dispatch</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Zero Stock Level</span>
            <div className="text-base font-black text-rose-950">{outOfStockCount} <span className="text-xs font-semibold text-rose-700">Out of Stock</span></div>
          </div>
        </div>
      </div>

      {/* Filters Row in 1 Line */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search item name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div>
          <Select value={selBranch} onChange={(e) => setSelBranch(e.target.value)}>
            <option value="">Branch (default)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Select value={selItem} onChange={(e) => setSelItem(e.target.value)}>
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
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
            key: 'item_code',
            label: 'Code',
            render: (r) => (
              <span className="font-mono text-[11px] font-bold text-[#071426] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {r.item_code}
              </span>
            ),
          },
          {
            key: 'item_name',
            label: 'Item',
            render: (r) => <span className="font-extrabold text-slate-900">{r.item_name}</span>,
          },
          {
            key: 'unit',
            label: 'Unit',
            render: (r) => (
              <span className="text-[10px] font-bold uppercase text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {r.unit}
              </span>
            ),
          },
          { key: 'opening', label: 'Opening', align: 'right', render: (r) => formatNumber(r.opening ?? 0) },
          { key: 'total_in', label: 'In', align: 'right', render: (r) => <span className="text-emerald-700 font-bold">{formatNumber(r.total_in ?? 0)}</span> },
          { key: 'total_out', label: 'Out', align: 'right', render: (r) => <span className="text-rose-700 font-bold">{formatNumber(r.total_out ?? 0)}</span> },
          { key: 'available', label: 'Available', align: 'right', render: (r) => <span className="text-emerald-950 font-black text-sm">{formatNumber(r.available ?? 0)}</span> },
          { key: 'min_stock_level', label: 'Min', align: 'right', render: (r) => formatNumber(r.min_stock_level ?? 0) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
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
  const { vehicles, items, branches } = useMasters()
  const [form, setForm] = useState({
    date: today(),
    from_branch_id: branchId || user?.default_branch_id || '',
    to_branch_id: '',
    item_id: '',
    quantity: '',
    vehicle_id: '',
    driver_name: '',
    driver_mobile: '',
    lot_number: '',
    remarks: '',
  })
  const [saving, setSaving] = useState(false)
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (form.from_branch_id === form.to_branch_id) {
      toast.error('From and To branches must differ')
      return
    }
    setSaving(true)
    try {
      await api.post('/inventory/transfer', {
        ...form,
        from_branch_id: Number(form.from_branch_id),
        to_branch_id: Number(form.to_branch_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
      })
      toast.success('Transfer posted')
      setForm((f) => ({ ...f, quantity: '', remarks: '' }))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Transfer failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Stock Transfer" subtitle="Godown A → Godown B" />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
        </FormField>
        <FormField label="Vehicle">
          <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
            <option value="">Select…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.number}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="From Godown" required>
          <Select value={form.from_branch_id} onChange={(e) => setF('from_branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="To Godown" required>
          <Select value={form.to_branch_id} onChange={(e) => setF('to_branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.filter((b) => String(b.id) !== String(form.from_branch_id)).map((b) => (
              <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Item / Product" required>
          <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)} required>
            <option value="">Select…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity" required>
          <Input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} required />
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
        <FormField label="Remarks">
          <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>Post Transfer</Button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- LEDGER ---------------- */
export function StockLedger() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { items, branches } = useMasters()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ item_id: '', branch_id: '', date_from: '', date_to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/ledger', {
        params: {
          branch_id: filters.branch_id || branchId || undefined,
          item_id: filters.item_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
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

  return (
    <div>
      <PageHeader
        title="Stock Ledger"
        subtitle="Traceable movements with opening/closing"
        actions={<Button variant="secondary" onClick={load}>Refresh</Button>}
      />
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <Select value={filters.branch_id} onChange={(e) => setFilters((f) => ({ ...f, branch_id: e.target.value }))}>
            <option value="">All godowns</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Select value={filters.item_id} onChange={(e) => setFilters((f) => ({ ...f, item_id: e.target.value }))}>
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Input type="date" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
        </div>
        <div>
          <Input type="date" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
        </div>
      </div>
      <DataTable
        loading={loading}
        rows={rows}
        emptyTitle="No ledger entries"
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'transaction_number', label: 'Txn #' },
          { key: 'branch', label: 'Godown' },
          { key: 'item', label: 'Item' },
          { key: 'type', label: 'Type' },
          { key: 'opening_balance', label: 'Opening', align: 'right', render: (r) => formatNumber(r.opening_balance) },
          { key: 'stock_in', label: 'In', align: 'right', render: (r) => formatNumber(r.stock_in) },
          { key: 'stock_out', label: 'Out', align: 'right', render: (r) => formatNumber(r.stock_out) },
          { key: 'transfer_in', label: 'T.In', align: 'right', render: (r) => formatNumber(r.transfer_in) },
          { key: 'transfer_out', label: 'T.Out', align: 'right', render: (r) => formatNumber(r.transfer_out) },
          { key: 'adjustment', label: 'Adj', align: 'right', render: (r) => formatNumber(r.adjustment) },
          { key: 'closing_balance', label: 'Closing', align: 'right', render: (r) => formatNumber(r.closing_balance) },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'lot', label: 'Lot' },
        ]}
      />
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
