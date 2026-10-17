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

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/dashboard', {
        params: {
          from_date: fromDate,
          to_date: toDate,
        },
      })
      setData(res.data.data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [fromDate, toDate])

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
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Settlement Dashboard</h1>
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

      {/* Metric Cards - 3 Core Financial Cards (Total Settlements, Total Debit, Total Credit) with Direct Click Navigation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Total Settlements */}
        <Link
          to="/panel/settlements"
          className="group rounded-2xl bg-[#0b3558] p-5 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between border border-[#b37d14]/30 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#faedcd] flex items-center gap-1.5">
                Total Settlements
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[#d69e2e]" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07233b] text-[#d69e2e] shrink-0 border border-[#b37d14]/20">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {cards.total_settlements ?? cards.today_settlements ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-200">bills</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
            <span className="inline-flex items-center rounded-md bg-[#07233b]/80 px-2.5 py-1 text-[11px] font-bold text-[#faedcd] truncate max-w-full">
              ₹{Number(cards.total_settlement_value ?? cards.today_settlement_value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 2: Total Debit */}
        <Link
          to="/panel/debit-notes"
          className="group rounded-2xl bg-amber-600 p-5 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between cursor-pointer border border-amber-500/40"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                Total Debit Notes
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-white" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700/80 text-white shrink-0">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {cards.total_debit_count ?? cards.pending_debit_notes ?? 0}
              </span>
              <span className="text-xs font-medium text-amber-100">notes</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/15">
            <span className="inline-flex items-center rounded-md bg-amber-700/70 px-2.5 py-1 text-[11px] font-bold text-white truncate max-w-full">
              ₹{Number(cards.total_debit_value ?? cards.total_receivable ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] font-semibold text-amber-100 group-hover:text-white flex items-center gap-1 transition-colors">
              View debit <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* Card 3: Total Credit */}
        <Link
          to="/panel/debit-notes"
          className="group rounded-2xl bg-emerald-600 p-5 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between cursor-pointer border border-emerald-500/40"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                Total Credit Notes
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-white" />
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700/80 text-white shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {cards.total_credit_count ?? 0}
              </span>
              <span className="text-xs font-medium text-emerald-100">notes</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/15">
            <span className="inline-flex items-center rounded-md bg-emerald-700/70 px-2.5 py-1 text-[11px] font-bold text-white truncate max-w-full">
              ₹{Number(cards.total_credit_value ?? cards.total_payable ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[11px] font-semibold text-emerald-100 group-hover:text-white flex items-center gap-1 transition-colors">
              View credit <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/panel/settlements/new"
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#07233b] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          New Settlement Bill
        </Link>
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
