import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage, openPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Select,
} from '../../components'
import { formatMoney, formatNumber, extractList, qs } from '../../utils/helpers'
import { RefreshCw, Layers, FileText, X } from 'lucide-react'

function useMasterData() {
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  useEffect(() => {
    Promise.all([
      api.get('/items?all=true').catch(() => api.get('/items?per_page=200').catch(() => ({ data: [] }))),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
    ]).then(([i, b]) => {
      const rawItems = extractList(i.data ?? i)
      const formattedItems = rawItems.map((item) => ({
        ...item,
        id: item.id,
        name: item.name || item.item_name,
        code: item.code || item.item_code,
        unit_id: item.unit_id || item.unit?.id,
        unit: item.unit,
      }))

      setItems(formattedItems)
      setBranches(extractList(b.data ?? b))
    })
  }, [])
  return { items, branches }
}

function computeDateRange(preset) {
  const now = new Date()
  const toYmd = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (preset === 'today') {
    const dStr = toYmd(now)
    return { from: dStr, to: dStr }
  }
  if (preset === 'yesterday') {
    const yest = new Date(now)
    yest.setDate(yest.getDate() - 1)
    return { from: toYmd(yest), to: toYmd(yest) }
  }
  if (preset === 'this_week') {
    const d = new Date(now)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return { from: toYmd(monday), to: toYmd(now) }
  }
  if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toYmd(firstDay), to: toYmd(now) }
  }
  if (preset === 'last_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    return { from: toYmd(firstDay), to: toYmd(lastDay) }
  }
  if (preset === 'this_fy') {
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const fyStartYear = m >= 4 ? y : y - 1
    return { from: `${fyStartYear}-04-01`, to: `${fyStartYear + 1}-03-31` }
  }
  if (preset === 'all') {
    return { from: '', to: '' }
  }
  return null
}

