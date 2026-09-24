import { useCallback, useEffect, useState } from 'react'
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
  PageSpinner,
  Pagination,
  Select,
  Textarea,
} from '../../components'
import { formatMoney, today } from '../../utils/helpers'

function emptyForm(branchId) {
  return {
    number: '',
    date: today(),
    branch_id: branchId || '',
    vendor_id: '',
    settlement_bill_id: '',
    invoice_number: '',
    invoice_date: '',
    lot_number: '',
    particulars: '',
    rebate: 0,
    invoice_value: '',
    gst_type: 'NONE',
    gst_rate: 0,
    remarks: '',
  }
}

export function DebitNoteList() {
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/debit-notes', { params: { page, per_page: perPage, search, status } })
      setRows(res.data.data || [])
      setMeta(res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load debit notes'))
      setRows([])
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
      await api.post(`/debit-notes/${confirm.row.id}/${confirm.action}`)
      toast.success(`Debit note ${confirm.action} completed`)
      setConfirm(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Action failed'))
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Debit Notes"
        subtitle="Vendor debit notes with GST"
        actions={
          can('debitnote.create') ? (
            <Link to="/billing/debit-notes/new">
              <Button>New Debit Note</Button>
            </Link>
          ) : null
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search number / invoice / lot…"
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
        emptyTitle="No debit notes"
        emptyMessage="Create your first debit note."
        columns={[
          { key: 'number', label: 'Number' },
          { key: 'date', label: 'Date' },
          { key: 'vendor', label: 'Vendor', render: (r) => r.vendor?.name },
          { key: 'branch', label: 'Branch', render: (r) => r.branch?.name },
          { key: 'invoice_number', label: 'Invoice #' },
          { key: 'rebate', label: 'Rebate', align: 'right', render: (r) => formatMoney(r.rebate) },
          { key: 'invoice_value', label: 'Invoice Value', align: 'right', render: (r) => formatMoney(r.invoice_value) },
          { key: 'total', label: 'Total', align: 'right', render: (r) => formatMoney(r.total) },
          { key: 'status', label: 'Status', status: true },
        ]}
        actions={{
          render: (row) => (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    const res = await api.get(`/debit-notes/${row.id}`)
                    setDetail(res.data)
                  } catch (err) {
                    toast.error(apiErrorMessage(err))
                  }
                }}
              >
                View
              </Button>
              {row.status === 'DRAFT' && can('debitnote.create') && (
                <Link to={`/billing/debit-notes/${row.id}/edit`}>
                  <Button size="sm" variant="secondary">Edit</Button>
                </Link>
              )}
              {row.status === 'DRAFT' && can('debitnote.approve') && (
                <Button
                  size="sm"
                  onClick={() => setConfirm({ row, action: 'approve', label: 'Approve this debit note?' })}
                >
                  Approve
                </Button>
              )}
              {row.status === 'DRAFT' && can('debitnote.approve') && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setConfirm({ row, action: 'cancel', label: 'Cancel this debit note?' })}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openPdf(`/debit-notes/${row.id}/pdf`, `debit-note-${row.number || row.id}.pdf`)}
              >
                View
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadPdf(`/debit-notes/${row.id}/pdf`, `debit-note-${row.number || row.id}.pdf`)}
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
        title={confirm ? `${confirm.action[0].toUpperCase() + confirm.action.slice(1)} Debit Note` : ''}
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
        title="Debit Note"
        size="md"
        footer={
          detail && detail.id ? (
            <>
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => downloadPdf(`/debit-notes/${detail.id}/pdf`, `debit-note-${detail.number || detail.id}.pdf`)}
              >
                Download PDF
              </Button>
              <Button
                onClick={() => openPdf(`/debit-notes/${detail.id}/pdf`, `debit-note-${detail.number || detail.id}.pdf`)}
              >
                Open PDF
              </Button>
            </>
          ) : null
        }
      >
        {detail && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Number', detail.number],
              ['Date', detail.date],
              ['Vendor', detail.vendor?.name],
              ['Branch', detail.branch?.name],
              ['Invoice #', detail.invoice_number],
              ['Invoice Date', detail.invoice_date],
              ['Lot', detail.lot_number],
              ['Particulars', detail.particulars],
              ['Rebate', formatMoney(detail.rebate)],
              ['Invoice Value', formatMoney(detail.invoice_value)],
              ['CGST', formatMoney(detail.cgst_amount)],
              ['SGST', formatMoney(detail.sgst_amount)],
              ['IGST', formatMoney(detail.igst_amount)],
              ['Total', formatMoney(detail.total)],
              ['Status', detail.status],
              ['GST', `${detail.gst_type} @ ${detail.gst_rate}%`],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-slate-500">{l}</p>
                <p className="font-medium">{v ?? '—'}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export function DebitNoteForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { user, branchId } = useAuth()
  const [form, setForm] = useState(() => emptyForm(branchId || user?.default_branch_id))
  const [vendors, setVendors] = useState([])
  const [branches, setBranches] = useState([])
  const [bills, setBills] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    Promise.all([
      api.get('/vendors?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/branches?per_page=100').catch(() => ({ data: { data: [] } })),
      api.get('/settlement-bills?per_page=50').catch(() => ({ data: { data: [] } })),
    ]).then(([v, b, s]) => {
      const list = (d) => (Array.isArray(d) ? d : d.data?.data || d.data || [])
      setVendors(list(v.data))
      setBranches(list(b.data))
      setBills(list(s.data))
    })
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api
      .get(`/debit-notes/${id}`)
      .then((res) => {
        const n = res.data
        setForm({
          number: n.number || '',
          date: (n.date || '').slice(0, 10),
          branch_id: n.branch_id || '',
          vendor_id: n.vendor_id || '',
          settlement_bill_id: n.settlement_bill_id || '',
          invoice_number: n.invoice_number || '',
          invoice_date: (n.invoice_date || '').slice(0, 10),
          lot_number: n.lot_number || '',
          particulars: n.particulars || '',
          rebate: n.rebate ?? 0,
          invoice_value: n.invoice_value ?? '',
          gst_type: n.gst_type || 'NONE',
          gst_rate: n.gst_rate ?? 0,
          remarks: n.remarks || '',
        })
      })
      .catch((err) => {
        toast.error(apiErrorMessage(err))
        navigate('/billing/debit-notes')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate, toast])

  function setF(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save(e) {
    e.preventDefault()
    if (!form.date || !form.branch_id || !form.vendor_id || form.invoice_value === '') {
      toast.error('Date, branch, vendor and invoice value are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        number: form.number || undefined,
        settlement_bill_id: form.settlement_bill_id ? Number(form.settlement_bill_id) : null,
        branch_id: Number(form.branch_id),
        vendor_id: Number(form.vendor_id),
        invoice_value: Number(form.invoice_value),
        rebate: Number(form.rebate || 0),
        gst_rate: Number(form.gst_rate || 0),
        invoice_date: form.invoice_date || null,
      }
      if (isEdit) {
        await api.put(`/debit-notes/${id}`, payload)
        toast.success('Debit note updated')
      } else {
        await api.post('/debit-notes', payload)
        toast.success('Debit note created')
      }
      navigate('/billing/debit-notes')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  const base = Number(form.invoice_value || 0) - Number(form.rebate || 0)
  const rate = Number(form.gst_rate || 0)
  let cgst = 0
  let sgst = 0
  let igst = 0
  if (form.gst_type === 'CGST_SGST') {
    cgst = (base * rate) / 200
    sgst = (base * rate) / 200
  } else if (form.gst_type === 'IGST') {
    igst = (base * rate) / 100
  }
  const total = base + cgst + sgst + igst

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit Debit Note' : 'New Debit Note'}
        actions={
          <>
            <Link to="/billing/debit-notes">
              <Button variant="secondary">Back</Button>
            </Link>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      />
      <form onSubmit={save} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Debit Note Number" hint="Optional / auto">
          <Input value={form.number} onChange={(e) => setF('number', e.target.value)} />
        </FormField>
        <FormField label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} />
        </FormField>
        <FormField label="Vendor" required>
          <Select value={form.vendor_id} onChange={(e) => setF('vendor_id', e.target.value)}>
            <option value="">Select…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Branch" required>
          <Select value={form.branch_id} onChange={(e) => setF('branch_id', e.target.value)}>
            <option value="">Select…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Linked Settlement Bill">
          <Select value={form.settlement_bill_id} onChange={(e) => setF('settlement_bill_id', e.target.value)}>
            <option value="">None</option>
            {bills.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bill_number || b.id}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Lot Number">
          <Input value={form.lot_number} onChange={(e) => setF('lot_number', e.target.value)} />
        </FormField>
        <FormField label="Invoice Number">
          <Input value={form.invoice_number} onChange={(e) => setF('invoice_number', e.target.value)} />
        </FormField>
        <FormField label="Invoice Date">
          <Input type="date" value={form.invoice_date} onChange={(e) => setF('invoice_date', e.target.value)} />
        </FormField>
        <FormField label="Particulars" className="sm:col-span-2">
          <Textarea rows={3} value={form.particulars} onChange={(e) => setF('particulars', e.target.value)} />
        </FormField>
        <FormField label="Rebate">
          <Input type="number" step="0.01" value={form.rebate} onChange={(e) => setF('rebate', e.target.value)} />
        </FormField>
        <FormField label="Invoice Value" required>
          <Input type="number" step="0.01" value={form.invoice_value} onChange={(e) => setF('invoice_value', e.target.value)} />
        </FormField>
        <FormField label="GST Type">
          <Select value={form.gst_type} onChange={(e) => setF('gst_type', e.target.value)}>
            <option value="CGST_SGST">CGST + SGST</option>
            <option value="IGST">IGST</option>
            <option value="NONE">No GST</option>
          </Select>
        </FormField>
        <FormField label="GST Rate %">
          <Input
            type="number"
            step="0.01"
            value={form.gst_rate}
            disabled={form.gst_type === 'NONE'}
            onChange={(e) => setF('gst_rate', e.target.value)}
          />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea rows={2} value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} />
        </FormField>

        <div className="sm:col-span-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span>Taxable (Invoice − Rebate)</span>
            <span className="tabular-nums">{formatMoney(base)}</span>
          </div>
          <div className="flex justify-between">
            <span>CGST / SGST / IGST</span>
            <span className="tabular-nums">
              {formatMoney(cgst)} / {formatMoney(sgst)} / {formatMoney(igst)}
            </span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(total)}</span>
          </div>
        </div>
      </form>
    </div>
  )
}

export default DebitNoteList
