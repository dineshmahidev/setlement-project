import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { apiErrorMessage, openPdf, downloadPdf } from '../../services/api'
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
  Pagination,
  PageSpinner,
  Select,
  StatusBadge,
  Textarea,
  Checkbox,
} from '../../components'
import { formatMoney, formatNumber, today } from '../../utils/helpers'

const QC_FIELDS = [
  { key: 'oil_content', name: 'Oil Content' },
  { key: 'ffa', name: 'FFA' },
  { key: 'ss', name: 'SS' },
  { key: 'fibre', name: 'Fibre' },
  { key: 'moisture', name: 'Moisture' },
  { key: 'iv', name: 'IV' },
  { key: 'calcium', name: 'Calcium' },
  { key: 'protein', name: 'Protein' },
]

function emptyForm(branchId) {
  return {
    bill_number: '',
    bill_date: today(),
    lot_number: '',
    branch_id: branchId || '',
    vendor_id: '',
    vehicle_id: '',
    item_id: '',
    po_number: '',
    net_weight: '',
    final_weight: '',
    manual_quantity: '',
    jute_bag_quantity: '',
    container_unit_rate: '',
    final_unit_rate: '',
    billing_quantity_source: 'FINAL_WEIGHT',
    rate_mode: 'MANUAL',
    rate_rule: '',
    gst_type: 'CGST_SGST',
    gst_rate: '5',
    post_to_inventory: true,
    remarks: '',
    vendor_snapshot: null,
  }
}

