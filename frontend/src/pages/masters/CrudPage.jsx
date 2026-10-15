import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { Upload, Image as ImageIcon, X } from 'lucide-react'
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
  StatusBadge,
  Textarea,
  ReplaceablePicture,
} from '../../components'

/**
 * Generic CRUD list page for master data.
 * columns: [{ key, label, render?, align? }]
 * fields: [{ name, label, type: text|number|date|email|select|textarea|checkbox, options?, required?, placeholder? }]
 * transforms: { toApi(formData), fromApi(row) }
 */
export default function CrudPage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  searchPlaceholder = 'Search…',
  createLabel,
  canCreate = true,
  canEdit = true,
  canDelete = false,
  deleteButtonLabel,
  deleteConfirmTitle,
  deleteConfirmMessage,
  deleteConfirmButton,
  deleteSuccessMessage,
  transformOut = (v) => v,
  transformIn = (v) => v,
  emptyTitle,
  extraActions,
}) {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(endpoint, { params: { search, page, per_page: perPage } })
      const d = res.data
      if (Array.isArray(d)) {
        setRows(d)
        setMeta(null)
      } else {
        setRows(d.data || [])
        setMeta(d)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, `Failed to load ${title}`))
      setRows([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [endpoint, search, page, perPage, title, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search])

  function openCreate() {
    setEditing(null)
    const init = {}
    fields.forEach((f) => {
      if (f.default !== undefined) init[f.name] = f.default
      else if (f.type === 'checkbox') init[f.name] = false
      else init[f.name] = ''
    })
    setForm(init)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    const init = {}
    fields.forEach((f) => {
      const v = row[f.name]
      if (f.type === 'checkbox') init[f.name] = v === true || v === 1 || v === '1'
      else init[f.name] = v ?? (f.default ?? '')
    })
    setForm(transformIn(init, row) || init)
    setModalOpen(true)
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let payload = { ...form }
      fields.forEach((f) => {
        if (f.type === 'number' && payload[f.name] !== '' && payload[f.name] != null) {
          payload[f.name] = Number(payload[f.name])
        }
        if (f.type === 'checkbox') payload[f.name] = payload[f.name] ? 1 : 0
      })
      payload = transformOut(payload, editing) || payload
      // drop empty strings for optional fields? keep as-is; backend nullable
      if (editing) {
        await api.put(`${endpoint}/${editing.id}`, payload)
        toast.success(`${title} updated`)
      } else {
        await api.post(endpoint, payload)
        toast.success(`${title} created`)
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
      const res = await api.delete(`${endpoint}/${deleting.id}`)
      toast.success(res?.data?.message || deleteSuccessMessage || `${title} deleted successfully`)
      setDeleting(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Delete failed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const cols = useMemo(
    () =>
      columns.map((c) => ({
        ...c,
        render: c.render
          ? c.render
          : (row) => {
              const v = row[c.key]
              if (c.status) return <StatusBadge status={v} />
              return v ?? '—'
            },
      })),
    [columns],
  )

  const actions = {
    alignClass: 'text-right',
    render: (row) => (
      <>
        {canEdit && extraActions?.(row)}
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
        )}
        {canDelete && (
          <Button size="sm" variant="danger" onClick={() => setDeleting(row)}>
            Delete
          </Button>
        )}
        {!canEdit && !canDelete && extraActions?.(row)}
      </>
    ),
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          canCreate ? (
            <Button onClick={openCreate}>{createLabel || `New ${title.replace(/s$/, '')}`}</Button>
          ) : null
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="secondary" size="md" onClick={load}>
          Refresh
        </Button>
      </div>

      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        emptyTitle={emptyTitle || `No ${title.toLowerCase()} found`}
        emptyMessage="Try adjusting your search or create a new record."
        actions={actions}
      />

      {meta && <Pagination meta={meta} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1) }} />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${title}` : `New ${title}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} form="crud-form">
              Save
            </Button>
          </>
        }
      >
        <form id="crud-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => {
            const common = {
              id: `f-${f.name}`,
              value: form[f.name] ?? '',
              onChange: (e) =>
                setField(f.name, f.type === 'checkbox' ? e.target.checked : e.target.value),
              disabled: f.disabled || (f.disabledOnEdit && editing),
            }
            if (f.type === 'select') {
              return (
                <FormField key={f.name} label={f.label} required={f.required} className={f.full ? 'sm:col-span-2' : ''}>
                  <Select {...common}>
                    <option value="">{f.placeholder || 'Select…'}</option>
                    {(f.options || []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )
            }
            if (f.type === 'textarea') {
              return (
                <FormField key={f.name} label={f.label} required={f.required} className="sm:col-span-2">
                  <Textarea {...common} rows={f.rows || 3} placeholder={f.placeholder} />
                </FormField>
              )
            }
            if (f.type === 'checkbox') {
              return (
                <label key={f.name} className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form[f.name])}
                    onChange={(e) => setField(f.name, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                    disabled={f.disabled}
                  />
                  {f.label}
                </label>
              )
            }
            if (f.type === 'image') {
              return (
                <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
                  <ReplaceablePicture
                    label={f.label}
                    sublabel={f.sublabel}
                    value={form[f.name] || ''}
                    onChange={(val) => setField(f.name, val)}
                    presets={f.presets}
                    darkBg={f.name.includes('transparent') || f.name.includes('signature')}
                    aspectRatio={f.aspectRatio || (f.name.includes('signature') ? 'signature' : f.name.includes('banner') ? 'banner' : 'logo')}
                    required={f.required}
                  />
                </div>
              )
            }
            return (
              <FormField key={f.name} label={f.label} required={f.required} className={f.full ? 'sm:col-span-2' : ''}>
                <Input
                  {...common}
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  step={f.step}
                />
              </FormField>
            )
          })}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={deleteConfirmTitle || `Delete ${title}`}
        message={
          typeof deleteConfirmMessage === 'function'
            ? deleteConfirmMessage(deleting)
            : deleteConfirmMessage ||
              `Are you sure you want to delete this ${title.toLowerCase()}? This action cannot be undone.`
        }
        confirmText={deleteConfirmButton || 'Delete'}
        danger
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
