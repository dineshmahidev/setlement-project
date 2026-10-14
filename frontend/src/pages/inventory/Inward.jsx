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
import { Plus, Trash2, Eye, RefreshCw, Package, Printer } from 'lucide-react'

function useMasterData() {
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/vendors?per_page=200').catch(() => ({ data: [] })),
      api.get('/items?all=true').catch(() => api.get('/items?per_page=200').catch(() => ({ data: [] }))),
      api.get('/products?all=true').catch(() => api.get('/products?per_page=200').catch(() => ({ data: [] }))),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
      api.get('/units?all=true').catch(() => api.get('/units').catch(() => ({ data: [] }))),
    ]).then(([v, i, p, b, u]) => {
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
      setUnits(extractList(u.data ?? u))
    })
  }, [])

  return { vendors, items, branches, units }
}

const emptyItem = () => ({ item_id: '', lot_number: '', quantity: '', unit_id: '', oil_pct: '', rate: '', amount: '' })

export default function Inward() {
  const toast = useToast()
  const { branchId, activeCompany } = useAuth()
  const { vendors, items, branches, units } = useMasterData()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: today(), branch_id: branchId || '', party_id: '', load_reference: '', remarks: '' })
  const [formItems, setFormItems] = useState([emptyItem()])

  const [viewing, setViewing] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  async function doDelete() {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await api.delete(`/inward/${deleteTarget.id}`)
      toast.success('Inward entry deleted & stock reversed')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Delete failed'))
    } finally {
      setActionLoading(false)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/inward${qs({ status: statusFilter, search, per_page: 100 })}`)
      setRows(extractList(res.data))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load inward entries'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ date: today(), branch_id: branchId || '', party_id: '', load_reference: '', remarks: '' })
    setFormItems([emptyItem()])
    setModalOpen(true)
  }

  function setItemField(idx, key, value) {
    setFormItems((itemsList) => {
      const next = itemsList.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
      const cur = next[idx]
      if (key === 'item_id' && value) {
        const matchedItem = items.find((x) => String(x.id) === String(value))
        if (matchedItem) {
          cur.unit_id = matchedItem.unit_id || matchedItem.unit?.id || ''
        }
      }
      if (key === 'quantity' || key === 'rate') {
        cur.amount = Number(cur.quantity || 0) * Number(cur.rate || 0)
      }
      return next
    })
  }

  const grandTotal = useMemo(() => formItems.reduce((s, it) => s + Number(it.amount || 0), 0), [formItems])

  async function save(e) {
    e.preventDefault()
    const validItems = formItems.filter((it) => it.item_id && Number(it.quantity) > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one item with quantity')
      return
    }
    setSaving(true)
    try {
      await api.post('/inward', {
        date: form.date,
        branch_id: Number(form.branch_id),
        party_id: form.party_id ? Number(form.party_id) : null,
        load_reference: form.load_reference || null,
        remarks: form.remarks || null,
        items: validItems.map((it) => ({
          item_id: Number(it.item_id),
          lot_number: it.lot_number || null,
          quantity: Number(it.quantity),
          unit_id: it.unit_id ? Number(it.unit_id) : null,
          oil_pct: it.oil_pct === '' ? null : Number(it.oil_pct),
          rate: it.rate === '' ? null : Number(it.rate),
          amount: it.amount === '' ? null : Number(it.amount),
        })),
      })
      toast.success('Inward entry created & stock added to lots automatically!')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create inward'))
    } finally {
      setSaving(false)
    }
  }

  async function doConfirm() {
    if (!confirmTarget) return
    setActionLoading(true)
    try {
      await api.post(`/inward/${confirmTarget.id}/confirm`)
      toast.success('Inward confirmed — stock posted to lots')
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
      await api.post(`/inward/${cancelTarget.id}/cancel`, { reason: cancelReason || null })
      toast.success('Inward cancelled — reversal posted')
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
      const res = await api.get(`/inward/${row.id}`)
      setViewing(res.data.data || res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load entry'))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inward (Stock Receipt)"
        subtitle="Multi-item load entry with lot-wise oil% grading"
        icon={Package}
        actions={
          <>
            <Button variant="secondary" onClick={load} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={openCreate}>New Inward</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search bill no / entry no…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
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
        emptyTitle="No inward entries"
        emptyMessage="Create a multi-item load receipt to start stocking."
        columns={[
          { key: 'entry_number', label: 'Entry No', render: (r) => <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">{r.entry_number}</span> },
          { key: 'load_reference', label: 'Bill No', render: (r) => <span className="font-mono text-[11px] font-semibold text-slate-700">{r.load_reference || '—'}</span> },
          { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
          { key: 'party', label: 'Party', render: (r) => <span className="block max-w-[140px] truncate" title={r.party?.vendor_name || r.party_name || ''}>{r.party?.vendor_name || r.party_name || '—'}</span> },
          { key: 'branch', label: 'Godown', render: (r) => <span className="block max-w-[150px] truncate" title={r.branch?.branch_name || r.branch_name || ''}>{r.branch?.branch_name || r.branch_name || '—'}</span> },
          { key: 'items_count', label: 'Items', render: (r) => (r.items || []).length },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
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
                    onClick={() => openPdf(`/inward/${r.id}/pdf`, `${r.entry_number}.pdf`)}
                    title="Print / View PDF"
                  >
                    <Printer className="h-3 w-3" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteTarget(r)}
                    title="Delete Inward Entry"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              ),
            },
        ]}
      />

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Inward Entry"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} form="inward-form">Save & Add Stock</Button>
          </>
        }
      >
        <form id="inward-form" onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <FormField label="Date" required><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></FormField>
            <FormField label="Godown" required>
              <Select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required>
                <option value="">Select…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Party / Supplier">
              <Select value={form.party_id} onChange={(e) => setForm({ ...form, party_id: e.target.value })}>
                <option value="">Select…</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
              </Select>
            </FormField>
            <FormField label="Bill No"><Input value={form.load_reference} onChange={(e) => setForm({ ...form, load_reference: e.target.value })} placeholder="BILL-001" /></FormField>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-bold text-slate-700">Items in this load</span>
              <Button size="sm" type="button" variant="secondary" onClick={() => setFormItems((f) => [...f, emptyItem()])}>
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-2 py-2 text-left">Item</th>
                    <th className="px-2 py-2 text-left">Lot No</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-left w-24">Unit</th>
                    <th className="px-2 py-2 text-right">Oil %</th>
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
                          <Select value={it.item_id} onChange={(e) => setItemField(idx, 'item_id', e.target.value)}>
                            <option value="">Select item…</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name || i.product_name} {i.code ? `(${i.code})` : ''}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-1.5 min-w-[110px]"><Input value={it.lot_number} onChange={(e) => setItemField(idx, 'lot_number', e.target.value)} placeholder="LOT-1" /></td>
                        <td className="px-2 py-1.5 w-24"><Input type="number" step="0.001" value={it.quantity} onChange={(e) => setItemField(idx, 'quantity', e.target.value)} className="text-right" /></td>
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
                        <td className="px-2 py-1.5 w-20"><Input type="number" step="0.01" value={it.oil_pct} onChange={(e) => setItemField(idx, 'oil_pct', e.target.value)} className="text-right" /></td>
                        <td className="px-2 py-1.5 w-24"><Input type="number" step="0.01" value={it.rate} onChange={(e) => setItemField(idx, 'rate', e.target.value)} className="text-right" /></td>
                        <td className="px-2 py-1.5 text-right font-bold text-slate-800">{formatNumber(it.amount)}</td>
                        <td className="px-2 py-1.5 text-center">
                          {formItems.length > 1 && (
                            <button type="button" onClick={() => setFormItems((f) => f.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700 cursor-pointer">
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
                    <td colSpan={6} className="px-2 py-2 text-right text-slate-600">Grand Total</td>
                    <td className="px-2 py-2 text-right text-[#0B1A2D]">{formatMoney(grandTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <FormField label="Narration"><Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Enter narration notes..." /></FormField>
        </form>
      </Modal>

      {/* High-Fidelity PDF-Style Document View Modal */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={`Inward Receipt Document — ${viewing?.entry_number || ''}`}
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
                  onClick={() => openPdf(`/inward/${viewing.id}/pdf`, `${viewing.entry_number}.pdf`)}
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
                    INWARD RECEIPT
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

              {/* Vendor & Receipt Details Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
                {/* Left: Supplier details */}
                <div>
                  <div className="text-[10px] font-bold text-[#0b3558] uppercase tracking-wider mb-1">
                    Supplier / Party Details
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

                {/* Right: Godown & Transport info */}
                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-[#0b3558] uppercase tracking-wider mb-1">
                    Godown & Receipt Details
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Godown / Branch:</span>
                    <span className="font-bold text-slate-800">
                      {viewing.branch?.branch_name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bill / LR Ref:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {viewing.load_reference || '—'}
                    </span>
                  </div>
                  {viewing.vehicle_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vehicle No:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {viewing.vehicle_number}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold uppercase text-slate-700">{viewing.status}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#0b3558] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold w-10">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Item Description</th>
                      <th className="px-3 py-2 text-left font-semibold">Lot Number</th>
                      <th className="px-3 py-2 text-right font-semibold">Quantity</th>
                      <th className="px-3 py-2 text-right font-semibold">Oil %</th>
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
                        <td className="px-3 py-2 font-mono text-slate-700">{it.lot_number || '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {formatNumber(it.quantity)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {it.oil_pct != null ? `${it.oil_pct}%` : '—'}
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
                        Total
                      </td>
                      <td className="px-3 py-2 text-right text-[#0b3558]">
                        {formatNumber(
                          (viewing.items || []).reduce(
                            (sum, it) => sum + (Number(it.quantity) || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td colSpan={2}></td>
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

              {/* Authorized Signatory Block (3 Columns like PDF) */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div className="flex flex-col justify-end">
                  <div className="border-t border-dashed border-slate-400 pt-2 font-semibold text-slate-700">
                    Prepared By
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="border-t border-dashed border-slate-400 pt-2 font-semibold text-slate-700">
                    Verified By / Godown Keeper
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Inward Entry"
        message={`Are you sure you want to delete inward entry ${deleteTarget?.entry_number}? Any created lots and stock will be reversed automatically.`}
        confirmText="Yes, Delete"
        cancelText="No, Keep It"
        variant="danger"
        loading={actionLoading}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Confirm Inward"
        message={`Post stock to lots for ${confirmTarget?.entry_number}? This creates lot-wise stock and cannot be edited.`}
        confirmText="Confirm & Post"
        loading={actionLoading}
        onConfirm={doConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Inward"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>Close</Button>
            <Button variant="danger" onClick={doCancel} loading={actionLoading}>Cancel Entry</Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p>Cancelling <strong>{cancelTarget?.entry_number}</strong> will post a reversal movement. History is preserved.</p>
          <FormField label="Reason"><Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation" /></FormField>
        </div>
      </Modal>
    </div>
  )
}