export default function Lots() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { items, branches } = useMasterData()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selItem, setSelItem] = useState('')
  const [selBranch, setSelBranch] = useState('')
  const [viewing, setViewing] = useState(null)
  const [duration, setDuration] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  function handleDurationChange(preset) {
    setDuration(preset)
    if (preset !== 'custom') {
      const range = computeDateRange(preset)
      if (range) {
        setFromDate(range.from)
        setToDate(range.to)
      }
    }
  }

  function resetFilters() {
    setDuration('all')
    setFromDate('')
    setToDate('')
    setSelItem('')
    setSelBranch('')
    setSearch('')
  }

  function handleExportPdf() {
    const params = {
      date_from: fromDate || undefined,
      date_to: toDate || undefined,
      item_id: selItem || undefined,
      branch_id: selBranch || branchId || undefined,
      search: search || undefined,
    }
    const fileSuffix = fromDate && toDate ? `${fromDate}_to_${toDate}` : (fromDate ? `from_${fromDate}` : (toDate ? `to_${toDate}` : 'all'))
    openPdf(`/lots/pdf${qs(params)}`, `Lots_Stock_Report_${fileSuffix}.pdf`)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lotRes, sumRes] = await Promise.all([
        api.get(`/lots${qs({ search, item_id: selItem, branch_id: selBranch || branchId || undefined, status: 'OPEN', per_page: 200 })}`),
        api.get(`/lots/summary${qs({ item_id: selItem, branch_id: selBranch || branchId || undefined })}`),
      ])
      setRows(extractList(lotRes.data))
      setSummary(sumRes.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load lots'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [branchId, search, selItem, selBranch, toast])

  useEffect(() => { load() }, [load])

  async function openView(row) {
    try {
      const res = await api.get(`/lots/${row.id}`)
      const raw = res.data?.data || res.data || {}
      const lotObj = raw.lot || raw
      setViewing({
        ...row,
        ...lotObj,
        item: lotObj.item || row.item,
        branch: lotObj.branch || row.branch,
        movements: raw.movements || lotObj.movements || [],
      })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load lot'))
    }
  }

  const tot = summary?.totals || {}

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lots / Stock"
        subtitle="Lot-wise available stock and movements"
        icon={Layers}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportPdf}
              className="border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 text-xs font-bold shadow-xs"
              title="Download / Print Lot-wise Stock Report PDF for selected duration"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-600" /> Get PDF Report
            </Button>
            <Button variant="secondary" onClick={load} loading={loading}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
          </div>
        }
      />

      {/* KPI ribbon - Solid Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#0b3558] p-3.5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <span className="text-[10px] font-bold uppercase text-[#faedcd] tracking-wider block">Open Lots</span>
          <div className="text-xl font-black text-white mt-0.5">{formatNumber(tot.total_lots ?? rows.length)}</div>
        </div>
        <div className="rounded-xl bg-emerald-600 p-3.5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <span className="text-[10px] font-bold uppercase text-emerald-100 tracking-wider block">Available Qty</span>
          <div className="text-xl font-black text-white mt-0.5">{formatNumber(tot.total_available ?? 0)} MT</div>
        </div>
        <div className="rounded-xl bg-[#b37d14] p-3.5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <span className="text-[10px] font-bold uppercase text-amber-100 tracking-wider block">Stock Value</span>
          <div className="text-xl font-black text-white mt-0.5">{formatMoney(tot.total_value ?? 0)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search lot number…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={selItem} onChange={(e) => setSelItem(e.target.value)} className="max-w-[200px]">
          <option value="">All items</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name || i.product_name} {i.code ? `(${i.code})` : ''}</option>)}
        </Select>
        <Select value={selBranch} onChange={(e) => setSelBranch(e.target.value)} className="max-w-[200px]">
          <option value="">All godowns</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>)}
        </Select>
        <Select value={duration} onChange={(e) => handleDurationChange(e.target.value)} className="max-w-[180px]">
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_fy">This Financial Year</option>
          <option value="custom">Custom Range</option>
        </Select>
        <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setDuration('custom') }} className="max-w-[160px]" aria-label="From date" />
        <span className="text-xs text-slate-400">to</span>
        <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setDuration('custom') }} className="max-w-[160px]" aria-label="To date" />
        {(duration !== 'all' || fromDate || toDate || search || selItem || selBranch) && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        )}
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id"
        emptyTitle="No open lots"
        emptyMessage="Lots appear once you confirm an inward entry."
        onRowClick={(r) => openView(r)}
        columns={[
          { key: 'lot_number', label: 'Lot No', render: (r) => <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">{r.lot_number}</span> },
          { key: 'item', label: 'Item', render: (r) => r.item?.name || `#${r.item_id}` },
          { key: 'branch', label: 'Godown', render: (r) => r.branch?.branch_name || `#${r.branch_id}` },
          { key: 'oil_pct', label: 'Oil %', align: 'right', render: (r) => r.oil_pct != null ? formatNumber(r.oil_pct, 2) : '—' },
          { key: 'available_qty', label: 'Available', align: 'right', render: (r) => <span className="font-extrabold text-emerald-800">{formatNumber(r.available_qty)}</span> },
          { key: 'stock_value', label: 'Value', align: 'right', render: (r) => formatMoney(r.stock_value) },
        ]}
      />

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={`Lot ${viewing?.lot_number || ''}`} size="lg">
        {viewing && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              <div><span className="text-slate-500 text-[11px] block font-medium">Item</span><div className="font-bold text-slate-900 mt-0.5">{viewing.item?.name || '—'}</div></div>
              <div><span className="text-slate-500 text-[11px] block font-medium">Godown</span><div className="font-bold text-slate-900 mt-0.5">{viewing.branch?.branch_name || '—'}</div></div>
              <div><span className="text-slate-500 text-[11px] block font-medium">Oil %</span><div className="font-bold text-slate-900 mt-0.5">{viewing.oil_pct != null && viewing.oil_pct !== '' ? `${formatNumber(viewing.oil_pct, 2)}%` : '—'}</div></div>
              <div><span className="text-slate-500 text-[11px] block font-medium">Stock Value</span><div className="font-bold text-slate-900 mt-0.5">{formatMoney(viewing.stock_value)}</div></div>
              <div><span className="text-slate-500 text-[11px] block font-medium">Received</span><div className="font-bold text-slate-900 mt-0.5">{formatNumber(viewing.received_qty)} MT</div></div>
              <div><span className="text-slate-500 text-[11px] block font-medium">Issued</span><div className="font-bold text-slate-900 mt-0.5">{formatNumber(viewing.issued_qty)} MT</div></div>
              <div><span className="text-slate-500 text-[11px] block font-medium">Available</span><div className="font-bold text-emerald-800 mt-0.5">{formatNumber(viewing.available_qty)} MT</div></div>
            </div>
            {(viewing.movements || []).length > 0 && (
              <div>
                <h4 className="mb-1 font-bold text-slate-700">Movements</h4>
                <table className="w-full border border-slate-200">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Date</th>
                      <th className="px-2 py-1.5 text-left">Type</th>
                      <th className="px-2 py-1.5 text-right">Qty</th>
                      <th className="px-2 py-1.5 text-left">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewing.movements || []).map((m) => (
                      <tr key={m.id}>
                        <td className="px-2 py-1.5">{m.date}</td>
                        <td className="px-2 py-1.5">{m.type}</td>
                        <td className="px-2 py-1.5 text-right">{formatNumber(m.signed_quantity ?? m.quantity)}</td>
                        <td className="px-2 py-1.5 font-mono text-[10px]">{m.source_reference || m.reference_type || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
