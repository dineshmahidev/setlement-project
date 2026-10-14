import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage, openPdf } from '../../services/api'
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
import { formatMoney, formatNumber, formatDate, today, extractList, qs } from '../../utils/helpers'
import { Plus, Trash2, Eye, RefreshCw, Truck, Printer } from 'lucide-react'

function useMasterData() {
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [lots, setLots] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/vendors?per_page=200').catch(() => ({ data: [] })),
      api.get('/items?all=true').catch(() => api.get('/items?per_page=200').catch(() => ({ data: [] }))),
      api.get('/products?all=true').catch(() => api.get('/products?per_page=200').catch(() => ({ data: [] }))),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
      api.get('/lots?per_page=500&status=OPEN').catch(() => ({ data: [] })),
      api.get('/units?all=true').catch(() => api.get('/units').catch(() => ({ data: [] }))),
    ]).then(([v, i, p, b, l, u]) => {
      setVendors(extractList(v.data ?? v))

      const rawItems = extractList(i.data ?? i)
      const rawProducts = extractList(p.data ?? p)

      // Ensure all master items and products are accessible
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
      setUnits(extractList(u.data ?? u))
    })
  }, [])

  return { vendors, items, branches, lots, units }
}

const emptyItem = () => ({ item_id: '', lot_id: '', quantity: '', unit_id: '', rate: '', amount: '' })

