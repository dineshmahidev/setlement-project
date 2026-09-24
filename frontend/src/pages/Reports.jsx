import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage, downloadFile } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, DataTable, FormField, Input, PageHeader, Select } from '../components'

const REPORT_TYPES = [
  ['settlement', 'Settlement Bill Report'],
  ['debit-note', 'Debit Note Report'],
  ['vendor', 'Vendor Report'],
  ['qc', 'QC Report'],
  ['current-stock', 'Current Stock Report'],
  ['stock-ledger', 'Stock Ledger'],
  ['stock-in', 'Stock In Report'],
  ['stock-out', 'Stock Out Report'],
  ['branch-stock', 'Branch-wise Stock'],
  ['vehicle-movement', 'Vehicle Movement'],
  ['vehicle-wise', 'Vehicle-wise Transactions'],
  ['gst', 'GST Report'],
  ['low-stock', 'Low Stock Report'],
  ['date-wise', 'Date-wise Transactions'],
]

export default function Reports() {
  const toast = useToast()
  const { branchId } = useAuth()
  const [type, setType] = useState('settlement')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState('')
  const [filters, setFilters] = useState({
    branch_id: '',
    date_from: '',
    date_to: '',
    vendor_id: '',
    item_id: '',
    vehicle_id: '',
    bill_number: '',
    lot_number: '',
    status: '',
  })
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [branches, setBranches] = useState([])

  useEffect(() => {
    const list = (d) => (Array.isArray(d) ? d : d.data?.data || d.data || [])
    Promise.all([
      api.get('/vendors?per_page=100').catch(() => ({ data: [] })),
      api.get('/items?per_page=100').catch(() => ({ data: [] })),
      api.get('/vehicles?per_page=100').catch(() => ({ data: [] })),
      api.get('/branches?per_page=100').catch(() => ({ data: [] })),
    ]).then(([v, it, ve, b]) => {
      setVendors(list(v.data))
      setItems(list(it.data))
      setVehicles(list(ve.data))
      setBranches(list(b.data))
    })
  }, [])

  const params = useCallback(() => {
    const p = {}
    Object.entries(filters).forEach(([k, v]) => {
      if (v) p[k] = v
    })
    if (!p.branch_id && branchId) p.branch_id = branchId
    return p
  }, [filters, branchId])

  const run = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/${type}`, { params: params() })
      setRows(res.data.data || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Report failed'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [type, params, toast])

  useEffect(() => {
    setRows([])
  }, [type])

  async function exportAs(format) {
    setExporting(format)
    try {
      const label = REPORT_TYPES.find((r) => r[0] === type)?.[0] || type
      await downloadFile(`/reports/${type}/export${`?format=${format}`}`, `${label}.${format === 'excel' ? 'xls' : format}`)
      toast.success(`Exported ${format.toUpperCase()}`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Export failed'))
    } finally {
      setExporting('')
    }
  }

  const columns = rows.length
    ? Object.keys(rows[0]).map((k) => ({
        key: k,
        label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        align: ['amount', 'value', 'total', 'stock', 'quantity', 'rate', 'gst', 'cgst', 'sgst', 'igst', 'rebate', 'net_payable', 'movements'].includes(
          k.toLowerCase(),
        )
          ? 'right'
          : 'left',
      }))
    : []

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Filter, view and export business reports"
        actions={
          <>
            <Button variant="secondary" onClick={() => exportAs('csv')} loading={exporting === 'csv'} disabled={loading}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => exportAs('excel')} loading={exporting === 'excel'} disabled={loading}>
              Export Excel
            </Button>
            <Button variant="secondary" onClick={() => exportAs('pdf')} loading={exporting === 'pdf'} disabled={loading}>
              Export PDF
            </Button>
            <Button onClick={run} loading={loading}>
              Run Report
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-4">
        <FormField label="Report Type" className="xl:col-span-1">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {REPORT_TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Branch">
          <Select value={filters.branch_id} onChange={(e) => setF('branch_id', e.target.value)}>
            <option value="">All / default</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Date From">
          <Input type="date" value={filters.date_from} onChange={(e) => setF('date_from', e.target.value)} />
        </FormField>
        <FormField label="Date To">
          <Input type="date" value={filters.date_to} onChange={(e) => setF('date_to', e.target.value)} />
        </FormField>
        <FormField label="Vendor">
          <Select value={filters.vendor_id} onChange={(e) => setF('vendor_id', e.target.value)}>
            <option value="">All</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Item">
          <Select value={filters.item_id} onChange={(e) => setF('item_id', e.target.value)}>
            <option value="">All</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Vehicle">
          <Select value={filters.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
            <option value="">All</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.number}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Bill Number">
          <Input value={filters.bill_number} onChange={(e) => setF('bill_number', e.target.value)} />
        </FormField>
        <FormField label="Lot Number">
          <Input value={filters.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select value={filters.status} onChange={(e) => setF('status', e.target.value)}>
            <option value="">All</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="CANCELLED">CANCELLED</option>
          </Select>
        </FormField>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        emptyTitle="No report data"
        emptyMessage="Choose filters and click Run Report."
        columns={
          columns.length
            ? columns
            : [{ key: '_', label: 'Result', render: () => 'Run the report to see results' }]
        }
      />
    </div>
  )
}
