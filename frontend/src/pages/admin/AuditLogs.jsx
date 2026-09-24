import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
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
import { formatDateTime } from '../../utils/helpers'

function JsonBlock({ value }) {
  if (!value) return <span className="text-slate-400">—</span>
  let text = value
  if (typeof value !== 'string') {
    try {
      text = JSON.stringify(value, null, 0)
    } catch {
      text = String(value)
    }
  }
  const short = text.length > 120 ? `${text.slice(0, 120)}…` : text
  return <span className="text-xs text-slate-600">{short}</span>
}

export default function AuditLogs() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [filters, setFilters] = useState({ action: '', record_type: '', date_from: '', date_to: '' })
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/audit-logs', { params: { page, per_page: perPage, ...filters } })
      setRows(res.data.data || [])
      setMeta(res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load audit logs'))
      setRows([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, filters, toast])

  useEffect(() => {
    load()
  }, [load])

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="User actions and record changes" actions={<Button variant="secondary" onClick={load}>Refresh</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Select className="w-40" value={filters.action} onChange={(e) => setF('action', e.target.value)}>
          <option value="">All actions</option>
          {['CREATE', 'UPDATE', 'ARCHIVE', 'APPROVE', 'CANCEL', 'LOGIN'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <Input
          className="w-44"
          placeholder="Record type"
          value={filters.record_type}
          onChange={(e) => setF('record_type', e.target.value)}
        />
        <Input type="date" value={filters.date_from} onChange={(e) => setF('date_from', e.target.value)} />
        <Input type="date" value={filters.date_to} onChange={(e) => setF('date_to', e.target.value)} />
        <Button variant="secondary" onClick={() => { setPage(1); load() }}>
          Apply
        </Button>
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        emptyTitle="No audit logs"
        columns={[
          { key: 'created_at', label: 'Timestamp', render: (r) => formatDateTime(r.created_at) },
          { key: 'user', label: 'User', render: (r) => r.user?.name || r.user?.email || 'System' },
          { key: 'action', label: 'Action' },
          { key: 'record_type', label: 'Record' },
          { key: 'record_id', label: 'ID' },
          { key: 'old_values', label: 'Old', render: (r) => <JsonBlock value={r.old_values} /> },
          { key: 'new_values', label: 'New', render: (r) => <JsonBlock value={r.new_values} /> },
        ]}
        actions={{
          render: (row) => (
            <Button size="sm" variant="secondary" onClick={() => setDetail(row)}>
              View
            </Button>
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

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Audit Log Detail" size="lg">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Timestamp"><Input readOnly value={formatDateTime(detail.created_at)} /></FormField>
              <FormField label="User"><Input readOnly value={detail.user?.name || detail.user?.email || 'System'} /></FormField>
              <FormField label="Action"><Input readOnly value={detail.action} /></FormField>
              <FormField label="Record"><Input readOnly value={`${detail.record_type} #${detail.record_id ?? '—'}`} /></FormField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Old Values</p>
                <pre className="max-h-64 overflow-auto rounded bg-slate-50 p-2 text-xs">{pretty(detail.old_values)}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">New Values</p>
                <pre className="max-h-64 overflow-auto rounded bg-slate-50 p-2 text-xs">{pretty(detail.new_values)}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function pretty(v) {
  if (!v) return '—'
  if (typeof v === 'string') {
    try {
      return JSON.stringify(JSON.parse(v), null, 2)
    } catch {
      return v
    }
  }
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}
