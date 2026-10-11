import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  ConfirmDialog,
  DataTable,
  FormField,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
} from '../../components'
import { formatMoney, formatNumber, today, extractList, qs } from '../../utils/helpers'
import { Plus, Trash2, Eye, RefreshCw, Truck } from 'lucide-react'

function useMasterData() {
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [lots, setLots] = useState([])
  useEffect(() => {
    Promise.all([
      api.get('/vendors?per_page=200').catch(() => ({ data: [] })),
      api.get('/items?per_page=200').catch(() => ({ data: [] })),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
      api.get('/lots?per_page=500&status=OPEN').catch(() => ({ data: [] })),
    ]).then(([v, i, b, l]) => {
      setVendors(extractList(v.data))
      setItems(extractList(i.data))
      setBranches(extractList(b.data))
      setLots(extractList(l.data))
    })
  }, [])
  return { vendors, items, branches, lots }
}

const emptyItem = () => ({ item_id: '', lot_id: '', quantity: '', oil_pct: '', rate: '', amount: '' })

export default function Outward() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { vendors, items, branches, lots } = useMasterData()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: today(), branch_id: branchId || '', party_id: '', dispatch_type: 'DIRECT', destination: '', vehicle_number: '', remarks: '' })
  const [formItems, setFormItems] = useState([emptyItem()])

  const [viewing, setViewing] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/outward${qs({ status: statusFilter, search, per_page: 100 })}`)
      setRows(extractList(res.data))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load outward entries'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ date: today(), branch_id: branchId || '', party_id: '', dispatch_type: 'DIRECT', destination: '', vehicle_number: '', remarks: '' })
    setFormItems([emptyItem()])
    setModalOpen(true)
  }

  function setItemField(idx, key, value) {
    setFormItems((items) => {
      const next = items.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
      const cur = next[idx]
      if (key === 'quantity' || key === 'rate') {
        cur.amount = Number(cur.quantity || 0) * Number(cur.rate || 0)
      }
      return next
    })
  }

  // For DIRECT, only show lots for the selected item with available qty
  const availableLotsFor = (itemId) =>
    lots.filter((l) => (!itemId || String(l.item_id) === String(itemId)) && Number(l.available_qty) > 0)

  const grandTotal = useMemo(() => formItems.reduce((s, it) => s + Number(it.amount || 0), 0), [formItems])

  async function save(e) {
    e.preventDefault()
    const validItems = formItems.filter((it) => it.item_id && Number(it.quantity) > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one item with quantity')
      return
    }
    if (form.dispatch_type === 'DIRECT' && validItems.some((it) => !it.lot_id)) {
      toast.error('DIRECT dispatch requires selecting a lot for each item')
      return
    }
    setSaving(true)
    try {
      await api.post('/outward', {
        date: form.date,
        branch_id: Number(form.branch_id),
        party_id: form.party_id ? Number(form.party_id) : null,
        dispatch_type: form.dispatch_type,
        destination: form.destination || null,
        vehicle_number: form.vehicle_number || null,
        remarks: form.remarks || null,
        items: validItems.map((it) => ({
          item_id: Number(it.item_id),
          lot_id: it.lot_id ? Number(it.lot_id) : null,
          quantity: Number(it.quantity),
          oil_pct: it.oil_pct === '' ? null : Number(it.oil_pct),
          rate: it.rate === '' ? null : Number(it.rate),
          amount: it.amount === '' ? null : Number(it.amount),
        })),
      })
      toast.success('Outward entry created (draft)')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create outward'))
    } finally {
      setSaving(false)
    }
  }

  async function doConfirm() {
    if (!confirmTarget) return
    setActionLoading(true)
    try {
      await api.post(`/outward/${confirmTarget.id}/confirm`)
      toast.success('Dispatch confirmed — stock deducted from lots')
      setConfirmTarget(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Confirm failed'))
    } finally {
      setActionLoading(false)
    }
  }

  async function doCancel() {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      await api.post(`/outward/${cancelTarget.id}/cancel`, { reason: cancelReason || null })
      toast.success('Dispatch cancelled — stock restored')
      setCancelTarget(null)
      setCancelReason('')
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Cancel failed'))
    } finally {
      setActionLoading(false)
    }
  }

  async function openView(row) {
    try {
      const res = await api.get(`/outward/${row.id}`)
      setViewing(res.data.data || res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load entry'))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Outward / Dispatch"
        subtitle="Lot-specific (Direct) or FIFO (Mixed) stock dispatch"
        icon={Truck}
        actions={
          <>
            <Button variant="secondary" onClick={load} loading={loading}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
            <Button onClick={openCreate}>New Dispatch</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search entry no / destination…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id"
        emptyTitle="No dispatch entries"
        emptyMessage="Create a dispatch to ship stock out of a godown."
        columns={[
          { key: 'entry_number', label: 'Entry No', render: (r) => <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">{r.entry_number}</span> },
          { key: 'date', label: 'Date' },
          { key: 'dispatch_type', label: 'Type', render: (r) => <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${r.dispatch_type === 'MIXED' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{r.dispatch_type}</span> },
          { key: 'party', label: 'Party', render: (r) => r.party?.vendor_name || '—' },
          { key: 'destination', label: 'Destination', render: (r) => r.destination || '—' },
          { key: 'items_count', label: 'Items', render: (r) => (r.items || []).length },
          { key: 'total_amount', label: 'Total', align: 'right', render: (r) => formatMoney(r.total_amount) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (r) => (
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => openView(r)}><Eye className="h-3 w-3" /> View</Button>
                {r.status === 'DRAFT' && (
                  <>
                    <Button size="sm" variant="primary" onClick={() => setConfirmTarget(r)}>Confirm</Button>
                    <Button size="sm" variant="danger" onClick={() => setCancelTarget(r)}>Cancel</Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Dispatch"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} form="outward-form">Save Draft</Button>
          </>
        }
      >
        <form id="outward-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <FormField label="Date" required><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></FormField>
            <FormField label="Godown" required>
              <Select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required>
                <option value="">Select…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Dispatch Type" required>
              <Select value={form.dispatch_type} onChange={(e) => setForm({ ...form, dispatch_type: e.target.value })}>
                <option value="DIRECT">Direct (specific lot)</option>
                <option value="MIXED">Mixed (FIFO)</option>
              </Select>
            </FormField>
            <FormField label="Party / Customer">
              <Select value={form.party_id} onChange={(e) => setForm({ ...form, party_id: e.target.value })}>
                <option value="">Select…</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
              </Select>
            </FormField>
            <FormField label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Customer / city" /></FormField>
            <FormField label="Vehicle No"><Input value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} placeholder="TN 01 AB 1234" /></FormField>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-bold text-slate-700">Items dispatched</span>
              <Button size="sm" type="button" variant="secondary" onClick={() => setFormItems((f) => [...f, emptyItem()])}>
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-2 py-2 text-left">Item</th>
                    {form.dispatch_type === 'DIRECT' && <th className="px-2 py-2 text-left">Lot</th>}
                    <th className="px-2 py-2 text-right">Qty</th>
                    {form.dispatch_type === 'MIXED' && <th className="px-2 py-2 text-right">Oil %</th>}
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formItems.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1.5">
                        <Select value={it.item_id} onChange={(e) => setItemField(idx, 'item_id', e.target.value)}>
                          <option value="">Select…</option>
                          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </Select>
                      </td>
                      {form.dispatch_type === 'DIRECT' && (
                        <td className="px-2 py-1.5">
                          <Select value={it.lot_id} onChange={(e) => setItemField(idx, 'lot_id', e.target.value)}>
                            <option value="">Select lot…</option>
                            {availableLotsFor(it.item_id).map((l) => (
                              <option key={l.id} value={l.id}>{l.lot_number} (avail {formatNumber(l.available_qty)})</option>
                            ))}
                          </Select>
                        </td>
                      )}
                      <td className="px-2 py-1.5"><Input type="number" step="0.001" value={it.quantity} onChange={(e) => setItemField(idx, 'quantity', e.target.value)} className="text-right" /></td>
                      {form.dispatch_type === 'MIXED' && (
                        <td className="px-2 py-1.5"><Input type="number" step="0.01" value={it.oil_pct} onChange={(e) => setItemField(idx, 'oil_pct', e.target.value)} className="text-right" /></td>
                      )}
                      <td className="px-2 py-1.5"><Input type="number" step="0.01" value={it.rate} onChange={(e) => setItemField(idx, 'rate', e.target.value)} className="text-right" /></td>
                      <td className="px-2 py-1.5 text-right font-bold text-slate-800">{formatNumber(it.amount)}</td>
                      <td className="px-2 py-1.5 text-center">
                        {formItems.length > 1 && (
                          <button type="button" onClick={() => setFormItems((f) => f.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={form.dispatch_type === 'DIRECT' ? 5 : 6} className="px-2 py-2 text-right text-slate-600">Grand Total</td>
                    <td className="px-2 py-2 text-right text-[#0B1A2D]">{formatMoney(grandTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <FormField label="Remarks"><Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></FormField>
        </form>
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={`Dispatch ${viewing?.entry_number || ''}`} size="lg">
        {viewing && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><span className="text-slate-500">Date</span><div className="font-bold">{viewing.date}</div></div>
              <div><span className="text-slate-500">Type</span><div className="font-bold">{viewing.dispatch_type}</div></div>
              <div><span className="text-slate-500">Destination</span><div className="font-bold">{viewing.destination || '—'}</div></div>
              <div><span className="text-slate-500">Status</span><div><StatusBadge status={viewing.status} /></div></div>
            </div>
            <table className="w-full border border-slate-200">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="px-2 py-1.5 text-left">Item</th>
                  <th className="px-2 py-1.5 text-left">Lot</th>
                  <th className="px-2 py-1.5 text-right">Qty</th>
                  <th className="px-2 py-1.5 text-right">Oil %</th>
                  <th className="px-2 py-1.5 text-right">Rate</th>
                  <th className="px-2 py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(viewing.items || []).map((it) => (
                  <tr key={it.id}>
                    <td className="px-2 py-1.5">{it.item?.name || `#${it.item_id}`}</td>
                    <td className="px-2 py-1.5 font-mono">{it.lot?.lot_number || (it.lot_number ? `#${it.lot_number}` : '—')}</td>
                    <td className="px-2 py-1.5 text-right">{formatNumber(it.quantity)}</td>
                    <td className="px-2 py-1.5 text-right">{it.oil_pct ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">{it.rate != null ? formatMoney(it.rate) : '—'}</td>
                    <td className="px-2 py-1.5 text-right font-bold">{formatMoney(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Confirm Dispatch"
        message={`Post stock deduction for ${confirmTarget?.entry_number}? ${confirmTarget?.dispatch_type === 'MIXED' ? 'Mixed dispatch uses FIFO across open lots.' : 'Direct dispatch deducts from the selected lot.'}`}
        confirmText="Confirm & Dispatch"
        loading={actionLoading}
        onConfirm={doConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Dispatch"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>Close</Button>
            <Button variant="danger" onClick={doCancel} loading={actionLoading}>Cancel Entry</Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p>Cancelling <strong>{cancelTarget?.entry_number}</strong> will restore stock. History is preserved.</p>
          <FormField label="Reason"><Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation" /></FormField>
        </div>
      </Modal>
    </div>
  )
}
