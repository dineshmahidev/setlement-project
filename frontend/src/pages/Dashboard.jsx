import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  Users2,
  Building2,
  Scale,
  DollarSign,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  Plus,
  Receipt,
  FileSpreadsheet,
  Package,
} from 'lucide-react'
import { PageSpinner, StatusBadge } from '../components'

import { today, monthStart, formatDate, formatMoney } from '../utils/helpers'

export default function Dashboard() {
  const { branchId } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState(() => monthStart())
  const [toDate, setToDate] = useState(() => today())
  const [invKpis, setInvKpis] = useState(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/dashboard', {
        params: {
          from_date: fromDate,
          to_date: toDate,
          branch_id: branchId || undefined,
        },
      })
      setData(res.data.data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryKpis = async () => {
    try {
      const res = await api.get('/inventory/dashboard-kpis', {
        params: { branch_id: branchId || undefined, from_date: fromDate, to_date: toDate },
      })
      setInvKpis(res.data)
    } catch {
      setInvKpis(null)
    }
  }

  useEffect(() => {
    fetchDashboard()
    fetchInventoryKpis()
  }, [branchId, fromDate, toDate])

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <PageSpinner label="Loading dashboard metrics..." />
      </div>
    )
  }

  const cards = data?.cards || {}
  const charts = data?.charts || {}
  const recentSettlements = data?.recent_settlements || []

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Agro Settlement Dashboard</h1>
          <p className="text-xs text-slate-500">Live operational overview, oil calculations & vendor accounting</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-xs text-slate-700 bg-transparent border-0 focus:ring-0 p-1 font-medium"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-xs text-slate-700 bg-transparent border-0 focus:ring-0 p-1 font-medium"
          />
          <button
            onClick={fetchDashboard}
            className="rounded-lg bg-[#0b3558] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#07233b] border border-[#b37d14]/40 transition-colors shadow-xs"
          >
            Apply
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Metric Cards Grid - Full Solid Colors with Zero Borders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today Settlements (Solid Full Emerald) */}
        <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Today's Settlements</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700/80 text-white">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white">{cards.today_settlements || 0}</span>
            <span className="text-xs font-medium text-emerald-100">entries</span>
          </div>
          <div className="mt-2 inline-flex items-center rounded-md bg-emerald-700/70 px-2.5 py-1 text-xs font-bold text-white">
            Valued at ₹{(cards.today_settlement_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Card 2: Total Vendor Payable (Solid Full Royal Navy) */}
        <div className="rounded-2xl bg-[#0b3558] p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#faedcd]">Total Vendor Payable</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07233b] text-[#d69e2e]">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white">
              ₹{(cards.total_payable || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-[#f7eedb]">Total liability across active vendors</p>
        </div>

        {/* Card 3: Pending Debit Notes (Solid Full Amber / Gold) */}
        <div className="rounded-2xl bg-[#b37d14] p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100">Pending Debit Notes</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#976508] text-white">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white">{cards.pending_debit_notes || 0}</span>
            <span className="text-xs font-bold text-amber-100">Rebate notes pending</span>
          </div>
          <div className="mt-2 inline-flex items-center rounded-md bg-[#976508]/70 px-2.5 py-1 text-xs font-bold text-white">
            Quality differences & deductions
          </div>
        </div>

        {/* Card 4: Active Masters (Solid Full Deep Blue) */}
        <div className="rounded-2xl bg-[#1e40af] p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Active Masters</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d4ed8] text-white">
              <Users2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-white">{cards.total_vendors || 0}</span>
              <span className="block text-[11px] font-bold text-blue-200 uppercase">Vendors</span>
            </div>
            <div className="h-8 w-px bg-white/25" />
            <div>
              <span className="text-3xl font-black text-white">{cards.total_branches || 0}</span>
              <span className="block text-[11px] font-bold text-blue-200 uppercase">Godowns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory KPIs */}
      {invKpis && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Stock</span>
            <div className="mt-1 text-xl font-black text-[#0b3558]">{Number(invKpis.current_stock_qty || 0).toLocaleString('en-IN')}</div>
            <span className="text-[11px] font-semibold text-slate-500">{invKpis.active_lots || 0} open lots</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Stock Value</span>
            <div className="mt-1 text-xl font-black text-amber-900">₹{Number(invKpis.stock_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <span className="text-[11px] font-semibold text-amber-700">Valuation (WAC)</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Inward</span>
            <div className="mt-1 text-xl font-black text-emerald-900">{Number(invKpis.total_in_qty || 0).toLocaleString('en-IN')}</div>
            <span className="text-[11px] font-semibold text-emerald-700">₹{Number(invKpis.total_inward_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Outward</span>
            <div className="mt-1 text-xl font-black text-rose-900">{Number(invKpis.total_out_qty || 0).toLocaleString('en-IN')}</div>
            <span className="text-[11px] font-semibold text-rose-700">₹{Number(invKpis.total_outward_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      )}

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/settlements/new"
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#07233b] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          New Settlement Bill
        </Link>
        <Link
          to="/panel/debit-notes/new"
          className="flex items-center gap-2 rounded-xl bg-[#b37d14] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#976508] transition-colors"
        >
          <FileText className="w-4 h-4 text-[#fbf5ea]" />
          Create Debit Note
        </Link>
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Godown-wise Distribution */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#0b3558]">Godown-wise Settlement Value</h2>
            <Building2 className="w-4 h-4 text-[#b37d14]" />
          </div>
          <div className="space-y-3">
            {Array.isArray(charts.branch_wise) && charts.branch_wise.length ? (
              charts.branch_wise.map((b, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{b.branch_name}</span>
                    <span className="font-bold text-[#0b3558]">₹{Number(b.total_value).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0b3558]"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(b.total_value) /
                            Math.max(1, ...charts.branch_wise.map((item) => Number(item.total_value) || 0))) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{b.count} settlements recorded</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No branch settlements in this period</p>
            )}
          </div>
        </div>

        {/* Product-wise Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#0b3558]">Product-wise Settlement Volume</h2>
            <Package className="w-4 h-4 text-[#b37d14]" />
          </div>
          <div className="space-y-3">
            {Array.isArray(charts.product_wise) && charts.product_wise.length ? (
              charts.product_wise.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{p.product_name}</span>
                    <span className="font-bold text-[#b37d14]">{Number(p.total_weight_mt).toFixed(3)} MT</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#d69e2e]"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(p.total_weight_mt) /
                            Math.max(1, ...charts.product_wise.map((item) => Number(item.total_weight_mt) || 0))) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{p.count} bills</span>
                    <span className="font-medium text-[#0b3558]">Total: ₹{Number(p.total_value).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No product data in this period</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Settlements Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-[#0b3558]">Recent Settlement Bills</h2>
            <p className="text-xs text-slate-500">Live feed of processed agro consignments</p>
          </div>
          <Link
            to="/panel/settlements"
            className="flex items-center gap-1 text-xs font-semibold text-[#0b3558] hover:text-[#b37d14]"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4 text-center">Oil %</th>
                <th className="py-3 px-4 text-right">Bran Value</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.isArray(recentSettlements) && recentSettlements.length > 0 ? (
                recentSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">
                      <Link to={`/panel/settlements/${s.id}/edit`} className="hover:text-[#b37d14] hover:underline">
                        {s.settlement_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(s.settlement_date)}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {s.vendor?.vendor_name}
                      <span className="block text-[10px] text-slate-400 font-normal">{s.branch?.branch_name}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{Number(s.final_weight_mt).toFixed(3)} MT</td>
                    <td className="py-3 px-4 text-center font-bold text-[#b37d14]">{Number(s.oil_content).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ₹{Number(s.bran_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0b3558]">
                      ₹{Number(s.net_payable).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-xs text-slate-400">
                    No settlement records found. Click "New Settlement Bill" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
