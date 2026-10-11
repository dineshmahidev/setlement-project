import { useCallback, useEffect, useState } from 'react'
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
import { formatNumber, today, extractList, qs } from '../../utils/helpers'
import { Plus, Trash2, Eye, RefreshCw, Factory } from 'lucide-react'

function useMasterData() {
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [lots, setLots] = useState([])
  useEffect(() => {
    Promise.all([
      api.get('/items?per_page=200').catch(() => ({ data: [] })),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
      api.get('/lots?per_page=500&status=OPEN').catch(() => ({ data: [] })),
    ]).then(([i, b, l]) => {
      setItems(extractList(i.data))
      setBranches(extractList(b.data))
      setLots(extractList(l.data))
    })
  }, [])
  return { items, branches, lots }
}

const emptyInput = () => ({ lot_id: '', quantity: '' })

export default function Production() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { items, branches, lots } = useMasterData()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: today(), source_branch_id: branchId || '', dest_branch_id: branchId || '', output_item_id: '', output_lot_number: '', output_oil_pct: '', remarks: '' })
  const [inputs, setInputs] = useState([emptyInput()])
  const [outputQty, setOutputQty] = useState('')

  const [viewing, setViewing] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/production${qs({ status: statusFilter, per_page: 100 })}`)
      setRows(extractList(res.data))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load production batches'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ date: today(), source_branch_id: branchId || '', dest_branch_id: branchId || '', output_item_id: '', output_lot_number: '', output_oil_pct: '', remarks: '' })
    setInputs([emptyInput()])
    setOutputQty('')
    setModalOpen(true)
  }

  function setInputField(idx, key, value) {
    setInputs((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }

  const totalInput = inputs.reduce((s, it) => s + Number(it.quantity || 0), 0)

  async function save(e) {
    e.preventDefault()
    const validInputs = inputs.filter((it) => it.lot_id && Number(it.quantity) > 0)
    if (validInputs.length === 0) {
      toast.error('Add at least one input lot with quantity')
      return
    }
    if (!form.output_item_id || !Number(outputQty)) {
      toast.error('Select output item and quantity')
      return
    }
    setSaving(true)
    try {
      await api.post('/production', {
        date: form.date,
        source_branch_id: Number(form.source_branch_id),
        dest_branch_id: Number(form.dest_branch_id),
        output_item_id: Number(form.output_item_id),
        output_lot_number: form.output_lot_number || null,
        output_oil_pct: form.output_oil_pct === '' ? null : Number(form.output_oil_pct),
        remarks: form.remarks || null,
        inputs: validInputs.map((it) => ({ lot_id: Number(it.lot_id), quantity: Number(it.quantity) })),
        outputs: [{ item_id: Number(form.output_item_id), quantity: Number(outputQty), oil_pct: form.output_oil_pct === '' ? null : Number(form.output_oil_pct) }],
      })
      toast.success('Production batch created (draft)')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create batch'))
    } finally {
      setSaving(false)
    }
  }

  async function doConfirm() {
    if (!confirmTarget) return
    setActionLoading(true)
    try {
      await api.post(`/production/${confirmTarget.id}/confirm`)
      toast.success('Batch confirmed — input lots consumed, output lot created')
      setConfirmTarget(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Confirm failed'))
    } finally {
      setActionLoading(false)
    }
  }

  async function openView(row) {
    try {
      const res = await api.get(`/production/${row.id}`)
      setViewing(res.data.data || res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load batch'))
    }
  }

  const openLots = lots.filter((l) => Number(l.available_qty) > 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mixing / Production"
        subtitle="Consume input lots into a new graded output lot"
        icon={Factory}
        actions={
          <>
            <Button variant="secondary" onClick={load} loading={loading}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
            <Button onClick={openCreate}>New Batch</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
        </Select>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id"
        emptyTitle="No production batches"
        emptyMessage="Create a mixing batch to blend input lots into a new grade."
        columns={[
          { key: 'batch_number', label: 'Batch No', render: (r) => <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">{r.batch_number}</span> },
          { key: 'date', label: 'Date' },
          { key: 'output_item', label: 'Output Item', render: (r) => r.output_item?.name || r.output_item_name || '—' },
          { key: 'input_total', label: 'Input', align: 'right', render: (r) => formatNumber(r.input_total ?? r.input_total_qty ?? 0) },
          { key: 'output_total', label: 'Output', align: 'right', render: (r) => formatNumber(r.output_total ?? r.output_total_qty ?? 0) },
          { key: 'wastage', label: 'Wastage', align: 'right', render: (r) => formatNumber(r.wastage ?? 0) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (r) => (
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => openView(r)}><Eye className="h-3 w-3" /> View</Button>
                {r.status === 'DRAFT' && <Button size="sm" variant="primary" onClick={() => setConfirmTarget(r)}>Confirm</Button>}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Production Batch"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} form="prod-form">Save Draft</Button>
          </>
        }
      >
        <form id="prod-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <FormField label="Date" required><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></FormField>
            <FormField label="Source Godown" required>
              <Select value={form.source_branch_id} onChange={(e) => setForm({ ...form, source_branch_id: e.target.value })}>
                <option value="">Select…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Dest Godown" required>
              <Select value={form.dest_branch_id} onChange={(e) => setForm({ ...form, dest_branch_id: e.target.value })}>
                <option value="">Select…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Output Oil %"><Input type="number" step="0.01" value={form.output_oil_pct} onChange={(e) => setForm({ ...form, output_oil_pct: e.target.value })} /></FormField>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-bold text-slate-700">Input lots consumed (total {formatNumber(totalInput)})</span>
              <Button size="sm" type="button" variant="secondary" onClick={() => setInputs((f) => [...f, emptyInput()])}>
                <Plus className="h-3 w-3" /> Add Input
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-2 py-2 text-left">Lot</th>
                    <th className="px-2 py-2 text-right">Qty to consume</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inputs.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1.5">
                        <Select value={it.lot_id} onChange={(e) => setInputField(idx, 'lot_id', e.target.value)}>
                          <option value="">Select lot…</option>
                          {openLots.map((l) => (
                            <option key={l.id} value={l.id}>{l.lot_number} — {l.item?.name || `#${l.item_id}`} (avail {formatNumber(l.available_qty)})</option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-2 py-1.5"><Input type="number" step="0.001" value={it.quantity} onChange={(e) => setInputField(idx, 'quantity', e.target.value)} className="text-right" /></td>
                      <td className="px-2 py-1.5 text-center">
                        {inputs.length > 1 && (
                          <button type="button" onClick={() => setInputs((f) => f.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
            <FormField label="Output Item" required>
              <Select value={form.output_item_id} onChange={(e) => setForm({ ...form, output_item_id: e.target.value })}>
                <option value="">Select…</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Output Qty" required><Input type="number" step="0.001" value={outputQty} onChange={(e) => setOutputQty(e.target.value)} /></FormField>
            <FormField label="Output Lot No"><Input value={form.output_lot_number} onChange={(e) => setForm({ ...form, output_lot_number: e.target.value })} placeholder="PRD-OUT-1" /></FormField>
          </div>

          <FormField label="Remarks"><Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></FormField>
        </form>
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={`Batch ${viewing?.batch_number || ''}`} size="lg">
        {viewing && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><span className="text-slate-500">Date</span><div className="font-bold">{viewing.date}</div></div>
              <div><span className="text-slate-500">Output Item</span><div className="font-bold">{viewing.output_item?.name || '—'}</div></div>
              <div><span className="text-slate-500">Output Qty</span><div className="font-bold">{formatNumber(viewing.output_total ?? viewing.output_total_qty ?? 0)}</div></div>
              <div><span className="text-slate-500">Status</span><div><StatusBadge status={viewing.status} /></div></div>
            </div>
            <div>
              <h4 className="mb-1 font-bold text-slate-700">Inputs</h4>
              <table className="w-full border border-slate-200">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                  <tr><th className="px-2 py-1.5 text-left">Lot</th><th className="px-2 py-1.5 text-right">Qty</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewing.inputs || []).map((it) => (
                    <tr key={it.id}>
                      <td className="px-2 py-1.5">{it.lot?.lot_number || `#${it.lot_id}`}</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Confirm Production"
        message={`Confirm batch ${confirmTarget?.batch_number}? Input lots will be consumed and a new output lot created.`}
        confirmText="Confirm Batch"
        loading={actionLoading}
        onConfirm={doConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
