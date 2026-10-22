import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { Plus, Trash2, RefreshCw, Truck, Printer, FileText, Filter, X, Calendar, Edit2 } from 'lucide-react'

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
  const [lots, setLots] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/vendors?per_page=200').catch(() => ({ data: [] })),
      api.get('/items?all=true').catch(() => api.get('/items?per_page=200').catch(() => ({ data: [] }))),
      api.get('/branches?per_page=200').catch(() => ({ data: [] })),
      api.get('/lots?per_page=500').catch(() => ({ data: [] })),
      api.get('/units?all=true').catch(() => api.get('/units').catch(() => ({ data: [] }))),
    ]).then(([v, i, b, l, u]) => {
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
      setUnits(extractList(u.data ?? u))
    })
  }, [])

  return { vendors, items, branches, lots, units }
}

const emptyItem = () => ({
  item_id: '',
  lot_id: '',
  quantity: '',
  unit_id: '',
  rate: '',
  amount: '',
  oil_pct: '',
  grade_id: '',
  available_qty: null,
})

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

export default function Outward() {
  const toast = useToast()
  const { branchId, activeCompany } = useAuth()
  const { vendors, items, branches, lots, units } = useMasterData()
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
      branch_id: branchFilter || branchId || undefined,
      party_id: partyFilter || undefined,
      search: search || undefined,
    }
    const fileSuffix = fromDate && toDate ? `${fromDate}_to_${toDate}` : (fromDate ? `from_${fromDate}` : (toDate ? `to_${toDate}` : 'all'))
    openPdf(`/outward-report-pdf${qs(params)}`, `Outward_Report_${fileSuffix}.pdf`)
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: today(),
    branch_id: branchId || '',
    party_id: '',
    bill_no: '',
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
      const res = await api.get(`/outward${qs({
        search: search || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        branch_id: branchFilter || branchId || undefined,
        party_id: partyFilter || undefined,
        per_page: 100,
      })}`)
      setRows(extractList(res.data))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load outward entries'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [search, fromDate, toDate, branchFilter, branchId, partyFilter, toast])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditingEntry(null)
    setForm({
      date: today(),
      branch_id: branchId || '',
      party_id: '',
      bill_no: '',
      destination: '',
      vehicle_number: '',
      remarks: '',
    })
    setFormItems([emptyItem()])
    setModalOpen(true)
  }

  async function openEdit(row) {
    try {
      const res = await api.get(`/outward/${row.id}`)
      const data = res.data.data || res.data
      setEditingEntry(data)
      setForm({
        date: data.date ? String(data.date).slice(0, 10) : today(),
        branch_id: data.branch_id ? String(data.branch_id) : '',
        party_id: data.party_id ? String(data.party_id) : '',
        bill_no: data.bill_no || '',
        destination: data.destination || '',
        vehicle_number: data.vehicle_number || '',
        remarks: data.remarks || data.notes || '',
      })
      if (data.items && data.items.length > 0) {
        setFormItems(
          data.items.map((it) => ({
            item_id: it.item_id ? String(it.item_id) : '',
            lot_id: it.lot_id ? String(it.lot_id) : '',
            quantity: it.quantity != null ? String(it.quantity) : '',
            unit_id: it.unit_id ? String(it.unit_id) : '',
            oil_pct: it.oil_pct != null ? String(it.oil_pct) : '',
            grade_id: it.grade_id ? String(it.grade_id) : '',
            rate: it.rate != null ? String(it.rate) : '',
            amount: it.amount != null ? String(it.amount) : '',
            available_qty: it.lot?.available_qty,
            orig_qty: Number(it.quantity || 0),
          }))
        )
      } else {
        setFormItems([emptyItem()])
      }
      setModalOpen(true)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load outward dispatch for editing'))
    }
  }

  // Deep-link: /inventory/outward?edit={id} opens the entry for editing (used from lot movement actions)
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      openEdit({ id: editId })
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setItemField(idx, key, value) {
    setFormItems((itemsList) => {
      const next = itemsList.map((it, i) => {
        if (i !== idx) return it
        const cur = { ...it, [key]: value }

        if (key === 'lot_id') {
          if (value) {
            const matchedLot = lots.find((l) => String(l.id) === String(value))
            if (matchedLot) {
              // 1. Auto-pick Item / Commodity
              cur.item_id = String(matchedLot.item_id)

              // 2. Auto-pick Unit (fixed during Inward)
              const lotUnitId =
                matchedLot.unit_id ||
                matchedLot.unit?.id ||
                matchedLot.item?.unit_id ||
                matchedLot.item?.unit?.id ||
                ''
              cur.unit_id = lotUnitId ? String(lotUnitId) : ''

              // 3. Auto-pick Rate from Inward unit_cost
              const lotRate = matchedLot.unit_cost ?? matchedLot.purchase_rate
              if (lotRate != null && lotRate !== '') {
                cur.rate = String(lotRate)
              }

              // 4. Auto-pick Available Qty & specs
              cur.available_qty = matchedLot.available_qty
              if (matchedLot.oil_pct != null) cur.oil_pct = matchedLot.oil_pct
              if (matchedLot.grade_id != null) cur.grade_id = matchedLot.grade_id

              // 5. Auto-pick Godown if not set yet
              if (matchedLot.branch_id) {
                setForm((prev) => (prev.branch_id ? prev : { ...prev, branch_id: String(matchedLot.branch_id) }))
              }

              // 6. Recalculate amount if quantity is entered
              if (cur.quantity && cur.rate) {
                cur.amount = Number(cur.quantity || 0) * Number(cur.rate || 0)
              }
            }
          } else {
            cur.available_qty = null
          }
        }

        if (key === 'item_id') {
          const curLot = lots.find((l) => String(l.id) === String(cur.lot_id))
          if (curLot && String(curLot.item_id) !== String(value)) {
            cur.lot_id = ''
            cur.available_qty = null
          }
          const matchedItem = items.find((it) => String(it.id) === String(value))

          const matchingLots = lots.filter(
            (l) =>
              String(l.item_id) === String(value) &&
              (!form.branch_id || String(l.branch_id) === String(form.branch_id)) &&
              Number(l.available_qty) > 0
          )

          if (matchingLots.length === 1) {
            // Auto-select single lot
            const singleLot = matchingLots[0]
            cur.lot_id = String(singleLot.id)
            const lotUnitId =
              singleLot.unit_id ||
              singleLot.unit?.id ||
              matchedItem?.unit_id ||
              matchedItem?.unit?.id ||
              ''
            cur.unit_id = lotUnitId ? String(lotUnitId) : ''
            const lotRate = singleLot.unit_cost ?? singleLot.purchase_rate
            if (lotRate != null && lotRate !== '') {
              cur.rate = String(lotRate)
            }
            cur.available_qty = singleLot.available_qty
            if (singleLot.oil_pct != null) cur.oil_pct = singleLot.oil_pct
            if (singleLot.grade_id != null) cur.grade_id = singleLot.grade_id
            if (singleLot.branch_id) {
              setForm((prev) => (prev.branch_id ? prev : { ...prev, branch_id: String(singleLot.branch_id) }))
            }
          } else if (matchedItem) {
            const defUnitId = matchedItem.unit_id || matchedItem.unit?.id || ''
            cur.unit_id = defUnitId ? String(defUnitId) : ''
          }

          if (cur.quantity && cur.rate) {
            cur.amount = Number(cur.quantity || 0) * Number(cur.rate || 0)
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

  // Show available lots for selected item — strictly the chosen godown's lots only
  const availableLotsFor = (itemId, currentLotId) =>
    lots.filter(
      (l) =>
        (!itemId || String(l.item_id) === String(itemId)) &&
        form.branch_id &&
        String(l.branch_id) === String(form.branch_id) &&
        (Number(l.available_qty) > 0 || (currentLotId && String(l.id) === String(currentLotId)))
    )

  const grandTotal = useMemo(
    () => formItems.reduce((s, it) => s + Number(it.amount || 0), 0),
    [formItems]
  )

  async function save(e) {
    e.preventDefault()
    if (!form.branch_id) {
      toast.error('Select a godown for this entry — "All Godowns" is only a view filter, a dispatch must go out of one specific godown.')
      return
    }
    const preparedItems = formItems.map((it) => {
      let itemId = it.item_id
      let unitId = it.unit_id
      let rate = it.rate
      let oilPct = it.oil_pct
      let gradeId = it.grade_id

      if (it.lot_id) {
        const foundLot = lots.find((l) => String(l.id) === String(it.lot_id))
        if (foundLot) {
          if (!itemId) itemId = foundLot.item_id
          if (!unitId) unitId = foundLot.unit_id || foundLot.unit?.id
          if (rate === '' || rate == null) rate = foundLot.unit_cost ?? foundLot.purchase_rate
          if (oilPct === '' || oilPct == null) oilPct = foundLot.oil_pct
          if (gradeId === '' || gradeId == null) gradeId = foundLot.grade_id
        }
      }
      return {
        ...it,
        item_id: itemId,
        unit_id: unitId,
        rate,
        oil_pct: oilPct,
        grade_id: gradeId,
      }
    })

    const validItems = preparedItems.filter((it) => it.item_id && Number(it.quantity) > 0)
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
        bill_no: form.bill_no || null,
        destination: form.destination || null,
        vehicle_number: form.vehicle_number || null,
        remarks: form.remarks || null,
        items: validItems.map((it) => ({
          item_id: Number(it.item_id),
          lot_id: it.lot_id ? Number(it.lot_id) : null,
          quantity: Number(it.quantity),
          unit_id: it.unit_id ? Number(it.unit_id) : null,
          oil_pct: it.oil_pct === '' || it.oil_pct == null ? null : Number(it.oil_pct),
          grade_id: it.grade_id ? Number(it.grade_id) : null,
          rate: it.rate === '' || it.rate == null ? null : Number(it.rate),
          amount: it.amount === '' || it.amount == null ? null : Number(it.amount),
        })),
      }

      if (editingEntry) {
        await api.put(`/outward/${editingEntry.id}`, payload)
        toast.success('Dispatch entry updated & stock adjusted!')
      } else {
        await api.post('/outward', {
          ...payload,
          dispatch_type: 'DIRECT',
        })
        toast.success('Dispatch created & stock deducted automatically!')
      }
      setModalOpen(false)
      setEditingEntry(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, editingEntry ? 'Failed to update dispatch' : 'Failed to create outward dispatch'))
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await api.delete(`/outward/${deleteTarget.id}`)
      toast.success('Outward entry moved to trash')
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
              title="Download / Print Outward Summary Report PDF for selected duration"
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
              <option value="">{branchId ? 'As per godown switch' : 'All Godowns'}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>
              ))}
            </Select>
          </div>

          {/* Party */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Party / Customer</label>
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
              placeholder="Entry / Bill / Vehicle…"
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
        emptyTitle="No dispatch entries"
        emptyMessage="Create a dispatch to ship stock out of a godown."
        onRowClick={(r) => openView(r)}
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
              <div>
                <span className="font-mono text-[11px] font-bold text-[#0B1A2D]">
                  {r.entry_number}
                </span>
                {r.bill_no && (
                  <span className="block font-mono text-[10px] text-slate-500">
                    Bill: {r.bill_no}
                  </span>
                )}
              </div>
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
                  title="Edit Dispatch"
                >
                  <Edit2 className="h-3 w-3" /> Edit
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

      {/* Create / Edit Dispatch Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEntry(null); }}
        title={
          <span className="text-xl font-black text-[#0b3558]">
            {editingEntry ? `Edit Outward / Dispatch (${editingEntry.entry_number})` : 'New Outward / Dispatch'}
          </span>
        }
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingEntry(null); }} className="text-sm font-bold">
              Cancel
            </Button>
            <Button onClick={save} loading={saving} form="outward-form" className="text-base font-black px-6 py-2.5">
              {editingEntry ? 'Update Dispatch' : 'Save & Dispatch'}
            </Button>
          </>
        }
      >
        <form id="outward-form" onSubmit={save} className="space-y-5 outward-form-2x">
          <style>{`
            .outward-form-2x label { font-size: 15px !important; font-weight: 900 !important; color: #0f172a !important; }
            .outward-form-2x input, .outward-form-2x select, .outward-form-2x textarea { font-size: 15px !important; font-weight: 700 !important; color: #0f172a !important; }
            .outward-form-2x table th { font-size: 13px !important; font-weight: 900 !important; }
            .outward-form-2x table td { font-size: 14px !important; font-weight: 700 !important; }
            .outward-form-2x input::placeholder { font-weight: 500 !important; font-size: 14px !important; }
          `}</style>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Party / Customer" required>
              <Select
                value={form.party_id}
                onChange={(e) => {
                  const val = e.target.value
                  const matchedVendor = vendors.find((v) => String(v.id) === String(val))
                  setForm((prev) => ({
                    ...prev,
                    party_id: val,
                    destination:
                      prev.destination ||
                      [matchedVendor?.city, matchedVendor?.district, matchedVendor?.state].filter(Boolean).join(', ') ||
                      matchedVendor?.address ||
                      '',
                  }))
                }}
                required
                className="!text-base !font-bold !py-2.5"
              >
                <option value="">Select party…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} {v.city ? `(${v.city})` : ''}
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
                className="!text-base !font-bold !py-2.5"
              />
            </FormField>

            <FormField label="Godown" required>
              <Select
                value={form.branch_id}
                onChange={(e) => {
                  const bid = e.target.value
                  setForm({ ...form, branch_id: bid })
                  // lots picked from another godown are invalid — drop them
                  setFormItems((itemsList) =>
                    itemsList.map((it) => {
                      if (!it.lot_id) return it
                      const lot = lots.find((l) => String(l.id) === String(it.lot_id))
                      if (lot && String(lot.branch_id) === String(bid)) return it
                      return { ...it, lot_id: '' }
                    }),
                  )
                }}
                required
                className="!text-base !font-bold !py-2.5"
              >
                <option value="">Select godown…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name || b.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Bill No / Inv Ref">
              <Input
                value={form.bill_no}
                onChange={(e) => setForm({ ...form, bill_no: e.target.value })}
                placeholder="e.g. BILL-2026-001"
                className="!text-base !font-bold !py-2.5 font-mono"
              />
            </FormField>

            <FormField label="Destination">
              <Input
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Destination / customer location"
                className="!text-base !font-bold !py-2.5"
              />
            </FormField>

            <FormField label="Vehicle No">
              <Input
                value={form.vehicle_number}
                onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                placeholder="TN 01 AB 1234"
                className="!text-base !font-bold !py-2.5 font-mono"
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/90 px-4 py-3">
              <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Items Dispatched</span>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => setFormItems((f) => [...f, emptyItem()])}
                className="text-xs font-bold"
              >
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0b3558] text-white uppercase text-xs font-black tracking-wider">
                  <tr>
                    <th className="px-3 py-3 text-left min-w-[170px]">Item / Commodity</th>
                    <th className="px-3 py-3 text-left min-w-[210px]">Lot No</th>
                    <th className="px-3 py-3 text-right w-28">Qty</th>
                    <th className="px-3 py-3 text-left w-32">Unit</th>
                    <th className="px-3 py-3 text-right w-24">Oil %</th>
                    <th className="px-3 py-3 text-right w-28">Rate (₹)</th>
                    <th className="px-3 py-3 text-right w-32">Amount</th>
                    <th className="px-3 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {formItems.map((it, idx) => {
                    const matchedItem = items.find((x) => String(x.id) === String(it.item_id))
                    const matchedLot = lots.find((x) => String(x.id) === String(it.lot_id))
                    const lotUnit = matchedLot?.unit || units.find((u) => String(u.id) === String(matchedLot?.unit_id))
                    const itemUnit = matchedItem?.unit || units.find((u) => String(u.id) === String(matchedItem?.unit_id))
                    const displayUnit = lotUnit || itemUnit
                    const availLots = availableLotsFor(it.item_id, it.lot_id)
                    const isUnitFromLot = Boolean(matchedLot && String(it.unit_id) === String(matchedLot.unit_id))
                    const effectiveLotAvail = (l) => {
                      let qty = Number(l?.available_qty || 0)
                      if (editingEntry && String(l?.id) === String(it.lot_id) && it.orig_qty) {
                        qty += Number(it.orig_qty)
                      }
                      return qty
                    }

                    return (
                      <tr key={idx} className="align-top">
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
                          {matchedItem?.material_type && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {matchedItem.material_type}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 min-w-[210px]">
                          <Select
                            value={it.lot_id}
                            onChange={(e) => setItemField(idx, 'lot_id', e.target.value)}
                            className="!text-sm !font-bold"
                          >
                            <option value="">Select lot…</option>
                            {availLots.map((l) => {
                              const uCode = l.unit?.code || l.unit?.name || l.item?.unit?.code || ''
                              return (
                                <option key={l.id} value={l.id}>
                                  {l.lot_number} (Avail: {formatNumber(effectiveLotAvail(l))} {uCode}{l.unit_cost ? ` @ ₹${formatNumber(l.unit_cost)}` : ''})
                                </option>
                              )
                            })}
                          </Select>
                          {matchedLot && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Avail: {formatNumber(effectiveLotAvail(matchedLot))} {lotUnit?.code || itemUnit?.code || ''}
                              </span>
                              {Number(it.quantity) > effectiveLotAvail(matchedLot) && (
                                <span className="font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                                  Exceeds stock!
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 w-28">
                          <Input
                            type="number"
                            step="0.001"
                            value={it.quantity}
                            onChange={(e) => setItemField(idx, 'quantity', e.target.value)}
                            className="text-right !text-sm !font-bold"
                            placeholder="0.000"
                          />
                        </td>
                        <td className="px-2 py-2 w-32">
                          <Select
                            value={it.unit_id || ''}
                            onChange={(e) => setItemField(idx, 'unit_id', e.target.value)}
                            className={`!text-sm !font-bold ${isUnitFromLot ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-semibold' : ''}`}
                          >
                            <option value="">
                              {displayUnit?.code || displayUnit?.name || 'Unit…'}
                            </option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.code || u.name}
                              </option>
                            ))}
                          </Select>
                          {isUnitFromLot && (
                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5" title="Auto-picked from Inward Lot">
                              ✓ Auto from Lot
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 w-24">
                          <Input
                            type="number"
                            step="0.01"
                            value={it.oil_pct ?? ''}
                            onChange={(e) => setItemField(idx, 'oil_pct', e.target.value)}
                            className="text-right !text-sm !font-bold"
                            placeholder="0.00"
                          />
                          {matchedLot?.oil_pct != null && String(it.oil_pct) === String(matchedLot.oil_pct) && (
                            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5 text-right" title="Auto-picked from Inward Lot">
                              ✓ {matchedLot.oil_pct}%
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 w-28">
                          <Input
                            type="number"
                            step="0.01"
                            value={it.rate}
                            onChange={(e) => setItemField(idx, 'rate', e.target.value)}
                            className="text-right !text-sm !font-bold"
                            placeholder="0.00"
                          />
                          {matchedLot?.unit_cost != null && (
                            <span className="text-[10px] text-slate-500 block mt-0.5 text-right font-mono" title="Unit cost from inward lot">
                              Lot: ₹{formatNumber(matchedLot.unit_cost)}
                            </span>
                          )}
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
                              title="Remove item"
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
                    <td colSpan={6} className="px-4 py-3 text-right font-black text-slate-700 text-sm">
                      Grand Total
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#0B1A2D] text-base">
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
              className="!text-base !font-bold"
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
                <Button
                  variant="secondary"
                  onClick={() => {
                    const target = viewing
                    setViewing(null)
                    openEdit(target)
                  }}
                  className="border-amber-200 bg-amber-50/70 text-amber-850 hover:bg-amber-100 font-bold"
                  title="Edit this Outward Dispatch"
                >
                  <Edit2 className="h-4 w-4 mr-1 text-amber-700" /> Edit Dispatch
                </Button>
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
                  {viewing.bill_no && (
                    <div className="text-xs text-[#0b3558] font-mono font-bold">
                      Bill No: {viewing.bill_no}
                    </div>
                  )}
                  <div className="text-xs text-slate-600">
                    Date: <span className="font-semibold">{formatDate(viewing.date)}</span>
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
                    <span className="text-slate-500">Bill / Inv No:</span>
                    <span className="font-mono font-bold text-[#0b3558]">
                      {viewing.bill_no || '—'}
                    </span>
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
                        <td className="px-3 py-2 font-mono text-slate-700">
                          {it.lot?.lot_number || (it.lot_number ? `#${it.lot_number}` : '—')}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {formatNumber(it.quantity)}{' '}
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                            {it.unit?.code || it.item?.unit?.code || 'MT'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-amber-900">
                          {it.oil_pct != null ? `${formatNumber(it.oil_pct)}%` : '—'}
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
                      <td colSpan={4} className="px-3 py-2 text-right text-slate-700 uppercase tracking-wider">
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
        message={`Are you sure you want to move dispatch entry ${deleteTarget?.entry_number} to trash? It will be hidden from lists and reports. You can restore it from Trash later.`}
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
