import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  Button,
  DataTable,
  FormField,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
} from '../../components'
import { formatNumber, today } from '../../utils/helpers'

export default function VehicleMovements() {
  const toast = useToast()
  const { can, branchId } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [search, setSearch] = useState('')

  const [vehicles, setVehicles] = useState([])
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: today(),
    vehicle_id: '',
    driver_name: '',
    driver_mobile: '',
    branch_id: branchId || '',
    transaction_type: 'MANUAL',
    vendor_id: '',
    customer: '',
    item_id: '',
    quantity: '',
    lot_number: '',
    reference_number: '',
    remarks: '',
  })

  useEffect(() => {
    const list = (d) => (Array.isArray(d) ? d : d.data?.data || d.data || [])
    Promise.all([
      api.get('/vehicles?per_page=100').catch(() => ({ data: [] })),
      api.get('/vendors?per_page=100').catch(() => ({ data: [] })),
      api.get('/items?per_page=100').catch(() => ({ data: [] })),
      api.get('/branches?per_page=100').catch(() => ({ data: [] })),
    ]).then(([v, ven, it, br]) => {
      setVehicles(list(v.data))
      setVendors(list(ven.data))
      setItems(list(it.data))
      setBranches(list(br.data))
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/vehicle-movements', {
        params: { page, per_page: perPage, search },
      })
      setRows(res.data.data || [])
      setMeta(res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load movements'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, toast])

  useEffect(() => {
    load()
  }, [load])

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/vehicle-movements', {
        ...form,
        vehicle_id: Number(form.vehicle_id),
        branch_id: form.branch_id ? Number(form.branch_id) : undefined,
        vendor_id: form.vendor_id ? Number(form.vendor_id) : undefined,
        item_id: form.item_id ? Number(form.item_id) : undefined,
        quantity: form.quantity === '' ? undefined : Number(form.quantity),
      })
      toast.success('Movement recorded')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Movements"
        subtitle="Track vehicle movement history"
        actions={
          can('vehicle.view') ? (
            <Button onClick={() => setModalOpen(true)}>New Movement</Button>
          ) : null
        }
      />
      <div className="mb-3">
        <Input
          className="max-w-xs"
          placeholder="Search reference / lot…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>
      <DataTable
        loading={loading}
        rows={rows}
        emptyTitle="No movements"
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.number },
          { key: 'driver_name', label: 'Driver', render: (r) => r.driver_name || r.vehicle?.driver_name },
          { key: 'branch', label: 'Branch', render: (r) => r.branch?.name },
          { key: 'transaction_type', label: 'Type' },
          { key: 'vendor', label: 'Vendor', render: (r) => r.vendor?.name },
          { key: 'customer', label: 'Customer' },
          { key: 'item', label: 'Item', render: (r) => r.item?.name },
          { key: 'quantity', label: 'Qty', align: 'right', render: (r) => formatNumber(r.quantity) },
          { key: 'lot_number', label: 'Lot' },
          { key: 'reference_number', label: 'Reference' },
        ]}
      />
      {meta && (
        <div className="rounded-b-lg border border-t-0 border-slate-200 bg-white">
          <Pagination
            meta={meta}
            onPage={setPage}
            onPerPage={(n) => {
              setPerPage(n)
              setPage(1)
            }}
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Vehicle Movement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} form="vm-form">
              Save
            </Button>
          </>
        }
      >
        <form id="vm-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Date" required>
            <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} required />
          </FormField>
          <FormField label="Vehicle" required>
            <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)} required>
              <option value="">Select…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.number}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Transaction Type" required>
            <Select value={form.transaction_type} onChange={(e) => setF('transaction_type', e.target.value)}>
              {['SETTLEMENT_BILL', 'STOCK_IN', 'STOCK_OUT', 'STOCK_TRANSFER', 'MANUAL'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Branch">
            <Select value={form.branch_id} onChange={(e) => setF('branch_id', e.target.value)}>
              <option value="">Select…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Driver Name">
            <Input value={form.driver_name} onChange={(e) => setF('driver_name', e.target.value)} />
          </FormField>
          <FormField label="Driver Mobile">
            <Input value={form.driver_mobile} onChange={(e) => setF('driver_mobile', e.target.value)} />
          </FormField>
          <FormField label="Vendor">
            <Select value={form.vendor_id} onChange={(e) => setF('vendor_id', e.target.value)}>
              <option value="">Select…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Customer">
            <Input value={form.customer} onChange={(e) => setF('customer', e.target.value)} />
          </FormField>
          <FormField label="Item">
            <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)}>
              <option value="">Select…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Quantity">
            <Input type="number" step="0.001" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} />
          </FormField>
          <FormField label="Lot Number">
            <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
          </FormField>
          <FormField label="Reference Number">
            <Input value={form.reference_number} onChange={(e) => setF('reference_number', e.target.value)} />
          </FormField>
          <FormField label="Remarks" className="sm:col-span-2">
            <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