export default function Outward() {
  const toast = useToast()
  const { branchId, activeCompany } = useAuth()
  const { vendors, items, branches, lots, units } = useMasterData()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: today(),
    branch_id: branchId || '',
    party_id: '',
    destination: '',
    vehicle_number: '',
    remarks: '',
  })
  const [formItems, setFormItems] = useState([emptyItem()])

  const [viewing, setViewing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

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

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setForm({
      date: today(),
      branch_id: branchId || '',
      party_id: '',
      destination: '',
      vehicle_number: '',
      remarks: '',
    })
    setFormItems([emptyItem()])
    setModalOpen(true)
  }

  function setItemField(idx, key, value) {
    setFormItems((itemsList) => {
      const next = itemsList.map((it, i) => {
        if (i !== idx) return it
        const cur = { ...it, [key]: value }

        if (key === 'lot_id' && value) {
          const matchedLot = lots.find((l) => String(l.id) === String(value))
          if (matchedLot) {
            cur.item_id = matchedLot.item_id
            if (!cur.rate && matchedLot.purchase_rate) {
              cur.rate = matchedLot.purchase_rate
            }
          }
        }

        if (key === 'item_id' && value) {
          const curLot = lots.find((l) => String(l.id) === String(cur.lot_id))
          if (curLot && String(curLot.item_id) !== String(value)) {
            cur.lot_id = ''
          }
          const matchedItem = items.find((it) => String(it.id) === String(value))
          if (matchedItem) {
            cur.unit_id = matchedItem.unit_id || matchedItem.unit?.id || ''
          }
          const matchingLots = lots.filter(
            (l) => String(l.item_id) === String(value) && Number(l.available_qty) > 0
          )
          if (matchingLots.length === 1) {
            cur.lot_id = matchingLots[0].id
            if (!cur.rate && matchingLots[0].purchase_rate) {
              cur.rate = matchingLots[0].purchase_rate
            }
          }
        }

        if (key === 'quantity' || key === 'rate') {
          cur.amount = Number(cur.quantity || 0) * Number(cur.rate || 0)
        }
        return cur
      })
      return next
    })
  }

  // Show available lots for selected item with available qty
  const availableLotsFor = (itemId) =>
    lots.filter((l) => (!itemId || String(l.item_id) === String(itemId)) && Number(l.available_qty) > 0)

  const grandTotal = useMemo(
    () => formItems.reduce((s, it) => s + Number(it.amount || 0), 0),
    [formItems]
  )

  async function save(e) {
    e.preventDefault()
    const preparedItems = formItems.map((it) => {
      let itemId = it.item_id
      if (!itemId && it.lot_id) {
        const foundLot = lots.find((l) => String(l.id) === String(it.lot_id))
        if (foundLot) itemId = foundLot.item_id
      }
      return { ...it, item_id: itemId }
    })

    const validItems = preparedItems.filter((it) => it.item_id && Number(it.quantity) > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one item with quantity')
      return
    }

    setSaving(true)
    try {
      await api.post('/outward', {
        date: form.date,
        branch_id: Number(form.branch_id),
        party_id: form.party_id ? Number(form.party_id) : null,
        dispatch_type: 'DIRECT',
        destination: form.destination || null,
        vehicle_number: form.vehicle_number || null,
        remarks: form.remarks || null,
        items: validItems.map((it) => ({
          item_id: Number(it.item_id),
          lot_id: it.lot_id ? Number(it.lot_id) : null,
          quantity: Number(it.quantity),
          unit_id: it.unit_id ? Number(it.unit_id) : null,
          rate: it.rate === '' || it.rate == null ? null : Number(it.rate),
          amount: it.amount === '' || it.amount == null ? null : Number(it.amount),
        })),
      })
      toast.success('Dispatch created & stock deducted automatically!')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create outward dispatch'))
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await api.delete(`/outward/${deleteTarget.id}`)
      toast.success('Dispatch entry deleted & stock restored')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Delete failed'))
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
        subtitle="Stock dispatch to customers and parties with instant inventory deduction"
        icon={Truck}
        actions={
          <>
            <Button variant="secondary" onClick={load} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={openCreate}>New Dispatch</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search entry no / destination…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="max-w-[160px]"
        >
          <option value="">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="DRAFT">Draft</option>
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
          {
            key: 'party',
            label: 'Party / Customer',
            render: (r) => (
              <span className="block max-w-[170px] truncate font-bold text-slate-900" title={r.party?.vendor_name || ''}>
                {r.party?.vendor_name || '—'}
              </span>
            ),
          },
          {
            key: 'entry_number',
            label: 'Entry No',
            render: (r) => (
              <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">
                {r.entry_number}
              </span>
            ),
          },
          { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
          {
            key: 'branch',
            label: 'Godown',
            render: (r) => r.branch?.branch_name || r.branch?.name || '—',
          },
          {
            key: 'destination',
            label: 'Destination',
            render: (r) => (
              <span className="block max-w-[130px] truncate" title={r.destination || ''}>
                {r.destination || '—'}
              </span>
            ),
          },
          {
            key: 'vehicle_number',
            label: 'Vehicle No',
            render: (r) => r.vehicle_number || '—',
          },
          {
            key: 'items_count',
            label: 'Items',
            render: (r) => (r.items || []).length,
          },
          {
            key: 'total_amount',
            label: 'Total',
            align: 'right',
            render: (r) => formatMoney(r.total_amount),
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
                  onClick={() => openPdf(`/outward/${r.id}/pdf`, `Outward_${r.entry_number}.pdf`)}
                  title="Print / Download PDF"
                >
                  <Printer className="h-3 w-3" /> PDF
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(r)} title="Delete entry">
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* New Dispatch Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Dispatch"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} form="outward-form">
              Save & Dispatch
            </Button>
          </>
        }
      >
        <form id="outward-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Party / Customer" required>
              <Select
                value={form.party_id}
                onChange={(e) => setForm({ ...form, party_id: e.target.value })}
                required
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

            <FormField label="Godown" required>
              <Select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                required
              >
                <option value="">Select godown…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name || b.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Destination">
              <Input
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Destination / customer location"
              />
            </FormField>

            <FormField label="Vehicle No">
              <Input
                value={form.vehicle_number}
                onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                placeholder="TN 01 AB 1234"
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-bold text-slate-700">Items Dispatched</span>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => setFormItems((f) => [...f, emptyItem()])}
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-2 py-2 text-left">Item</th>
                    <th className="px-2 py-2 text-left">Lot</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-left w-24">Unit</th>
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formItems.map((it, idx) => {
                    const matchedItem = items.find((x) => String(x.id) === String(it.item_id))
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-1.5 min-w-[160px]">
                          <Select
                            value={it.item_id}
                            onChange={(e) => setItemField(idx, 'item_id', e.target.value)}
                          >
                            <option value="">Select item…</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name || i.product_name} {i.code ? `(${i.code})` : ''}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-1.5 min-w-[140px]">
                          <Select
                            value={it.lot_id}
                            onChange={(e) => setItemField(idx, 'lot_id', e.target.value)}
                          >
                            <option value="">Select lot…</option>
                            {availableLotsFor(it.item_id).map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.lot_number} (avail {formatNumber(l.available_qty)})
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-1.5 w-24">
                          <Input
                            type="number"
                            step="0.001"
                            value={it.quantity}
                            onChange={(e) => setItemField(idx, 'quantity', e.target.value)}
                            className="text-right"
                            placeholder="0.000"
                          />
                        </td>
                        <td className="px-2 py-1.5 w-24">
                          <Select
                            value={it.unit_id || matchedItem?.unit_id || ''}
                            onChange={(e) => setItemField(idx, 'unit_id', e.target.value)}
                          >
                            <option value="">
                              {matchedItem?.unit?.code || matchedItem?.unit?.name || 'Unit…'}
                            </option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.code || u.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-1.5 w-24">
                          <Input
                            type="number"
                            step="0.01"
                            value={it.rate}
                            onChange={(e) => setItemField(idx, 'rate', e.target.value)}
                            className="text-right"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-bold text-slate-800">
                          {formatNumber(it.amount)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFormItems((f) => f.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={5} className="px-2 py-2 text-right text-slate-600">
                      Grand Total
                    </td>
                    <td className="px-2 py-2 text-right text-[#0B1A2D]">
                      {formatMoney(grandTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <FormField label="Narration">
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Narration / notes"
            />
          </FormField>
        </form>
      </Modal>

      {/* High-Fidelity PDF-Style Document View Modal */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={`Delivery Challan Document — ${viewing?.entry_number || ''}`}
        size="xl"
        footer={
          viewing && (
            <div className="flex w-full justify-between items-center">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Official Document Preview (Matches Printed PDF Challan)
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setViewing(null)}>
                  Close
                </Button>
                <Button
                  onClick={() =>
                    openPdf(`/outward/${viewing?.id}/pdf`, `Outward_${viewing?.entry_number}.pdf`)
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Printer className="h-4 w-4" /> Download / Print PDF
                </Button>
              </div>
            </div>
          )
        }
      >
        {viewing && (
          <div className="bg-slate-100/70 p-2 sm:p-5 rounded-xl border border-slate-200">
            {/* White Paper Canvas */}
            <div className="bg-white shadow-md border border-slate-300 rounded-lg p-5 sm:p-8 space-y-6 max-w-4xl mx-auto font-sans text-slate-800">
              {/* Header: Company Profile + Document Title Badge */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#0b3558] pb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      activeCompany?.logo_transparent_path ||
                      activeCompany?.logo_path ||
                      '/logos/laxmi_traders_transparent.png'
                    }
                    alt="Company Logo"
                    className="h-14 w-14 object-contain shrink-0"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-[#0b3558] tracking-tight">
                      {activeCompany?.company_name || 'LAXMI TRADERS'}
                    </h1>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                      {activeCompany?.address ? `${activeCompany.address}, ` : ''}
                      {activeCompany?.city || 'Kangeyam'}{' '}
                      {activeCompany?.state ? `— ${activeCompany.state}` : ''}{' '}
                      {activeCompany?.pincode ? `(${activeCompany.pincode})` : ''}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <strong>GSTIN:</strong>{' '}
                      <span className="font-mono">{activeCompany?.gstin || '—'}</span> &bull;{' '}
                      <strong>Phone:</strong> {activeCompany?.phone || '—'}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:self-center shrink-0 border sm:border-0 p-2 sm:p-0 rounded bg-slate-50 sm:bg-transparent w-full sm:w-auto">
                  <div className="inline-block bg-[#0b3558] text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-1">
                    DELIVERY CHALLAN / DISPATCH
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-800">
                    {viewing.entry_number}
                  </div>
                  <div className="text-xs text-slate-600">
                    Date: <span className="font-semibold">{formatDate(viewing.date)}</span>
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={viewing.status} />
                  </div>
                </div>
              </div>

              {/* Party & Transport Details Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
                {/* Left: Consignee / Party details */}
                <div>
                  <div className="text-[10px] font-bold text-[#0b3558] uppercase tracking-wider mb-1">
                    Customer / Consignee Details
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {viewing.party?.vendor_name || '—'}
                  </div>
                  {viewing.party?.address && (
                    <div className="text-slate-600 mt-0.5">{viewing.party.address}</div>
                  )}
                  <div className="text-slate-600">
                    {viewing.party?.city} {viewing.party?.state ? `, ${viewing.party.state}` : ''}
                  </div>
                  <div className="mt-1 text-slate-700">
                    <strong>GSTIN:</strong>{' '}
                    <span className="font-mono font-medium">{viewing.party?.gstin || '—'}</span>
                  </div>
                  {viewing.party?.phone && (
                    <div className="text-slate-700">
                      <strong>Phone:</strong> {viewing.party.phone}
                    </div>
                  )}
                </div>

                {/* Right: Dispatch / Transport Details */}
                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-[#0b3558] uppercase tracking-wider mb-1">
                    Dispatch & Transport Details
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dispatch Godown:</span>
                    <span className="font-bold text-slate-800">
                      {viewing.branch?.branch_name || viewing.branch?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-bold text-slate-800">{viewing.destination || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle No:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {viewing.vehicle_number || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold uppercase text-slate-700">{viewing.status}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-300 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#0b3558] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold w-10">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Item Description</th>
                      <th className="px-3 py-2 text-left font-semibold">Lot Number</th>
                      <th className="px-3 py-2 text-right font-semibold">Quantity</th>
                      <th className="px-3 py-2 text-right font-semibold">Rate (₹)</th>
                      <th className="px-3 py-2 text-right font-semibold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(viewing.items || []).map((it, idx) => (
                      <tr key={it.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                        <td className="px-3 py-2 text-slate-500 font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {it.item?.name || `#${it.item_id}`}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-700">
                          {it.lot?.lot_number || (it.lot_number ? `#${it.lot_number}` : '—')}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {formatNumber(it.quantity)}{' '}
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                            {it.unit?.code || it.item?.unit?.code || 'MT'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {it.rate != null ? formatMoney(it.rate) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {formatMoney(it.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-slate-700 uppercase tracking-wider">
                        Grand Total
                      </td>
                      <td className="px-3 py-2 text-right text-[#0b3558]">
                        {formatNumber(
                          (viewing.items || []).reduce(
                            (sum, it) => sum + (Number(it.quantity) || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td></td>
                      <td className="px-3 py-2 text-right text-[#0b3558]">
                        {formatMoney(
                          (viewing.items || []).reduce(
                            (sum, it) => sum + (Number(it.amount) || 0),
                            0,
                          ) || viewing.total_amount,
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Remarks / Narration Box */}
              {(viewing.remarks || viewing.notes) && (
                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Narration / Remarks:</span>{' '}
                  {viewing.remarks || viewing.notes}
                </div>
              )}

              {/* Signatures Block (3 Columns like PDF) */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div className="flex flex-col justify-end">
                  <div className="border-t border-dashed border-slate-400 pt-2 font-semibold text-slate-700">
                    Prepared By
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="border-t border-dashed border-slate-400 pt-2 font-semibold text-slate-700">
                    Receiver's Signature
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end">
                  {/* Digital Signature Image */}
                  <div className="min-h-[44px] flex items-end justify-center mb-1">
                    <img
                      src={activeCompany?.signature_path || '/signatures/laxmi_signature.png'}
                      alt="Authorized Digital Signature"
                      className="max-h-12 max-w-[140px] object-contain"
                    />
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-2 w-full font-bold text-[#0b3558]">
                    For {activeCompany?.company_name || 'LAXMI TRADERS'}
                    <div className="text-[10px] font-normal text-slate-500">
                      ({activeCompany?.authorized_signatory_title || 'Authorized Signatory'})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Alert Box (Yes / No) */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Dispatch Entry"
        message={`Are you sure you want to delete dispatch entry ${deleteTarget?.entry_number}? Any deducted stock will be reversed and restored to lots automatically.`}
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        variant="danger"
        loading={actionLoading}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
