import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
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
  Select,
} from '../../components'

const empty = {
  name: '',
  employee_id: '',
  email: '',
  mobile: '',
  password: '',
  role_id: '',
  default_branch_id: '',
  branch_ids: [],
  status: 'ACTIVE',
}

export default function Staff() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [search, setSearch] = useState('')
  const [roles, setRoles] = useState([])
  const [branches, setBranches] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/users', { params: { page, per_page: perPage, search } })
      setRows(res.data.data || [])
      setMeta(res.data)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load staff'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    Promise.all([
      api.get('/roles').catch(() => ({ data: [] })),
      api.get('/branches?per_page=100').catch(() => ({ data: [] })),
    ]).then(([r, b]) => {
      setRoles(Array.isArray(r.data) ? r.data : r.data.data || [])
      const bl = Array.isArray(b.data) ? b.data : b.data.data || []
      setBranches(bl)
    })
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(empty)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      name: row.name || '',
      employee_id: row.employee_id || '',
      email: row.email || '',
      mobile: row.mobile || '',
      password: '',
      role_id: row.role_id || row.role?.id || '',
      default_branch_id: row.default_branch_id || '',
      branch_ids: (row.branches || []).map((b) => b.id),
      status: row.status || 'ACTIVE',
    })
    setModalOpen(true)
  }

  function toggleBranch(id) {
    setForm((f) => ({
      ...f,
      branch_ids: f.branch_ids.includes(id)
        ? f.branch_ids.filter((x) => x !== id)
        : [...f.branch_ids, id],
    }))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        employee_id: form.employee_id || null,
        email: form.email,
        mobile: form.mobile || null,
        role_id: Number(form.role_id),
        default_branch_id: form.default_branch_id ? Number(form.default_branch_id) : null,
        branch_ids: form.branch_ids.map(Number),
        status: form.status,
      }
      if (form.password) payload.password = form.password
      if (editing) {
        await api.put(`/users/${editing.id}`, payload)
        toast.success('Staff updated')
      } else {
        if (!form.password) {
          toast.error('Password is required for new staff')
          setSaving(false)
          return
        }
        await api.post('/users', payload)
        toast.success('Staff created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await api.delete(`/users/${deleting.id}`)
      toast.success('Staff archived')
      setDeleting(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Archive failed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Staff" subtitle="Manage users" actions={<Button onClick={openCreate}>New Staff</Button>} />
      <div className="mb-3">
        <Input
          className="max-w-xs"
          placeholder="Search name / email…"
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
        emptyTitle="No staff"
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'employee_id', label: 'Emp ID' },
          { key: 'email', label: 'Email' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'role', label: 'Role', render: (r) => r.role?.label || r.role?.name },
          { key: 'default_branch', label: 'Default Branch', render: (r) => r.default_branch?.name },
          { key: 'branches', label: 'Branches', render: (r) => (r.branches || []).map((b) => b.name).join(', ') || '—' },
          { key: 'status', label: 'Status', status: true },
        ]}
        actions={{
          render: (row) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(row)}>
                Archive
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Staff' : 'New Staff'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} form="staff-form">Save</Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </FormField>
          <FormField label="Employee ID">
            <Input value={form.employee_id} onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))} />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </FormField>
          <FormField label="Mobile">
            <Input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
          </FormField>
          <FormField label={editing ? 'Password (leave blank to keep)' : 'Password'} required={!editing}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={!editing}
            />
          </FormField>
          <FormField label="Role" required>
            <Select value={form.role_id} onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))} required>
              <option value="">Select…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.label || r.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Default Branch">
            <Select
              value={form.default_branch_id}
              onChange={(e) => setForm((f) => ({ ...f, default_branch_id: e.target.value }))}
            >
              <option value="">None</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </FormField>
          <FormField label="Assigned Branches" className="sm:col-span-2">
            <div className="max-h-40 overflow-y-auto rounded border border-slate-200 p-2">
              {branches.map((b) => (
                <label key={b.id} className="flex items-center gap-2 py-0.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.branch_ids.includes(b.id)}
                    onChange={() => toggleBranch(b.id)}
                  />
                  {b.name}
                </label>
              ))}
              {!branches.length && <p className="text-xs text-slate-400">No branches</p>}
            </div>
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Archive Staff"
        message={`Archive ${deleting?.name}?`}
        confirmText="Archive"
        danger
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
