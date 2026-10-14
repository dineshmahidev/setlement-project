import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage, openPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  DataTable,
  FormField,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
} from '../../components'
import { formatNumber, formatDate, today, extractList, qs } from '../../utils/helpers'
import { Plus, Trash2, Eye, RefreshCw, Factory, Printer } from 'lucide-react'

function useMasterData() {
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [lots, setLots] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/vendors?per_page=200').catch(() => ({ data: [] })),
      api.get('/items?all=true').catch(() => api.get('/items?per_page=200').catch(() => ({ data: [] }))),
      api.get('/products?all=true').catch(() => api.get('/products?per_page=200').catch(() => ({ data: [] }))),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
      api.get('/lots?per_page=500&status=OPEN').catch(() => ({ data: [] })),
    ]).then(([v, i, p, b, l]) => {
      setVendors(extractList(v.data ?? v))

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
      setLots(extractList(l.data ?? l))
    })
  }, [])

  return { vendors, items, branches, lots }
}

const emptyInput = () => ({ lot_id: '', item_id: '', quantity: '' })

export default function Production() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { vendors, items, branches, lots } = useMasterData()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: today(),
    party_id: '',
    source_branch_id: branchId || '',
    dest_branch_id: branchId || '',
    output_item_id: '',
    output_lot_number: '',
    remarks: '',
  })
  const [inputs, setInputs] = useState([emptyInput()])
  const [outputQty, setOutputQty] = useState('')

  const [viewing, setViewing] = useState(null)

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

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setForm({
      date: today(),
      party_id: '',
      source_branch_id: branchId || '',
      dest_branch_id: branchId || '',
      output_item_id: '',
      output_lot_number: '',
      remarks: '',
    })
    setInputs([emptyInput()])
    setOutputQty('')
    setModalOpen(true)
  }

  function setInputField(idx, key, value) {
    setInputs((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it
        const updated = { ...it, [key]: value }
        if (key === 'lot_id' && value) {
          const matchedLot = lots.find((l) => String(l.id) === String(value))
          if (matchedLot) {
            updated.item_id = matchedLot.item_id
          }
        }
        return updated
      })
    )
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
        party_id: form.party_id ? Number(form.party_id) : null,
        source_branch_id: form.source_branch_id ? Number(form.source_branch_id) : null,
        dest_branch_id: Number(form.dest_branch_id),
        output_item_id: Number(form.output_item_id),
        output_lot_number: form.output_lot_number || null,
        remarks: form.remarks || null,
        inputs: validInputs.map((it) => {
          const lotObj = lots.find((l) => String(l.id) === String(it.lot_id))
          return {
            lot_id: Number(it.lot_id),
            item_id: it.item_id ? Number(it.item_id) : (lotObj ? Number(lotObj.item_id) : null),
            quantity: Number(it.quantity),
          }
        }),
        outputs: [
          {
            item_id: Number(form.output_item_id),
            quantity: Number(outputQty),
          },
        ],
      })
      toast.success('Production batch created & stock mixed automatically!')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create production batch'))
    } finally {
      setSaving(false)
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
        subtitle="Consume input lots and produce mixed batches with instant stock update"
        icon={Factory}
        actions={
          <>
            <Button variant="secondary" onClick={load} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={openCreate}>New Batch</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="max-w-[160px]"
        >
          <option value="">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="DRAFT">Draft</option>
        </Select>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id"
        emptyTitle="No production batches"
        emptyMessage="Create a mixing batch to blend input lots into a new grade."
        columns={[
          {
            key: 'batch_number',
            label: 'Batch No',
            render: (r) => (
              <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">
                {r.batch_number}
              </span>
            ),
          },
          { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
          {
            key: 'party',
            label: 'Party / Vendor',
            render: (r) => (
              <span className="block max-w-[150px] truncate font-medium text-slate-800" title={r.party?.vendor_name || ''}>
                {r.party?.vendor_name || '—'}
              </span>
            ),
          },
          {
            key: 'output_item',
            label: 'Output Item',
            render: (r) => r.output_item?.name || r.output_item_name || '—',
          },
          {
            key: 'input_total',
            label: 'Input Qty',
            align: 'right',
            render: (r) => formatNumber(r.input_total ?? r.input_total_qty ?? 0),
          },
          {
            key: 'output_total',
            label: 'Output Qty',
            align: 'right',
            render: (r) => formatNumber(r.output_total ?? r.output_total_qty ?? 0),
          },
          {
            key: 'wastage',
            label: 'Wastage',
            align: 'right',
            render: (r) => formatNumber(r.wastage ?? 0),
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (r) => (
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => openView(r)}>
                  <Eye className="h-3 w-3" /> View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openPdf(`/production/${r.id}/pdf`, `Production_${r.batch_number}.pdf`)}
                  title="Print / Download PDF"
                >
                  <Printer className="h-3 w-3" /> PDF
                </Button>
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
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} form="prod-form">
              Save & Mix
            </Button>
          </>
        }
      >
        <form id="prod-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <FormField label="Party / Vendor">
              <Select
                value={form.party_id}
                onChange={(e) => setForm({ ...form, party_id: e.target.value })}
              >
                <option value="">Select party…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Date" required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Source Godown">
              <Select
                value={form.source_branch_id}
                onChange={(e) => setForm({ ...form, source_branch_id: e.target.value })}
              >
                <option value="">Select…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name || b.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Dest Godown" required>
              <Select
                value={form.dest_branch_id}
                onChange={(e) => setForm({ ...form, dest_branch_id: e.target.value })}
              >
                <option value="">Select…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name || b.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-bold text-slate-700">
                Input Lots Consumed (total {formatNumber(totalInput)})
              </span>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => setInputs((f) => [...f, emptyInput()])}
              >
                <Plus className="h-3 w-3" /> Add Input
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-2 py-2 text-left">Lot</th>
                    <th className="px-2 py-2 text-right">Qty to Consume</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inputs.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1.5">
                        <Select
                          value={it.lot_id}
                          onChange={(e) => setInputField(idx, 'lot_id', e.target.value)}
                        >
                          <option value="">Select lot…</option>
                          {openLots.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.lot_number} — {l.item?.name || `#${l.item_id}`} (avail {formatNumber(l.available_qty)})
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          step="0.001"
                          value={it.quantity}
                          onChange={(e) => setInputField(idx, 'quantity', e.target.value)}
                          className="text-right"
                          placeholder="0.000"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {inputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setInputs((f) => f.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700"
                          >
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
              <Select
                value={form.output_item_id}
                onChange={(e) => setForm({ ...form, output_item_id: e.target.value })}
              >
                <option value="">Select…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name || i.product_name} {i.code ? `(${i.code})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Output Qty" required>
              <Input
                type="number"
                step="0.001"
                value={outputQty}
                onChange={(e) => setOutputQty(e.target.value)}
              />
            </FormField>
            <FormField label="Output Lot No">
              <Input
                value={form.output_lot_number}
                onChange={(e) => setForm({ ...form, output_lot_number: e.target.value })}
                placeholder="PRD-OUT-1"
              />
            </FormField>
          </div>

          <FormField label="Narration">
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Narration / mixing details"
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={`Batch ${viewing?.batch_number || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button
              onClick={() =>
                openPdf(`/production/${viewing?.id}/pdf`, `Production_${viewing?.batch_number}.pdf`)
              }
            >
              <Printer className="h-3.5 w-3.5" /> Print / Download PDF
            </Button>
          </>
        }
      >
        {viewing && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg">
              <div>
                <span className="text-slate-500 block text-[11px]">Date</span>
                <div className="font-bold">{formatDate(viewing.date)}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Party / Vendor</span>
                <div className="font-bold text-slate-900">{viewing.party?.vendor_name || '—'}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Output Item</span>
                <div className="font-bold">{viewing.output_item?.name || '—'}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Output Qty</span>
                <div className="font-bold">
                  {formatNumber(viewing.output_total ?? viewing.output_total_qty ?? 0)}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Source Godown</span>
                <div className="font-bold">{viewing.source_branch?.branch_name || '—'}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Dest Godown</span>
                <div className="font-bold">{viewing.dest_branch?.branch_name || '—'}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status</span>
                <div><StatusBadge status={viewing.status} /></div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Narration</span>
                <div className="font-medium text-slate-700 truncate">{viewing.remarks || viewing.notes || '—'}</div>
              </div>
            </div>
            <div>
              <h4 className="mb-1 font-bold text-slate-700">Inputs</h4>
              <table className="w-full border border-slate-200">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Lot</th>
                    <th className="px-2 py-1.5 text-right">Qty</th>
                  </tr>
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
    </div>
  )
}
