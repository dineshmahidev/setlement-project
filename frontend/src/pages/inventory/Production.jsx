import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  ConfirmDialog,
} from '../../components'
import { formatNumber, formatDate, today, extractList, qs } from '../../utils/helpers'
import { useGodownSync } from '../../hooks/useGodownSync'
import { Plus, Trash2, Eye, RefreshCw, Factory, Printer, Edit2 } from 'lucide-react'

function useMasterData() {
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [lots, setLots] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/vendors?per_page=200').catch(() => ({ data: [] })),
      api.get('/items?all=true').catch(() => api.get('/items?per_page=200').catch(() => ({ data: [] }))),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
      api.get('/lots?per_page=500&status=OPEN').catch(() => ({ data: [] })),
    ]).then(([v, i, b, l]) => {
      setVendors(extractList(v.data ?? v))

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
      setLots(extractList(l.data ?? l))
    })
  }, [])

  return { vendors, items, branches, lots, setLots }
}

const emptyInput = () => ({ lot_id: '', item_id: '', unit_id: '', quantity: '', oil_pct: '', rate: '' })
const emptyOutput = () => ({ item_id: '', quantity: '', lot_number: '' })

export default function Production() {
  const toast = useToast()
  const { branchId } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { vendors, items, branches, lots, setLots } = useMasterData()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    date: today(),
    party_id: '',
    branch_id: branchId || '',
    remarks: '',
  })
  const [inputs, setInputs] = useState([emptyInput()])
  const [outputs, setOutputs] = useState([emptyOutput()])
  // Form godown follows the nav picker (disabled while editing an existing batch)
  const onFormBranchChange = useGodownSync(
    form.branch_id,
    (v) => setForm((f) => ({ ...f, branch_id: v })),
    !editingBatch
  )

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
    setEditingBatch(null)
    setForm({
      date: today(),
      party_id: '',
      branch_id: branchId || '',
      remarks: '',
    })
    setInputs([emptyInput()])
    setOutputs([emptyOutput()])
    setModalOpen(true)
  }

  async function openEdit(row) {
    try {
      const res = await api.get(`/production/${row.id}`)
      const data = res.data.data || res.data
      setEditingBatch(data)

      // Merge any closed/consumed input lots into master lots list
      if (data.inputs && data.inputs.length > 0) {
        setLots((prevLots) => {
          const map = new Map(prevLots.map((l) => [String(l.id), l]))
          data.inputs.forEach((inp) => {
            if (inp.lot && !map.has(String(inp.lot.id))) {
              map.set(String(inp.lot.id), {
                ...inp.lot,
                id: inp.lot.id,
                item: inp.item || inp.lot.item,
                branch_id: inp.lot.branch_id || data.source_branch_id,
                available_qty: Number(inp.lot.available_qty || 0),
              })
            }
          })
          return Array.from(map.values())
        })
      }

      setForm({
        date: data.date ? String(data.date).slice(0, 10) : today(),
        party_id: data.party_id ? String(data.party_id) : '',
        branch_id: data.dest_branch_id
          ? String(data.dest_branch_id)
          : data.source_branch_id
            ? String(data.source_branch_id)
            : '',
        remarks: data.remarks || data.notes || '',
      })

      if (data.inputs && data.inputs.length > 0) {
        setInputs(
          data.inputs.map((inp) => {
            const lot = inp.lot || {}
            const unitId = lot.unit_id || lot.unit?.id || inp.item?.unit_id || inp.item?.unit?.id || ''
            return {
              lot_id: inp.lot_id ? String(inp.lot_id) : '',
              item_id: inp.item_id ? String(inp.item_id) : '',
              unit_id: unitId ? String(unitId) : '',
              quantity: inp.quantity != null ? String(inp.quantity) : '',
              oil_pct: inp.oil_pct != null ? String(inp.oil_pct) : lot.oil_pct != null ? String(lot.oil_pct) : '',
              rate: lot.unit_cost != null ? String(lot.unit_cost) : '',
            }
          })
        )
      } else {
        setInputs([emptyInput()])
      }

      setOutputs(
        data.outputs && data.outputs.length > 0
          ? data.outputs.map((o) => ({
              item_id: o.item_id ? String(o.item_id) : '',
              quantity: o.quantity != null ? String(o.quantity) : '',
              lot_number: o.lot_number || '',
            }))
          : [
              {
                item_id: data.output_item_id ? String(data.output_item_id) : '',
                quantity: data.output_total != null ? String(data.output_total) : '',
                lot_number: data.output_lot_number || '',
              },
            ]
      )

      setViewing(null)
      setModalOpen(true)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load batch for editing'))
    }
  }

  // Deep-link support: /inventory/production?edit={id}
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      openEdit({ id: editId })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  function setInputField(idx, key, value) {
    setInputs((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it
        const updated = { ...it, [key]: value }
        if (key === 'lot_id') {
          if (value) {
            const matchedLot = lots.find((l) => String(l.id) === String(value))
            if (matchedLot) {
              // Auto-fill Item / Unit / Rate / specs from lot (same as Outward form)
              updated.item_id = String(matchedLot.item_id)
              const lotUnitId =
                matchedLot.unit_id ||
                matchedLot.unit?.id ||
                matchedLot.item?.unit_id ||
                matchedLot.item?.unit?.id ||
                ''
              updated.unit_id = lotUnitId ? String(lotUnitId) : ''
              const lotRate = matchedLot.unit_cost ?? matchedLot.purchase_rate
              if (lotRate != null && lotRate !== '') updated.rate = String(lotRate)
              if (matchedLot.oil_pct != null) updated.oil_pct = String(matchedLot.oil_pct)
            }
          } else {
            updated.item_id = ''
            updated.unit_id = ''
            updated.rate = ''
            updated.oil_pct = ''
          }
        }
        if (key === 'item_id' && value) {
          const curLot = lots.find((l) => String(l.id) === String(updated.lot_id))
          if (curLot && String(curLot.item_id) !== String(value)) {
            // Item swapped → lot belongs to another item, reset it
            updated.lot_id = ''
            updated.rate = ''
          }
          const matchedItem = items.find((x) => String(x.id) === String(value))
          if (!updated.unit_id && matchedItem) {
            const defUnitId = matchedItem.unit_id || matchedItem.unit?.id || ''
            if (defUnitId) updated.unit_id = String(defUnitId)
          }
        }
        return updated
      })
    )
  }

  function setOutputField(idx, key, value) {
    setOutputs((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }

  const effectiveLotAvail = (lot) => {
    let qty = Number(lot?.available_qty || 0)
    if (editingBatch && lot) {
      const origInput = editingBatch.inputs?.find((inRow) => String(inRow.lot_id) === String(lot.id))
      if (origInput) {
        qty += Number(origInput.quantity || 0)
      }
    }
    return qty
  }

  const totalInput = inputs.reduce((s, it) => s + Number(it.quantity || 0), 0)
  const totalOutput = outputs.reduce((s, o) => s + Number(o.quantity || 0), 0)
  const totalWastage = Math.max(0, totalInput - totalOutput)

  async function save(e) {
    e.preventDefault()
    const validInputs = inputs.filter((it) => it.lot_id && Number(it.quantity) > 0)
    if (validInputs.length === 0) {
      toast.error('Add at least one input lot with quantity')
      return
    }
    if (!form.branch_id) {
      toast.error('Select the godown — mixing consumes & produces in the same godown')
      return
    }
    const validOutputs = outputs.filter((o) => o.item_id && Number(o.quantity) > 0)
    if (validOutputs.length === 0) {
      toast.error('Add at least one output item with quantity')
      return
    }
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        party_id: form.party_id ? Number(form.party_id) : null,
        source_branch_id: Number(form.branch_id),
        dest_branch_id: Number(form.branch_id),
        output_item_id: Number(validOutputs[0].item_id),
        output_lot_number: validOutputs[0].lot_number || null,
        remarks: form.remarks || null,
        inputs: validInputs.map((it) => ({
          lot_id: Number(it.lot_id),
          item_id: it.item_id ? Number(it.item_id) : null,
          quantity: Number(it.quantity),
          oil_pct: it.oil_pct === '' || it.oil_pct == null ? null : Number(it.oil_pct),
        })),
        outputs: validOutputs.map((o) => ({
          item_id: Number(o.item_id),
          quantity: Number(o.quantity),
          lot_number: o.lot_number || null,
        })),
      }

      if (editingBatch) {
        await api.put(`/production/${editingBatch.id}`, payload)
        toast.success(`Production batch ${editingBatch.batch_number} updated successfully!`)
      } else {
        await api.post('/production', payload)
        toast.success('Production batch created & stock mixed automatically!')
      }
      setModalOpen(false)
      setEditingBatch(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, editingBatch ? 'Failed to update production batch' : 'Failed to create production batch'))
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/production/${deleteTarget.id}`)
      toast.success(`Production batch ${deleteTarget.batch_number} moved to trash successfully!`)
      setDeleteTarget(null)
      if (viewing?.id === deleteTarget.id) setViewing(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete production batch'))
    } finally {
      setDeleting(false)
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

  // Only lots that physically sit in the chosen godown
  const openLots = lots.filter(
    (l) =>
      form.branch_id &&
      String(l.branch_id) === String(form.branch_id) &&
      (effectiveLotAvail(l) > 0 || inputs.some((it) => String(it.lot_id) === String(l.id)))
  )

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
              <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="secondary" onClick={() => openView(r)} title="View Details">
                  <Eye className="h-3 w-3" /> View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEdit(r)}
                  className="border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100"
                  title="Edit Production Batch"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openPdf(`/production/${r.id}/pdf`, `Production_${r.batch_number}.pdf`)}
                  title="Print / Download PDF"
                >
                  <Printer className="h-3 w-3" /> PDF
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteTarget(r)}
                  title="Delete Batch (Move to Trash)"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingBatch(null)
        }}
        title={editingBatch ? `Edit Batch: ${editingBatch.batch_number}` : 'New Production Batch'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingBatch(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} loading={saving} form="prod-form">
              {editingBatch ? 'Update Batch' : 'Save & Mix'}
            </Button>
          </>
        }
      >
        <form id="prod-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
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
            <FormField label="Godown" required hint="Inputs consumed & output produced here">
              <Select
                value={form.branch_id}
                onChange={(e) => {
                  onFormBranchChange(e.target.value)
                  // lots of the old godown are invalid — clear them
                  setInputs((arr) => arr.map((it) => ({ ...it, lot_id: '', item_id: '', unit_id: '', rate: '', oil_pct: '' })))
                }}
                required
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
                    <th className="px-2 py-2 text-left">Item</th>
                    <th className="px-2 py-2 text-left">Unit</th>
                    <th className="px-2 py-2 text-right">Avail</th>
                    <th className="px-2 py-2 text-right">Oil %</th>
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2 text-right">Qty to Consume</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inputs.map((it, idx) => {
                    const matchedLot = lots.find((l) => String(l.id) === String(it.lot_id))
                    const matchedItem = items.find((x) => String(x.id) === String(it.item_id))
                    const lotUnitCode =
                      matchedLot?.unit?.code ||
                      matchedLot?.unit?.name ||
                      matchedItem?.unit?.code ||
                      matchedItem?.unit?.name ||
                      ''
                    const avail = matchedLot ? effectiveLotAvail(matchedLot) : null
                    const rowAmount = Number(it.quantity || 0) * Number(it.rate || 0)
                    return (
                      <tr key={idx} className="align-top">
                        <td className="px-2 py-1.5 min-w-[190px]">
                          <Select
                            value={it.lot_id}
                            onChange={(e) => setInputField(idx, 'lot_id', e.target.value)}
                          >
                            <option value="">Select lot…</option>
                            {openLots.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.lot_number} — {l.item?.name || `#${l.item_id}`} (avail {formatNumber(effectiveLotAvail(l))})
                              </option>
                            ))}
                          </Select>
                          {matchedLot && (
                            <span className="mt-0.5 block text-[10px] text-slate-500">
                              Avail <span className="font-bold text-slate-700">{formatNumber(avail)}</span>
                              {matchedLot.unit_cost ? ` · value ₹${formatNumber(matchedLot.unit_cost)}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 min-w-[130px]">
                          <Select
                            value={it.item_id}
                            onChange={(e) => setInputField(idx, 'item_id', e.target.value)}
                          >
                            <option value="">Select…</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name || i.product_name} {i.code ? `(${i.code})` : ''}
                              </option>
                            ))}
                          </Select>
                          {matchedItem?.material_type && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">{matchedItem.material_type}</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 w-20">
                          <Input
                            value={it.unit_id ? lotUnitCode || `#${it.unit_id}` : lotUnitCode || ''}
                            readOnly
                            placeholder="Unit…"
                            className="!text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5 w-24 text-right font-bold text-slate-700">
                          {matchedLot ? formatNumber(avail) : '—'}
                        </td>
                        <td className="px-2 py-1.5 w-24">
                          <Input
                            type="number"
                            step="0.01"
                            value={it.oil_pct}
                            onChange={(e) => setInputField(idx, 'oil_pct', e.target.value)}
                            className="text-right"
                            placeholder="—"
                          />
                        </td>
                        <td className="px-2 py-1.5 w-24 text-right font-bold text-slate-700">
                          {it.rate ? `₹${formatNumber(it.rate)}` : '—'}
                        </td>
                        <td className="px-2 py-1.5 w-32">
                          <Input
                            type="number"
                            step="0.001"
                            value={it.quantity}
                            onChange={(e) => setInputField(idx, 'quantity', e.target.value)}
                            className="text-right"
                            placeholder="0.000"
                          />
                          {rowAmount > 0 && (
                            <span className="mt-0.5 block text-right text-[10px] text-slate-500">
                              = ₹{formatNumber(rowAmount)}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {inputs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setInputs((f) => f.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Remove input lot"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-3 py-2">
              <span className="text-xs font-bold text-amber-800">
                Output Items (total {formatNumber(totalOutput)})
              </span>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => setOutputs((f) => [...f, emptyOutput()])}
              >
                <Plus className="h-3 w-3" /> Add Output
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-amber-50/60 text-amber-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-2 py-2 text-left">Output Item *</th>
                    <th className="px-2 py-2 text-right">Output Qty *</th>
                    <th className="px-2 py-2 text-left">Output Lot No</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {outputs.map((o, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="px-2 py-1.5 min-w-[200px]">
                        <Select
                          value={o.item_id}
                          onChange={(e) => setOutputField(idx, 'item_id', e.target.value)}
                          required
                        >
                          <option value="">Select…</option>
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name || i.product_name} {i.code ? `(${i.code})` : ''}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-2 py-1.5 w-40">
                        <Input
                          type="number"
                          step="0.001"
                          value={o.quantity}
                          onChange={(e) => setOutputField(idx, 'quantity', e.target.value)}
                          className="text-right"
                          placeholder="0.000"
                          required
                        />
                      </td>
                      <td className="px-2 py-1.5 min-w-[170px]">
                        <Input
                          value={o.lot_number}
                          onChange={(e) => setOutputField(idx, 'lot_number', e.target.value)}
                          placeholder="Auto-generated if blank"
                          className="!font-mono !font-bold"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {outputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setOutputs((f) => f.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Remove output item"
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

          <div className="flex items-center justify-between text-xs px-3 py-2 text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              Total Input: <span className="font-bold text-slate-800">{formatNumber(totalInput)}</span>
            </div>
            <div>
              Output Qty: <span className="font-bold text-slate-800">{formatNumber(totalOutput)}</span>
            </div>
            <div>
              Wastage: <span className="font-bold text-amber-700">{formatNumber(totalWastage)}</span>
            </div>
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
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const target = viewing
                  openEdit(target)
                }}
                className="border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Batch
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDeleteTarget(viewing)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
            <div className="flex gap-2">
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
            </div>
          </div>
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
                <span className="text-slate-500 block text-[11px]">Godown</span>
                <div className="font-bold">{viewing.dest_branch?.branch_name || viewing.source_branch?.branch_name || '—'}</div>
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
                    <th className="px-2 py-1.5 text-left">Item</th>
                    <th className="px-2 py-1.5 text-left">Unit</th>
                    <th className="px-2 py-1.5 text-right">Oil %</th>
                    <th className="px-2 py-1.5 text-right">Rate</th>
                    <th className="px-2 py-1.5 text-right">Amount</th>
                    <th className="px-2 py-1.5 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewing.inputs || []).map((it) => {
                    const rate = Number(it.lot?.unit_cost || 0)
                    const amount = rate * Number(it.quantity || 0)
                    return (
                      <tr key={it.id}>
                        <td className="px-2 py-1.5 font-mono">{it.lot?.lot_number || `#${it.lot_id}`}</td>
                        <td className="px-2 py-1.5">{it.item?.name || '—'}</td>
                        <td className="px-2 py-1.5">{it.lot?.unit?.code || it.item?.unit?.code || '—'}</td>
                        <td className="px-2 py-1.5 text-right">{it.oil_pct ?? it.lot?.oil_pct ?? '—'}</td>
                        <td className="px-2 py-1.5 text-right">{rate ? `₹${formatNumber(rate)}` : '—'}</td>
                        <td className="px-2 py-1.5 text-right">{rate ? `₹${formatNumber(amount)}` : '—'}</td>
                        <td className="px-2 py-1.5 text-right font-bold">{formatNumber(it.quantity)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="mb-1 font-bold text-slate-700">Outputs</h4>
              <table className="w-full border border-slate-200">
                <thead className="bg-amber-50 text-amber-800 uppercase text-[10px]">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Item</th>
                    <th className="px-2 py-1.5 text-left">Lot No</th>
                    <th className="px-2 py-1.5 text-left">Unit</th>
                    <th className="px-2 py-1.5 text-left">Grade</th>
                    <th className="px-2 py-1.5 text-right">Oil %</th>
                    <th className="px-2 py-1.5 text-right">Rate</th>
                    <th className="px-2 py-1.5 text-right">Amount</th>
                    <th className="px-2 py-1.5 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {(viewing.outputs || []).map((o) => {
                    const rate = Number(o.lot?.unit_cost || 0)
                    const amount = rate * Number(o.quantity || 0)
                    return (
                      <tr key={o.id}>
                        <td className="px-2 py-1.5">{o.item?.name || '—'}</td>
                        <td className="px-2 py-1.5 font-mono">{o.lot?.lot_number || o.lot_number || '—'}</td>
                        <td className="px-2 py-1.5">{o.item?.unit?.code || '—'}</td>
                        <td className="px-2 py-1.5">{o.grade?.code || o.grade?.name || '—'}</td>
                        <td className="px-2 py-1.5 text-right">{o.oil_pct ?? o.lot?.oil_pct ?? '—'}</td>
                        <td className="px-2 py-1.5 text-right">{rate ? `₹${formatNumber(rate)}` : '—'}</td>
                        <td className="px-2 py-1.5 text-right">{rate ? `₹${formatNumber(amount)}` : '—'}</td>
                        <td className="px-2 py-1.5 text-right font-bold">{formatNumber(o.quantity)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="mt-2 flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                <span>Input: {formatNumber(viewing.input_total)} → Output: {formatNumber(viewing.output_total)}</span>
                <span className="text-amber-700">Wastage: {formatNumber(viewing.wastage)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Production Batch"
        message={`Are you sure you want to move production batch "${deleteTarget?.batch_number}" to trash? Stock consumed from source lots will be restored, and generated output stock will be removed.`}
        confirmText="Yes, Move to Trash"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
