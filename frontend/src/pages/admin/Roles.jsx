import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { Button, DataTable, Modal, PageHeader, PageSpinner } from '../../components'

const SUPER_ROLES = ['super_admin', 'superadmin', 'master_admin', 'masteradmin']
const HIDDEN_MODULES = new Set(['audit', 'branches', 'companies', 'settings'])

function groupLabel(module) {
  return String(module || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isSuperRole(role) {
  const name = String(role?.name || '').toLowerCase().trim()
  return SUPER_ROLES.includes(name) || name.includes('super') || name.includes('master')
}

export default function Roles() {
  const toast = useToast()
  const [roles, setRoles] = useState([])
  const [catalog, setCatalog] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/roles')
      const payload = res.data?.data || res.data || {}
      setRoles(Array.isArray(payload.roles) ? payload.roles : [])
      setCatalog(payload.permissions && typeof payload.permissions === 'object' ? payload.permissions : {})
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load roles'))
      setRoles([])
      setCatalog({})
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const groups = useMemo(
    () =>
      Object.entries(catalog)
        .filter(([module]) => !HIDDEN_MODULES.has(module))
        .map(([module, perms]) => [
          module,
          (Array.isArray(perms) ? perms : []).slice().sort((a, b) => a.name.localeCompare(b.name)),
        ])
        .sort(([a], [b]) => groupLabel(a).localeCompare(groupLabel(b))),
    [catalog],
  )

  const allPerms = useMemo(
    () => groups.flatMap(([, perms]) => perms.map((p) => p.name)),
    [groups],
  )

  const hiddenPerms = useMemo(
    () =>
      Object.entries(catalog)
        .filter(([module]) => HIDDEN_MODULES.has(module))
        .flatMap(([, perms]) => (Array.isArray(perms) ? perms : []).map((p) => p.name)),
    [catalog],
  )

  const readOnly = Boolean(editing && isSuperRole(editing))

  function openEdit(role) {
    setEditing(role)
    const hidden = new Set(hiddenPerms)
    const granted = (role.permissions || []).map((p) => p.name).filter((name) => !hidden.has(name))
    setSelected(isSuperRole(role) ? [...allPerms] : granted)
  }

  function toggle(perm) {
    if (readOnly) return
    setSelected((s) => (s.includes(perm) ? s.filter((p) => p !== perm) : [...s, perm]))
  }

  function toggleGroup(perms, checked) {
    if (readOnly) return
    const names = perms.map((p) => p.name)
    setSelected((s) => {
      const next = new Set(s)
      names.forEach((name) => (checked ? next.add(name) : next.delete(name)))
      return [...next]
    })
  }

  async function save() {
    if (readOnly) {
      setEditing(null)
      return
    }
    setSaving(true)
    try {
      const preserved = (editing.permissions || [])
        .map((p) => p.name)
        .filter((name) => hiddenPerms.includes(name))
      await api.put(`/roles/${editing.id}`, { permissions: [...new Set([...selected, ...preserved])] })
      toast.success('Role permissions saved')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !roles.length) return <PageSpinner />

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Tick or untick CRUD access for each role and screen" />
      <DataTable
        loading={loading}
        rows={roles}
        emptyTitle="No roles"
        columns={[
          { key: 'name', label: 'Role' },
          { key: 'label', label: 'Label' },
          {
            key: 'permissions',
            label: 'Permissions',
            render: (r) => (
              <span className="text-xs text-slate-500">
                {isSuperRole(r) ? 'Full access (always)' : `${(r.permissions || []).length} granted`}
              </span>
            ),
          },
        ]}
        actions={{
          render: (row) => (
            <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
              {isSuperRole(row) ? 'View Permissions' : 'Edit Permissions'}
            </Button>
          ),
        }}
      />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Permissions - ${editing.label || editing.name}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button onClick={save} loading={saving}>
                Save
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {readOnly && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Super Admin always has full access. These permissions are shown for reference only.
            </div>
          )}

          <p className="text-xs text-slate-500">
            Master-admin-only permissions (branches, companies, settings, audit) are reserved for Super Admin and are
            hidden here.
          </p>

          {groups.length === 0 && (
            <p className="rounded border border-slate-200 p-3 text-sm text-slate-500">
              No permission catalog found.
            </p>
          )}

          {groups.map(([module, perms]) => {
            const grantedCount = perms.filter((p) => selected.includes(p.name)).length
            const allChecked = perms.length > 0 && grantedCount === perms.length
            return (
              <div key={module} className="rounded border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">
                    {groupLabel(module)}
                    <span className="ml-2 text-[11px] font-medium text-slate-400">
                      {grantedCount}/{perms.length}
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={readOnly}
                    className="text-[11px] font-semibold text-violet-700 underline disabled:cursor-not-allowed disabled:text-slate-400"
                    onClick={() => toggleGroup(perms, !allChecked)}
                  >
                    {allChecked ? 'Clear module' : 'Select module'}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {perms.map((p) => (
                    <label key={p.name} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.name)}
                        onChange={() => toggle(p.name)}
                        disabled={readOnly}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="truncate" title={p.name}>
                        {p.label || p.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="flex justify-between text-xs text-slate-500">
            <span>
              {selected.length} / {allPerms.length} selected
            </span>
            {!readOnly && (
              <div className="flex gap-2">
                <button type="button" className="underline" onClick={() => setSelected([...allPerms])}>
                  Select all
                </button>
                <button type="button" className="underline" onClick={() => setSelected([])}>
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
