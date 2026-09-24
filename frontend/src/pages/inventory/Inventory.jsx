import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  DataTable,
  FormField,
  Input,
  PageHeader,
  Select,
  StatusBadge,
} from '../../components'
import { formatNumber, today } from '../../utils/helpers'

function useMasters() {
  const [vendors, setVendors] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])

  useEffect(() => {
    const list = (d) => (Array.isArray(d) ? d : d.data?.data || d.data || [])
    Promise.all([
      api.get('/vendors?per_page=100').catch(() => ({ data: [] })),
      api.get('/vehicles?per_page=100').catch(() => ({ data: [] })),
      api.get('/items?per_page=100').catch(() => ({ data: [] })),
      api.get('/branches?per_page=100').catch(() => ({ data: [] })),
    ]).then(([v, veh, it, br]) => {
      setVendors(list(v.data))
      setVehicles(list(veh.data))
      setItems(list(it.data))
      setBranches(list(br.data))
    })
  }, [])

  return { vendors, vehicles, items, branches }
}

/* ---------------- CURRENT STOCK ---------------- */
export function CurrentStock() {
  const toast = useToast()
  const { branchId } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { branches, items } = useMasters()
  const [selBranch, setSelBranch] = useState('')
  const [selItem, setSelItem] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/stock', {
        params: { branch_id: selBranch || branchId || undefined },
      })
      let data = Array.isArray(res.data) ? res.data : res.data.data || []
      if (selItem) data = data.filter((r) => String(r.item_id) === String(selItem))
      if (search) {
        const q = search.toLowerCase()
        data = data.filter(
          (r) =>
            String(r.item_name || r.item || '').toLowerCase().includes(q) ||
            String(r.item_code || '').toLowerCase().includes(q),
        )
      }
      setRows(data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load stock'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [branchId, selBranch, selItem, search, toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader title="Current Stock" subtitle="Available quantity by item" actions={<Button variant="secondary" onClick={load}>Refresh</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Input placeholder="Search item…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select className="w-44" value={selBranch} onChange={(e) => setSelBranch(e.target.value)}>
          <option value="">Branch (default)</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select className="w-48" value={selItem} onChange={(e) => setSelItem(e.target.value)}>
          <option value="">All items</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </Select>
      </div>
      <DataTable
        loading={loading}
        rows={rows}
        rowKey="item_id"
        emptyTitle="No stock records"
        emptyMessage="Stock appears after stock-in or approved settlement bills."
        columns={[
          { key: 'item_code', label: 'Code' },
          { key: 'item_name', label: 'Item' },
          { key: 'unit', label: 'Unit' },
          { key: 'opening', label: 'Opening', align: 'right', render: (r) => formatNumber(r.opening ?? 0) },
          { key: 'total_in', label: 'In', align: 'right', render: (r) => formatNumber(r.total_in ?? 0) },
          { key: 'total_out', label: 'Out', align: 'right', render: (r) => formatNumber(r.total_out ?? 0) },
          { key: 'available', label: 'Available', align: 'right', render: (r) => formatNumber(r.available ?? 0) },
          { key: 'min_stock_level', label: 'Min', align: 'right', render: (r) => formatNumber(r.min_stock_level ?? 0) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  )
}

/* ---------------- STOCK IN ---------------- */
export function StockIn() {
  const toast = useToast()
  const { user, branchId } = useAuth()
  const { vendors, vehicles, items, branches } = useMasters()
  const [form, setForm] = useState({
    date: today(),
    branch_id: branchId || user?.default_branch_id || '',
    item_id: '',
    quantity: '',
    vehicle_id: '',
    driver_name: '',
    driver_mobile: '',
    vendor_id: '',
    lot_number: '',
    reference_type: 'Manual',
    source_reference: '',
    remarks: '',
  })
  const [saving, setSaving] = useState(false)

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/stock-in', {
        ...form,
        branch_id: Number(form.branch_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
        vendor_id: form.vendor_id ? Number(form.vendor_id) : undefined,
      })
      toast.success('Stock in recorded')
      setForm((f) => ({ ...f, quantity: '', lot_number: '', source_reference: '', remarks: '' }))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Stock in failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Stock In" subtitle="Manual stock receipt" />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
        </FormField>
        <FormField label="Branch" required>
          <Select value={form.branch_id} onChange={(e) => setF('branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Item" required>
          <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)} required>
            <option value="">Select…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity" required>
          <Input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} required />
        </FormField>
        <FormField label="Vehicle">
          <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
            <option value="">Select…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.number}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Vendor">
          <Select value={form.vendor_id} onChange={(e) => setF('vendor_id', e.target.value)}>
            <option value="">Select…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Driver Name">
          <Input value={form.driver_name} onChange={(e) => setF('driver_name', e.target.value)} />
        </FormField>
        <FormField label="Driver Mobile">
          <Input value={form.driver_mobile} onChange={(e) => setF('driver_mobile', e.target.value)} />
        </FormField>
        <FormField label="Lot Number">
          <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
        </FormField>
        <FormField label="Reference Type">
          <Select value={form.reference_type} onChange={(e) => setF('reference_type', e.target.value)}>
            {['Manual', 'Purchase', 'Return', 'Opening Stock', 'Settlement Bill', 'Other'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Reference" className="sm:col-span-2">
          <Input value={form.source_reference} onChange={(e) => setF('source_reference', e.target.value)} />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>Post Stock In</Button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- STOCK OUT ---------------- */
export function StockOut() {
  const toast = useToast()
  const { user, branchId } = useAuth()
  const { vehicles, items, branches } = useMasters()
  const [form, setForm] = useState({
    date: today(),
    branch_id: branchId || user?.default_branch_id || '',
    item_id: '',
    quantity: '',
    vehicle_id: '',
    driver_name: '',
    driver_mobile: '',
    destination: '',
    customer: '',
    lot_number: '',
    remarks: '',
  })
  const [saving, setSaving] = useState(false)

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/stock-out', {
        ...form,
        branch_id: Number(form.branch_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
      })
      toast.success('Stock out recorded')
      setForm((f) => ({ ...f, quantity: '', destination: '', customer: '', remarks: '' }))
    } catch (err) {
      const msg = apiErrorMessage(err, 'Stock out failed')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Stock Out" subtitle="Dispatch stock — fails if insufficient" />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
        </FormField>
        <FormField label="Branch" required>
          <Select value={form.branch_id} onChange={(e) => setF('branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Item" required>
          <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)} required>
            <option value="">Select…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity" required>
          <Input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} required />
        </FormField>
        <FormField label="Vehicle">
          <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
            <option value="">Select…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.number}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Driver Name">
          <Input value={form.driver_name} onChange={(e) => setF('driver_name', e.target.value)} />
        </FormField>
        <FormField label="Driver Mobile">
          <Input value={form.driver_mobile} onChange={(e) => setF('driver_mobile', e.target.value)} />
        </FormField>
        <FormField label="Destination">
          <Input value={form.destination} onChange={(e) => setF('destination', e.target.value)} />
        </FormField>
        <FormField label="Customer">
          <Input value={form.customer} onChange={(e) => setF('customer', e.target.value)} />
        </FormField>
        <FormField label="Lot Number">
          <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>Post Stock Out</Button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- TRANSFER ---------------- */