/* ---------------- LIST ---------------- */
export function SettlementList() {
  const { can } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/settlement-bills', {
        params: { page, per_page: perPage, search, status },
      })
      setRows(res.data.data || [])
      setMeta(res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load settlement bills'))
      setRows([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, status, toast])

  useEffect(() => {
    load()
  }, [load])

  async function runAction() {
    if (!confirm) return
    setConfirmLoading(true)
    try {
      await api.post(`/settlement-bills/${confirm.row.id}/${confirm.action}`)
      toast.success(`Settlement bill ${confirm.action} successful`)
      setConfirm(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Action failed'))
    } finally {
      setConfirmLoading(false)
    }
  }

  async function openDetail(row) {
    setDetailLoading(true)
    setDetail({ id: row.id })
    try {
      const res = await api.get(`/settlement-bills/${row.id}`)
      setDetail(res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load bill'))
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settlement Bills"
        subtitle="Create, submit, approve settlement bills"
        actions={
          can('settlement.create') ? (
            <Link to="/billing/settlement-bills/new">
              <Button>New Settlement Bill</Button>
            </Link>
          ) : null
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search bill # or lot…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          className="w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="CANCELLED">CANCELLED</option>
        </Select>
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        emptyTitle="No settlement bills"
        emptyMessage="Create your first settlement bill."
        columns={[
          { key: 'bill_number', label: 'Bill #' },
          { key: 'bill_date', label: 'Date' },
          { key: 'vendor', label: 'Vendor', render: (r) => r.vendor?.name },
          { key: 'branch', label: 'Branch', render: (r) => r.branch?.name },
          { key: 'item', label: 'Item', render: (r) => r.item?.name },
          { key: 'lot_number', label: 'Lot' },
          { key: 'net_payable', label: 'Net Payable', align: 'right', render: (r) => formatMoney(r.net_payable) },
          { key: 'status', label: 'Status', status: true },
        ]}
        actions={{
          render: (row) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => openDetail(row)}>
                View
              </Button>
              {row.status === 'DRAFT' && can('settlement.edit') && (
                <Link to={`/billing/settlement-bills/${row.id}/edit`}>
                  <Button size="sm" variant="secondary">Edit</Button>
                </Link>
              )}
              {row.status === 'DRAFT' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirm({ row, action: 'submit', label: 'Submit this bill?' })}
                >
                  Submit
                </Button>
              )}
              {row.status === 'SUBMITTED' && can('settlement.approve') && (
                <Button
                  size="sm"
                  onClick={() => setConfirm({ row, action: 'approve', label: 'Approve this bill?' })}
                >
                  Approve
                </Button>
              )}
              {['DRAFT', 'SUBMITTED'].includes(row.status) && can('settlement.cancel') && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setConfirm({ row, action: 'cancel', label: 'Cancel this bill?' })}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openPdf(`/settlement-bills/${row.id}/pdf`, `settlement-${row.bill_number || row.id}.pdf`)}
              >
                View
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  downloadPdf(`/settlement-bills/${row.id}/pdf`, `settlement-${row.bill_number || row.id}.pdf`)
                }
              >
                Download
              </Button>
            </>
          ),
        }}
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

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm ? `${confirm.action[0].toUpperCase()}${confirm.action.slice(1)} Bill` : ''}
        message={confirm?.label}
        loading={confirmLoading}
        danger={confirm?.action === 'cancel'}
        confirmText={confirm ? confirm.action[0].toUpperCase() + confirm.action.slice(1) : 'Confirm'}
        onConfirm={runAction}
        onCancel={() => setConfirm(null)}
      />

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Settlement Bill Details"
        size="lg"
        footer={
          detail && detail.id ? (
            <>
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadPdf(`/settlement-bills/${detail.id}/pdf`, `settlement-${detail.bill_number || detail.id}.pdf`)
                }
              >
                Download PDF
              </Button>
              <Button
                onClick={() => openPdf(`/settlement-bills/${detail.id}/pdf`, `settlement-${detail.bill_number || detail.id}.pdf`)}
              >
                Open PDF
              </Button>
            </>
          ) : null
        }
      >
        {detailLoading || !detail?.id ? (
          <PageSpinner />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Info label="Bill #" value={detail.bill_number} />
              <Info label="Date" value={detail.bill_date} />
              <Info label="Status" value={<StatusBadge status={detail.status} />} />
              <Info label="Lot" value={detail.lot_number} />
              <Info label="Vendor" value={detail.vendor?.name} />
              <Info label="Branch" value={detail.branch?.name} />
              <Info label="Vehicle" value={detail.vehicle?.number} />
              <Info label="Item" value={detail.item?.name} />
              <Info label="Net Weight" value={formatNumber(detail.net_weight)} />
              <Info label="Final Weight" value={formatNumber(detail.final_weight)} />
              <Info label="Billing Qty" value={`${formatNumber(detail.billing_quantity)} (${detail.billing_quantity_source})`} />
              <Info label="Rate" value={`${formatMoney(detail.final_unit_rate)} (${detail.rate_mode})`} />
              {detail.rate_basis && <Info label="Rate Basis" value={detail.rate_basis} className="sm:col-span-2" />}
              <Info label="Total Value" value={formatMoney(detail.total_value)} />
              <Info label="Taxable" value={formatMoney(detail.taxable_amount)} />
              <Info label="CGST" value={formatMoney(detail.cgst_amount)} />
              <Info label="SGST" value={formatMoney(detail.sgst_amount)} />
              <Info label="IGST" value={formatMoney(detail.igst_amount)} />
              <Info label="Net Payable" value={formatMoney(detail.net_payable)} />
              <Info label="GST" value={`${detail.gst_type} @ ${detail.gst_rate}%`} />
              <Info label="Inventory Posted" value={detail.inventory_posted ? 'Yes' : 'No'} />
            </div>

            {detail.qc?.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold text-slate-800">QC</h4>
                <DataTable
                  rows={detail.qc}
                  columns={[
                    { key: 'name', label: 'Field' },
                    { key: 'value', label: 'Value' },
                    { key: 'unit', label: 'Unit' },
                    { key: 'remarks', label: 'Remarks' },
                  ]}
                />
              </div>
            )}

            {detail.charges?.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold text-slate-800">Charges</h4>
                <DataTable
                  rows={detail.charges}
                  columns={[
                    { key: 'name', label: 'Charge' },
                    { key: 'direction', label: 'Direction' },
                    { key: 'mode', label: 'Mode' },
                    { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatMoney(r.amount) },
                    { key: 'basis', label: 'Basis' },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function Info({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value ?? '—'}</p>
    </div>
  )
}

/* ---------------- FORM ---------------- */
export function SettlementForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { user, branchId, can } = useAuth()

  const [form, setForm] = useState(() => emptyForm(branchId || user?.default_branch_id))
  const [vendors, setVendors] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [items, setItems] = useState([])
  const [branches, setBranches] = useState([])
  const [fieldConfigs, setFieldConfigs] = useState([])
  const [qcRows, setQcRows] = useState(
    QC_FIELDS.map((f) => ({ key: f.key, name: f.name, value: '', unit: '', remarks: '', active: true })),
  )
  const [chargeRows, setChargeRows] = useState([])
  const [calc, setCalc] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [vendorOverride, setVendorOverride] = useState(false)
  const [snapshot, setSnapshot] = useState(null)
  const calcTimer = useRef(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('/vendors?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/vehicles?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/items?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/branches?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/charge-types').catch(() => ({ data: [] })),
      api.get('/field-configurations').catch(() => ({ data: [] })),
    ]).then(([v, veh, it, br, ct, fc]) => {
      if (!alive) return
      const list = (d) => (Array.isArray(d) ? d : d.data?.data || d.data || [])
      setVendors(list(v.data))
      setVehicles(list(veh.data))
      setItems(list(it.data))
      setBranches(list(br.data))
      const cts = list(ct.data)
      const fcs = list(fc.data)
      setFieldConfigs(fcs)

      const chargeCfg = fcs.filter((f) => f.module === 'CHARGES' && f.visible)
      const keys = new Set(chargeCfg.map((c) => c.field_key))
      setChargeRows(
        cts
          .filter((c) => keys.size === 0 || keys.has(c.code))
          .filter((c) => c.active)
          .map((c) => ({
            charge_type_id: c.id,
            code: c.code,
            name: c.name,
            mode: c.mode || 'MANUAL',
            direction: c.direction || 'ADD',
            amount: c.default_amount || 0,
            calculation_rule: c.calculation_rule || '',
            active: true,
            sort_order: c.sort_order || 0,
            basis: '',
          })),
      )

      const qcCfg = fcs.filter((f) => f.module === 'QC')
      if (qcCfg.length) {
        const visible = new Set(qcCfg.filter((f) => f.visible).map((f) => f.field_key))
        setQcRows((rows) => rows.map((r) => (visible.has(r.key) ? r : { ...r, hidden: true })).filter((r) => !r.hidden))
      }
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api
      .get(`/settlement-bills/${id}`)
      .then((res) => {
        const b = res.data
        setForm({
          bill_number: b.bill_number || '',
          bill_date: (b.bill_date || '').slice(0, 10),
          lot_number: b.lot_number || '',
          branch_id: b.branch_id || '',
          vendor_id: b.vendor_id || '',
          vehicle_id: b.vehicle_id || '',
          item_id: b.item_id || '',
          po_number: b.po_number || '',
          net_weight: b.net_weight ?? '',
          final_weight: b.final_weight ?? '',
          manual_quantity: b.manual_quantity ?? '',
          jute_bag_quantity: b.jute_bag_quantity ?? '',
          container_unit_rate: b.container_unit_rate ?? '',
          final_unit_rate: b.final_unit_rate ?? '',
          billing_quantity_source: b.billing_quantity_source || 'FINAL_WEIGHT',
          rate_mode: b.rate_mode || 'MANUAL',
          rate_rule: b.rate_rule || '',
          gst_type: b.gst_type || 'CGST_SGST',
          gst_rate: b.gst_rate ?? 5,
          post_to_inventory: Boolean(b.post_to_inventory),
          remarks: b.remarks || '',
          vendor_snapshot: b.vendor_snapshot ? safeParse(b.vendor_snapshot) : null,
        })
        if (b.vendor_snapshot) setSnapshot(safeParse(b.vendor_snapshot))
        if (b.qc?.length) {
          setQcRows(
            b.qc.map((q) => ({
              key: q.key,
              name: q.name,
              value: q.value ?? '',
              unit: q.unit || '',
              remarks: q.remarks || '',
              active: q.active !== false,
            })),
          )
        }
        if (b.charges?.length) {
          setChargeRows(
            b.charges.map((c) => ({
              charge_type_id: c.charge_type_id,
              code: c.code,
              name: c.name,
              mode: c.mode || 'MANUAL',
              direction: c.direction || 'ADD',
              amount: c.amount ?? 0,
              calculation_rule: c.calculation_rule || '',
              active: c.active !== false,
              sort_order: c.sort_order || 0,
              basis: c.basis || '',
            })),
          )
        }
        setCalc({
          total_value: b.total_value,
          additive_charges: b.additive_charges,
          deductive_charges: b.deductive_charges,
          taxable_amount: b.taxable_amount,
          cgst_amount: b.cgst_amount,
          sgst_amount: b.sgst_amount,
          igst_amount: b.igst_amount,
          net_payable: b.net_payable,
          rate_basis: b.rate_basis,
          final_unit_rate: b.final_unit_rate,
        })
      })
      .catch((err) => {
        toast.error(apiErrorMessage(err, 'Failed to load bill'))
        navigate('/billing/settlement-bills')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, toast])

  function safeParse(s) {
    try {
      return typeof s === 'string' ? JSON.parse(s) : s
    } catch {
      return null
    }
  }

  const visible = useMemo(() => {
    const map = {}
    fieldConfigs
      .filter((f) => f.module === 'SETTLEMENT_BILL')
      .forEach((f) => {
        map[f.field_key] = f.visible
      })
    return map
  }, [fieldConfigs])

  function setF(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function onVendorChange(vendorId) {
    setF('vendor_id', vendorId)
    const v = vendors.find((x) => String(x.id) === String(vendorId))
    if (v) {
      const snap = {
        code: v.code,
        name: v.name,
        address: v.address,
        city: v.city,
        district: v.district,
        state: v.state,
        pincode: v.pincode,
        gst_number: v.gst_number,
        phone: v.phone,
        email: v.email,
        pan: v.pan,
        po_number: v.po_number,
      }
      setSnapshot(snap)
      setForm((f) => ({ ...f, vendor_id: vendorId, po_number: f.po_number || v.po_number || '' }))
      if (!vendorOverride) setForm((f) => ({ ...f, vendor_id: vendorId }))
    }
  }

  const buildPayload = useCallback(() => {
    const n = (v) => (v === '' || v == null ? undefined : Number(v))
    return {
      bill_date: form.bill_date,
      branch_id: form.branch_id ? Number(form.branch_id) : undefined,
      vendor_id: form.vendor_id ? Number(form.vendor_id) : undefined,
      lot_number: form.lot_number || undefined,
      vehicle_id: form.vehicle_id ? Number(form.vehicle_id) || undefined : undefined,
      item_id: form.item_id ? Number(form.item_id) || undefined : undefined,
      po_number: form.po_number || undefined,
      net_weight: n(form.net_weight) ?? 0,
      final_weight: n(form.final_weight) ?? 0,
      manual_quantity: form.manual_quantity === '' ? undefined : Number(form.manual_quantity),
      jute_bag_quantity: n(form.jute_bag_quantity) ?? 0,
      container_unit_rate: n(form.container_unit_rate) ?? 0,
      final_unit_rate: n(form.final_unit_rate) ?? 0,
      billing_quantity_source: form.billing_quantity_source,
      rate_mode: form.rate_mode,
      rate_rule: form.rate_rule || undefined,
      gst_type: form.gst_type,
      gst_rate: Number(form.gst_rate || 0),
      post_to_inventory: form.post_to_inventory ? 1 : 0,
      remarks: form.remarks || undefined,
      bill_number: form.bill_number || undefined,
      qc: qcRows.map((r) => ({
        key: r.key,
        name: r.name,
        value: r.value,
        unit: r.unit,
        remarks: r.remarks,
        active: r.active !== false,
      })),
      charges: chargeRows.map((c, i) => ({
        charge_type_id: c.charge_type_id,
        code: c.code,
        name: c.name,
        mode: c.mode,
        direction: c.direction,
        amount: Number(c.amount || 0),
        calculation_rule: c.calculation_rule || undefined,
        active: c.active !== false,
        sort_order: c.sort_order ?? i,
      })),
      vendor_snapshot: snapshot || undefined,
    }
  }, [form, qcRows, chargeRows, snapshot])

  const runCalculate = useCallback(async () => {
    if (!form.vendor_id || !form.branch_id || !form.bill_date) return
    const payload = buildPayload()
    try {
      const res = await api.post('/settlement-bills/calculate', payload)
      setCalc(res.data)
      setChargeRows((rows) =>
        rows.map((r) => {
          const back = res.data.charges?.find((c) => c.code === r.code || c.name === r.name)
          return back ? { ...r, amount: back.amount, basis: back.basis } : r
        }),
      )
    } catch {
      // silent — show empty calc
    }
  }, [buildPayload, form.vendor_id, form.branch_id, form.bill_date])

  useEffect(() => {
    if (calcTimer.current) clearTimeout(calcTimer.current)
    calcTimer.current = setTimeout(() => {
      runCalculate()
    }, 500)
    return () => {
      if (calcTimer.current) clearTimeout(calcTimer.current)
    }
  }, [runCalculate, form, chargeRows, qcRows])

  async function save() {
    if (!form.bill_date || !form.vendor_id || !form.branch_id) {
      toast.error('Bill date, branch and vendor are required')
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload()
      if (isEdit) {
        await api.put(`/settlement-bills/${id}`, payload)
        toast.success('Settlement bill updated')
      } else {
        await api.post('/settlement-bills', payload)
        toast.success('Settlement bill created')
      }
      navigate('/billing/settlement-bills')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  const fld = (key) => visible[key] !== false
  const snap = snapshot || {}
  const vendor = vendors.find((v) => String(v.id) === String(form.vendor_id))

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Settlement Bill' : 'New Settlement Bill'}
        subtitle="Vendor auto-fills from master; overrides stay bill-specific"
        actions={
          <>
            <Link to="/billing/settlement-bills">
              <Button variant="secondary">Back</Button>
            </Link>
            {(!isEdit || can('settlement.edit')) && (
              <Button onClick={save} loading={saving}>
                Save Draft
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Bill Header</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Bill Number" hint="Optional / auto">
                <Input value={form.bill_number} onChange={(e) => setF('bill_number', e.target.value)} />
              </FormField>
              <FormField label="Bill Date" required>
                <Input type="date" value={form.bill_date} onChange={(e) => setF('bill_date', e.target.value)} />
              </FormField>
              <FormField label="Branch" required>
                <Select value={form.branch_id} onChange={(e) => setF('branch_id', e.target.value)}>
                  <option value="">Select branch…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Vendor" required>
                <Select value={form.vendor_id} onChange={(e) => onVendorChange(e.target.value)}>
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Lot Number" show={fld('lot_number')}>
                <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
              </FormField>
              <FormField label="PO Number" show={fld('po_number')}>
                <Input value={form.po_number} onChange={(e) => setF('po_number', e.target.value)} />
              </FormField>
              <FormField label="Vehicle" show={fld('vehicle_number')}>
                <Select value={form.vehicle_id} onChange={(e) => setF('vehicle_id', e.target.value)}>
                  <option value="">Select…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.number}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Item">
                <Select value={form.item_id} onChange={(e) => setF('item_id', e.target.value)}>
                  <option value="">Select…</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Remarks" className="sm:col-span-3">
                <Textarea rows={2} value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Vendor Details (bill-specific)</h3>
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={vendorOverride}
                  onChange={(e) => setVendorOverride(e.target.checked)}
                  disabled={!vendor}
                />
                Override for this bill
              </label>
            </div>
            {vendor || vendorOverride ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['name', 'Name'],
                  ['address', 'Address'],
                  ['city', 'City'],
                  ['state', 'State'],
                  ['pincode', 'Pincode'],
                  ['gst_number', 'GST Number'],
                  ['phone', 'Phone'],
                  ['email', 'Email'],
                  ['po_number', 'PO Number'],
                ].map(([k, label]) => (
                  <FormField key={k} label={label}>
                    <Input
                      value={snap[k] ?? ''}
                      disabled={!vendorOverride}
                      onChange={(e) => setSnapshot({ ...snap, [k]: e.target.value })}
                    />
                  </FormField>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a vendor to auto-fill details.</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Overrides do not modify the vendor master record.
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Weights & Rates</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <FormField label="Net Weight" show={fld('net_weight')} required>
                <Input type="number" step="0.001" value={form.net_weight} onChange={(e) => setF('net_weight', e.target.value)} />
              </FormField>
              <FormField label="Final Weight" show={fld('final_weight')} required>
                <Input type="number" step="0.001" value={form.final_weight} onChange={(e) => setF('final_weight', e.target.value)} />
              </FormField>
              <FormField label="Manual Quantity" show={form.billing_quantity_source === 'MANUAL_QUANTITY'}>
                <Input type="number" step="0.001" value={form.manual_quantity} onChange={(e) => setF('manual_quantity', e.target.value)} />
              </FormField>
              <FormField label="Jute Bag Qty" show={fld('jute_bag_quantity')}>
                <Input type="number" step="0.001" value={form.jute_bag_quantity} onChange={(e) => setF('jute_bag_quantity', e.target.value)} />
              </FormField>
              <FormField label="Container Unit Rate" show={fld('container_unit_rate')}>
                <Input type="number" step="0.0001" value={form.container_unit_rate} onChange={(e) => setF('container_unit_rate', e.target.value)} />
              </FormField>
              <FormField label="Final Unit Rate" show={fld('final_unit_rate')} required>
                <Input type="number" step="0.0001" value={form.final_unit_rate} onChange={(e) => setF('final_unit_rate', e.target.value)} />
              </FormField>
              <FormField label="Billing Qty Source">
                <Select
                  value={form.billing_quantity_source}
                  onChange={(e) => setF('billing_quantity_source', e.target.value)}
                >
                  <option value="FINAL_WEIGHT">Final Weight</option>
                  <option value="NET_WEIGHT">Net Weight</option>
                  <option value="MANUAL_QUANTITY">Manual Quantity</option>
                </Select>
              </FormField>
              <FormField label="Rate Mode">
                <Select value={form.rate_mode} onChange={(e) => setF('rate_mode', e.target.value)}>
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                </Select>
              </FormField>
              {form.rate_mode === 'AUTOMATIC' && (
                <FormField label="Rate Rule" hint="e.g. WEIGHT * 203" className="sm:col-span-2">
                  <Input value={form.rate_rule} onChange={(e) => setF('rate_rule', e.target.value)} placeholder="WEIGHT * 203" />
                </FormField>
              )}
            </div>
            {calc?.rate_basis && form.rate_mode === 'AUTOMATIC' && (
              <p className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                Rate basis: {calc.rate_basis}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">QC Details (manual)</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {qcRows.map((q, idx) => (
                <FormField key={q.key} label={q.name}>
                  <Input
                    value={q.value}
                    onChange={(e) =>
                      setQcRows((rows) => rows.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))
                    }
                  />
                </FormField>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Charges</h3>
            {chargeRows.length === 0 ? (
              <p className="text-sm text-slate-400">No active charge types.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-2 py-2 text-left">Charge</th>
                      <th className="px-2 py-2 text-left">Mode</th>
                      <th className="px-2 py-2 text-left">Direction</th>
                      <th className="px-2 py-2 text-left">Rule</th>
                      <th className="px-2 py-2 text-right">Amount</th>
                      <th className="px-2 py-2 text-left">Basis</th>
                      <th className="px-2 py-2 text-left">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chargeRows.map((c, idx) => (
                      <tr key={c.code || idx}>
                        <td className="px-2 py-1.5">{c.name}</td>
                        <td className="px-2 py-1.5">
                          <Select
                            value={c.mode}
                            onChange={(e) =>
                              setChargeRows((rows) =>
                                rows.map((r, i) => (i === idx ? { ...r, mode: e.target.value } : r)),
                              )
                            }
                            className="py-1 text-xs"
                          >
                            <option value="MANUAL">MANUAL</option>
                            <option value="AUTOMATIC">AUTOMATIC</option>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Select
                            value={c.direction}
                            onChange={(e) =>
                              setChargeRows((rows) =>
                                rows.map((r, i) => (i === idx ? { ...r, direction: e.target.value } : r)),
                              )
                            }
                            className="py-1 text-xs"
                          >
                            <option value="ADD">ADD</option>
                            <option value="DEDUCT">DEDUCT</option>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={c.calculation_rule || ''}
                            placeholder="rule"
                            className="py-1 text-xs"
                            onChange={(e) =>
                              setChargeRows((rows) =>
                                rows.map((r, i) => (i === idx ? { ...r, calculation_rule: e.target.value } : r)),
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            value={c.amount}
                            disabled={c.mode === 'AUTOMATIC'}
                            className="py-1 text-right text-xs"
                            onChange={(e) =>
                              setChargeRows((rows) =>
                                rows.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r)),
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5 text-xs text-slate-500">{c.basis}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={c.active}
                            onChange={(e) =>
                              setChargeRows((rows) =>
                                rows.map((r, i) => (i === idx ? { ...r, active: e.target.checked } : r)),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">GST (mutually exclusive)</h3>
            <div className="flex flex-wrap gap-5">
              {[
                ['CGST_SGST', 'CGST + SGST'],
                ['IGST', 'IGST'],
                ['NONE', 'No GST'],
              ].map(([val, label]) => (
                <label key={val} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="gst_type"
                    checked={form.gst_type === val}
                    onChange={() => setF('gst_type', val)}
                  />
                  {label}
                </label>
              ))}
              <FormField label="GST Rate %">
                <Input
                  type="number"
                  step="0.01"
                  value={form.gst_rate}
                  disabled={form.gst_type === 'NONE'}
                  onChange={(e) => setF('gst_rate', e.target.value)}
                  className="w-28"
                />
              </FormField>
            </div>
            <div className="mt-3">
              <Checkbox
                label="Post to inventory on approval"
                checked={form.post_to_inventory}
                onChange={(e) => setF('post_to_inventory', e.target.checked)}
              />
            </div>
          </section>
        </div>

        <aside className="xl:col-span-1">
          <div className="sticky top-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Calculation Breakdown</h3>
            {!calc ? (
              <p className="text-sm text-slate-400">Fill required fields to calculate…</p>
            ) : (
              <dl className="space-y-2 text-sm">
                <Row label="Billing Quantity" value={formatNumber(calc.billing_quantity)} />
                <Row label="Final Unit Rate" value={formatMoney(calc.final_unit_rate)} />
                <Row label="Total Value" value={formatMoney(calc.total_value)} />
                <Row label="Additive Charges" value={formatMoney(calc.additive_charges)} />
                <Row label="Deductive Charges" value={formatMoney(calc.deductive_charges)} />
                <Row label="Taxable Amount" value={formatMoney(calc.taxable_amount)} />
                {form.gst_type === 'CGST_SGST' && (
                  <>
                    <Row label="CGST" value={formatMoney(calc.cgst_amount)} />
                    <Row label="SGST" value={formatMoney(calc.sgst_amount)} />
                  </>
                )}
                {form.gst_type === 'IGST' && <Row label="IGST" value={formatMoney(calc.igst_amount)} />}
                {form.gst_type === 'NONE' && <Row label="GST" value="None" />}
                <div className="border-t border-slate-200 pt-2">
                  <Row label="Net Payable" value={formatMoney(calc.net_payable)} bold />
                </div>
              </dl>
            )}
            <Button className="mt-4 w-full" variant="secondary" onClick={runCalculate}>
              Recalculate
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

export default SettlementList
