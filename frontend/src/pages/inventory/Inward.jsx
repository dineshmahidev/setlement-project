import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage, openPdf } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../../components'
import { formatMoney, formatNumber, formatDate, today, extractList, qs } from '../../utils/helpers'
import { Plus, Trash2, RefreshCw, Package, Printer, FileText, Filter, X, Calendar, Edit2 } from 'lucide-react'

function FormField({ label, required, className, children }) {
  return (
    <div className={className || ''}>
      {label && (
        <label className="mb-2 block text-base font-black text-slate-900 tracking-wide">
          {label} {required && <span className="text-red-600 text-lg">*</span>}
        </label>
      )}
      {children}
    </div>
  )
}

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

export default function Inward() {
  const toast = useToast()
  const { branchId, activeCompany } = useAuth()
  const { vendors, items, branches, units } = useMasterData()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [duration, setDuration] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [partyFilter, setPartyFilter] = useState('')

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
    setBranchFilter('')
    setPartyFilter('')
    setSearch('')
  }

  function handleExportPdf() {
    const params = {
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      branch_id: branchFilter || undefined,
      party_id: partyFilter || undefined,
      search: search || undefined,
    }
    const fileSuffix = fromDate && toDate ? `${fromDate}_to_${toDate}` : (fromDate ? `from_${fromDate}` : (toDate ? `to_${toDate}` : 'all'))
    openPdf(`/inward-report-pdf${qs(params)}`, `Inward_Report_${fileSuffix}.pdf`)
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
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
      const res = await api.get(`/inward${qs({
        search: search || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        branch_id: branchFilter || undefined,
        party_id: partyFilter || undefined,
        per_page: 100,
      })}`)
      setRows(extractList(res.data))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load inward entries'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [search, fromDate, toDate, branchFilter, partyFilter, toast])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditingEntry(null)
    setForm({ date: today(), branch_id: branchId || '', party_id: '', load_reference: '', remarks: '' })
    setFormItems([emptyItem()])
    setModalOpen(true)
  }

  async function openEdit(row) {
    try {
      const res = await api.get(`/inward/${row.id}`)
      const data = res.data.data || res.data
      setEditingEntry(data)
      setForm({
        date: data.date ? String(data.date).slice(0, 10) : today(),
        branch_id: data.branch_id ? String(data.branch_id) : '',
        party_id: data.party_id ? String(data.party_id) : '',
        load_reference: data.load_reference || data.bill_no || '',
        remarks: data.remarks || data.notes || '',
      })
      if (data.items && data.items.length > 0) {
        setFormItems(
          data.items.map((it) => ({
            item_id: it.item_id ? String(it.item_id) : '',
            lot_number: it.lot_number || '',
            quantity: it.quantity != null ? String(it.quantity) : '',
            unit_id: it.unit_id ? String(it.unit_id) : '',
            oil_pct: it.oil_pct != null ? String(it.oil_pct) : '',
            rate: it.rate != null ? String(it.rate) : '',
            amount: it.amount != null ? String(it.amount) : '',
          }))
        )
      } else {
        setFormItems([emptyItem()])
      }
      setModalOpen(true)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load inward entry for editing'))
    }
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
      const payload = {
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
          oil_pct: it.oil_pct === '' || it.oil_pct == null ? null : Number(it.oil_pct),
          rate: it.rate === '' || it.rate == null ? null : Number(it.rate),
          amount: it.amount === '' || it.amount == null ? null : Number(it.amount),
        })),
      }

      if (editingEntry) {
        await api.put(`/inward/${editingEntry.id}`, payload)
        toast.success('Inward entry updated & stock adjusted!')
      } else {
        await api.post('/inward', payload)
        toast.success('Inward entry created & stock added to lots automatically!')
      }
      setModalOpen(false)
      setEditingEntry(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, editingEntry ? 'Failed to update inward' : 'Failed to create inward'))
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

      {/* Filter, Duration, and Report PDF Controls */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Filter className="h-4 w-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Filters & Duration</span>
            <span className="text-[11px] font-semibold text-slate-400">({rows.length} records)</span>
          </div>
          <div className="flex items-center gap-2">
            {(fromDate || toDate || branchFilter || partyFilter || search || duration !== 'all') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={resetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportPdf}
              className="border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 text-xs font-bold shadow-xs"
              title="Download / Print Inward Summary Report PDF for selected duration"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-600" /> Get PDF Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 items-end">
          {/* Duration Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Duration</label>
            <Select
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="text-xs font-semibold"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_fy">This Financial Year</option>
              <option value="custom">Custom Range</option>
            </Select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">From Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setDuration('custom')
              }}
              className="text-xs font-semibold"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">To Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setDuration('custom')
              }}
              className="text-xs font-semibold"
            />
          </div>

          {/* Godown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Godown</label>
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs font-semibold"
            >
              <option value="">All Godowns</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>
              ))}
            </Select>
          </div>

          {/* Party */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Party</label>
            <Select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="text-xs font-semibold"
            >
              <option value="">All Parties</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.vendor_name}</option>
              ))}
            </Select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Search</label>
            <Input
              placeholder="Bill / Entry no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      </div>


      <DataTable
        loading={loading}
        rows={rows}
        rowKey="id"
        emptyTitle="No inward entries"
        emptyMessage="Create a multi-item load receipt to start stocking."
        onRowClick={(r) => openView(r)}
        columns={[
          { key: 'entry_number', label: 'Entry No', render: (r) => <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">{r.entry_number}</span> },
          { key: 'load_reference', label: 'Bill No', render: (r) => <span className="font-mono text-[11px] font-semibold text-slate-700">{r.load_reference || '—'}</span> },
          { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
          { key: 'party', label: 'Party', render: (r) => <span className="block max-w-[140px] truncate" title={r.party?.vendor_name || r.party_name || ''}>{r.party?.vendor_name || r.party_name || '—'}</span> },
          { key: 'branch', label: 'Godown', render: (r) => <span className="block max-w-[150px] truncate" title={r.branch?.branch_name || r.branch_name || ''}>{r.branch?.branch_name || r.branch_name || '—'}</span> },
          { key: 'items_count', label: 'Items', render: (r) => (r.items || []).length },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (r) => (
              <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEdit(r)}
                  className="border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100"
                  title="Edit Inward Entry"
                >
                  <Edit2 className="h-3 w-3" /> Edit
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

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEntry(null); }}
        title={
          <span className="text-xl font-black text-[#0b3558]">
            {editingEntry ? `Edit Inward Entry (${editingEntry.entry_number})` : 'New Inward Entry'}
          </span>
        }
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingEntry(null); }} className="text-sm font-bold">Cancel</Button>
            <Button onClick={save} loading={saving} form="inward-form" className="text-base font-black px-6 py-2.5">
              {editingEntry ? 'Update Inward Entry' : 'Save & Add Stock'}
            </Button>
          </>
        }
      >
        <form id="inward-form" onSubmit={save} className="space-y-5 inward-form-2x">
          <style>{`
            .inward-form-2x label { font-size: 15px !important; font-weight: 900 !important; color: #0f172a !important; }
            .inward-form-2x input, .inward-form-2x select, .inward-form-2x textarea { font-size: 15px !important; font-weight: 700 !important; color: #0f172a !important; }
            .inward-form-2x table th { font-size: 13px !important; font-weight: 900 !important; }
            .inward-form-2x table td { font-size: 14px !important; font-weight: 700 !important; }
            .inward-form-2x input::placeholder { font-weight: 500 !important; font-size: 14px !important; }
          `}</style>

          <div className="grid gap-4 sm:grid-cols-4">
            <FormField label="Date" required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="!text-base !font-bold !py-2.5"
              />
            </FormField>
            <FormField label="Godown" required>
              <Select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                required
                className="!text-base !font-bold !py-2.5"
              >
                <option value="">Select…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Party / Supplier">
              <Select
                value={form.party_id}
                onChange={(e) => setForm({ ...form, party_id: e.target.value })}
                className="!text-base !font-bold !py-2.5"
              >
                <option value="">Select…</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
              </Select>
            </FormField>
            <FormField label="Bill No">
              <Input
                value={form.load_reference}
                onChange={(e) => setForm({ ...form, load_reference: e.target.value })}
                placeholder="BILL-001"
                className="!text-base !font-bold !py-2.5 font-mono"
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/90 px-4 py-3">
              <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Items in this load</span>
              <Button size="sm" type="button" variant="secondary" onClick={() => setFormItems((f) => [...f, emptyItem()])} className="text-xs font-bold">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0b3558] text-white uppercase text-xs font-black tracking-wider">
                  <tr>
                    <th className="px-3 py-3 text-left min-w-[170px]">Item</th>
                    <th className="px-3 py-3 text-left min-w-[120px]">Lot No</th>
                    <th className="px-3 py-3 text-right w-28">Qty</th>
                    <th className="px-3 py-3 text-left w-28">Unit</th>
                    <th className="px-3 py-3 text-right w-24">Oil %</th>
                    <th className="px-3 py-3 text-right w-28">Rate</th>
                    <th className="px-3 py-3 text-right w-32">Amount</th>
                    <th className="px-3 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {formItems.map((it, idx) => {
                    const matchedItem = items.find((x) => String(x.id) === String(it.item_id))
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-2 min-w-[170px]">
                          <Select
                            value={it.item_id}
                            onChange={(e) => setItemField(idx, 'item_id', e.target.value)}
                            className="!text-sm !font-bold"
                          >
                            <option value="">Select item…</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name || i.product_name} {i.code ? `(${i.code})` : ''}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-2 min-w-[120px]">
                          <Input
                            value={it.lot_number}
                            onChange={(e) => setItemField(idx, 'lot_number', e.target.value)}
                            placeholder="LOT-1"
                            className="!text-sm !font-bold font-mono"
                          />
                        </td>
                        <td className="px-2 py-2 w-28">
                          <Input
                            type="number"
                            step="0.001"
                            value={it.quantity}
                            onChange={(e) => setItemField(idx, 'quantity', e.target.value)}
                            className="text-right !text-sm !font-bold"
                          />
                        </td>
                        <td className="px-2 py-2 w-28">
                          <Select
                            value={it.unit_id || matchedItem?.unit_id || ''}
                            onChange={(e) => setItemField(idx, 'unit_id', e.target.value)}
                            className="!text-sm !font-bold"
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
                        <td className="px-2 py-2 w-24">
                          <Input
                            type="number"
                            step="0.01"
                            value={it.oil_pct}
                            onChange={(e) => setItemField(idx, 'oil_pct', e.target.value)}
                            className="text-right !text-sm !font-bold"
                          />
                        </td>
                        <td className="px-2 py-2 w-28">
                          <Input
                            type="number"
                            step="0.01"
                            value={it.rate}
                            onChange={(e) => setItemField(idx, 'rate', e.target.value)}
                            className="text-right !text-sm !font-bold"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-black text-sm text-slate-900">
                          {formatNumber(it.amount)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFormItems((f) => f.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-right font-black text-slate-700 text-sm">Grand Total</td>
                    <td className="px-4 py-3 text-right font-black text-[#0B1A2D] text-base">{formatMoney(grandTotal)}</td>
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
              placeholder="Enter narration notes..."
              className="!text-base !font-bold"
            />
          </FormField>
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
                <Button
                  variant="secondary"
                  onClick={() => {
                    const target = viewing
                    setViewing(null)
                    openEdit(target)
                  }}
                  className="border-amber-200 bg-amber-50/70 text-amber-850 hover:bg-amber-100 font-bold"
                  title="Edit this Inward Entry"
                >
                  <Edit2 className="h-4 w-4 mr-1 text-amber-700" /> Edit Entry
                </Button>
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