export function StockTransfer() {
  const toast = useToast()
  const { user, branchId } = useAuth()
  const { vehicles, items, branches } = useMasters()
  const [form, setForm] = useState({
    date: today(),
    from_branch_id: branchId || user?.default_branch_id || '',
    to_branch_id: '',
    item_id: '',
    quantity: '',
    vehicle_id: '',
    driver_name: '',
    driver_mobile: '',
    lot_number: '',
    remarks: '',
  })
  const [saving, setSaving] = useState(false)
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (form.from_branch_id === form.to_branch_id) {
      toast.error('From and To branches must differ')
      return
    }
    setSaving(true)
    try {
      await api.post('/inventory/transfer', {
        ...form,
        from_branch_id: Number(form.from_branch_id),
        to_branch_id: Number(form.to_branch_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
      })
      toast.success('Transfer posted')
      setForm((f) => ({ ...f, quantity: '', remarks: '' }))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Transfer failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Stock Transfer" subtitle="Branch A → Branch B" />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
        </FormField>
        <FormField label="Vehicle">
          <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
            <option value="">Select…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.number}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="From Branch" required>
          <Select value={form.from_branch_id} onChange={(e) => setF('from_branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="To Branch" required>
          <Select value={form.to_branch_id} onChange={(e) => setF('to_branch_id', e.target.value)} required>
            <option value="">Select…</option>
            {branches.filter((b) => String(b.id) !== String(form.from_branch_id)).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Item" required>
          <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)} required>
            <option value="">Select…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity" required>
          <Input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} required />
        </FormField>
        <FormField label="Driver Name">
          <Input value={form.driver_name} onChange={(e) => setF('driver_name', e.target.value)} />
        </FormField>
        <FormField label="Driver Mobile">
          <Input value={form.driver_mobile} onChange={(e) => setF('driver_mobile', e.target.value)} />
        </FormField>
        <FormField label="Lot Number">
          <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
        </FormField>
        <FormField label="Remarks">
          <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>Post Transfer</Button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- LEDGER ---------------- */
export function StockLedger() {
  const toast = useToast()
  const { branchId } = useAuth()
  const { items, branches } = useMasters()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ item_id: '', branch_id: '', date_from: '', date_to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/ledger', {
        params: {
          branch_id: filters.branch_id || branchId || undefined,
          item_id: filters.item_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        },
      })
      setRows(res.data.data || res.data || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load ledger'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [branchId, filters, toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader title="Stock Ledger" subtitle="Traceable movements with opening/closing" actions={<Button variant="secondary" onClick={load}>Refresh</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Select className="w-44" value={filters.branch_id} onChange={(e) => setFilters((f) => ({ ...f, branch_id: e.target.value }))}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select className="w-48" value={filters.item_id} onChange={(e) => setFilters((f) => ({ ...f, item_id: e.target.value }))}>
          <option value="">All items</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </Select>
        <Input type="date" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
        <Input type="date" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
      </div>
      <DataTable
        loading={loading}
        rows={rows}
        emptyTitle="No ledger entries"
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'transaction_number', label: 'Txn #' },
          { key: 'branch', label: 'Branch' },
          { key: 'item', label: 'Item' },
          { key: 'type', label: 'Type' },
          { key: 'opening_balance', label: 'Opening', align: 'right', render: (r) => formatNumber(r.opening_balance) },
          { key: 'stock_in', label: 'In', align: 'right', render: (r) => formatNumber(r.stock_in) },
          { key: 'stock_out', label: 'Out', align: 'right', render: (r) => formatNumber(r.stock_out) },
          { key: 'transfer_in', label: 'T.In', align: 'right', render: (r) => formatNumber(r.transfer_in) },
          { key: 'transfer_out', label: 'T.Out', align: 'right', render: (r) => formatNumber(r.transfer_out) },
          { key: 'adjustment', label: 'Adj', align: 'right', render: (r) => formatNumber(r.adjustment) },
          { key: 'closing_balance', label: 'Closing', align: 'right', render: (r) => formatNumber(r.closing_balance) },
          { key: 'vehicle', label: 'Vehicle' },
          { key: 'lot', label: 'Lot' },
        ]}
      />
    </div>
  )
}

/* ---------------- LOW STOCK ---------------- */
export function LowStock() {
  const toast = useToast()
  const { branchId } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .get('/inventory/low-stock', { params: { branch_id: branchId || undefined } })
      .then((res) => setRows(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch((err) => {
        toast.error(apiErrorMessage(err, 'Failed to load low stock'))
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [branchId, toast])

  return (
    <div>
      <PageHeader title="Low Stock" subtitle="Items at or below minimum level" />
      <DataTable
        loading={loading}
        rows={rows}
        rowKey="item_id"
        emptyTitle="All good"
        emptyMessage="No items are low or out of stock."
        columns={[
          { key: 'item_code', label: 'Code' },
          { key: 'item_name', label: 'Item' },
          { key: 'unit', label: 'Unit' },
          { key: 'available', label: 'Available', align: 'right', render: (r) => formatNumber(r.available) },
          { key: 'min_stock_level', label: 'Min Level', align: 'right', render: (r) => formatNumber(r.min_stock_level) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  )
}
