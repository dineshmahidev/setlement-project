import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
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
import { RefreshCw, Layers, Eye } from 'lucide-react'

function useMasterData() {
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  useEffect(() => {
    Promise.all([
      api.get('/items?all=true').catch(() => api.get('/items?per_page=200').catch(() => ({ data: [] }))),
      api.get('/products?all=true').catch(() => api.get('/products?per_page=200').catch(() => ({ data: [] }))),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
    ]).then(([i, p, b]) => {
      const rawItems = extractList(i.data ?? i)
      const rawProducts = extractList(p.data ?? p)

      const mergedItems = [
        ...rawItems.map((item) => ({
          ...item,
          id: item.id,
          name: item.name || item.item_name || item.product_name,
          code: item.code || item.item_code,
          unit_id: item.unit_id || item.unit?.id,
          unit: item.unit,
        })),
        ...rawProducts
          .filter(
            (prod) =>
              !rawItems.some(
                (it) =>
                  (it.name && it.name.toLowerCase() === (prod.product_name || prod.name || '').toLowerCase())
              )
          )
          .map((prod) => ({
            ...prod,
            id: prod.id,
            name: prod.product_name || prod.name,
            code: prod.product_code || prod.code,
            unit_id: prod.unit_id,
            unit: prod.unit || { code: 'MT', name: 'Metric Ton' },
          })),
      ]

      setItems(mergedItems)
      setBranches(extractList(b.data ?? b))
    })
  }, [])
  return { items, branches }
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
      setViewing(res.data.data || res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load lot'))
    }
  }

  const tot = summary?.totals || {}

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lots / Stock"
        subtitle="Lot-wise available stock with oil% grading"
        icon={Layers}
        actions={<Button variant="secondary" onClick={load} loading={loading}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>}
      />

      {/* KPI ribbon - Solid Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <div className="rounded-xl bg-[#1e40af] p-3.5 text-white shadow-sm transition-transform hover:-translate-y-0.5">
          <span className="text-[10px] font-bold uppercase text-blue-100 tracking-wider block">Avg Oil %</span>
          <div className="text-xl font-black text-white mt-0.5">{formatNumber(tot.avg_oil_pct ?? 0, 2)}%</div>
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
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id"
        emptyTitle="No open lots"
        emptyMessage="Lots appear once you confirm an inward entry."
        columns={[
          { key: 'lot_number', label: 'Lot No', render: (r) => <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">{r.lot_number}</span> },
          { key: 'item', label: 'Item', render: (r) => r.item?.name || `#${r.item_id}` },
          { key: 'branch', label: 'Godown', render: (r) => r.branch?.branch_name || `#${r.branch_id}` },
          { key: 'oil_pct', label: 'Oil %', align: 'right', render: (r) => r.oil_pct != null ? formatNumber(r.oil_pct, 2) : '—' },
          { key: 'grade', label: 'Grade', render: (r) => r.grade?.name || '—' },
          { key: 'available_qty', label: 'Available', align: 'right', render: (r) => <span className="font-extrabold text-emerald-800">{formatNumber(r.available_qty)}</span> },
          { key: 'stock_value', label: 'Value', align: 'right', render: (r) => formatMoney(r.stock_value) },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (r) => <Button size="sm" variant="secondary" onClick={() => openView(r)}><Eye className="h-3 w-3" /> View</Button>,
          },
        ]}
      />

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={`Lot ${viewing?.lot_number || ''}`} size="lg">
        {viewing && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><span className="text-slate-500">Item</span><div className="font-bold">{viewing.item?.name || '—'}</div></div>
              <div><span className="text-slate-500">Godown</span><div className="font-bold">{viewing.branch?.branch_name || '—'}</div></div>
              <div><span className="text-slate-500">Oil %</span><div className="font-bold">{viewing.oil_pct ?? '—'}</div></div>
              <div><span className="text-slate-500">Grade</span><div className="font-bold">{viewing.grade?.name || '—'}</div></div>
              <div><span className="text-slate-500">Received</span><div className="font-bold">{formatNumber(viewing.received_qty)}</div></div>
              <div><span className="text-slate-500">Issued</span><div className="font-bold">{formatNumber(viewing.issued_qty)}</div></div>
              <div><span className="text-slate-500">Available</span><div className="font-bold text-emerald-800">{formatNumber(viewing.available_qty)}</div></div>
              <div><span className="text-slate-500">Value</span><div className="font-bold">{formatMoney(viewing.stock_value)}</div></div>
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
