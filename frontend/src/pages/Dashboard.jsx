import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageSpinner, PageHeader, BarChart, Input, FormField } from '../components'
import { formatNumber } from '../utils/helpers'

export default function Dashboard() {
  const { branchId, user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard', {
        params: {
          branch_id: branchId || undefined,
          date_from: dateFrom,
          date_to: dateTo,
        },
      })
      setData(res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load dashboard'))
      setData({ stats: {}, charts: {} })
    } finally {
      setLoading(false)
    }
  }, [branchId, dateFrom, dateTo, toast])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) return <PageSpinner />

  const stats = data?.stats || {}
  const charts = data?.charts || {}

  const cards = [
    { label: 'Branches', value: stats.total_branches },
    { label: 'Vendors', value: stats.total_vendors },
    { label: 'Bills in range', value: stats.settlement_bills_today },
    { label: 'DN in range', value: stats.debit_notes_today },
    { label: 'Stock In', value: formatNumber(stats.stock_in_today, 2) },
    { label: 'Stock Out', value: formatNumber(stats.stock_out_today, 2) },
    { label: 'Current Stock', value: formatNumber(stats.current_stock, 2) },
    { label: 'Low Stock Items', value: stats.low_stock_items },
    { label: 'Active Vehicles', value: stats.active_vehicles },
    { label: 'Movements', value: stats.vehicle_movements_today },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome${user?.name ? `, ${user.name}` : ''}`}
        actions={
          <div className="flex items-end gap-2">
            <FormField label="From">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="py-1.5" />
            </FormField>
            <FormField label="To">
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="py-1.5" />
            </FormField>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{c.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Stock In vs Stock Out (7 days)</h3>
          <BarChart
            data={charts.stock_flow || []}
            labelKey="date"
            series={[
              { key: 'stock_in', label: 'Stock In', color: '#059669' },
              { key: 'stock_out', label: 'Stock Out', color: '#dc2626' },
            ]}
            height={170}
            formatValue={(v) => formatNumber(v, 1)}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Settlement Value (7 days)</h3>
          <BarChart data={charts.settlement_value || []} labelKey="date" valueKey="value" color="#2563eb" height={170} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Branch-wise Stock</h3>
          <BarChart data={charts.branch_stock || []} labelKey="branch" valueKey="stock" color="#7c3aed" height={170} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Item-wise Stock</h3>
          <BarChart data={charts.item_stock || []} labelKey="item" valueKey="stock" color="#0d9488" height={170} />
        </div>
      </div>

    </div>
  )
}
