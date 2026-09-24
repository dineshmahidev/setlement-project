import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { Button, DataTable, Modal, PageHeader, PageSpinner } from '../../components'

// Static catalog matching backend CoreSeeder (PermissionCatalogController not routed)
const PERMISSION_GROUPS = [
  ['Dashboard', ['dashboard.view']],
  ['Branches', ['branches.manage']],
  ['Users & Roles', ['users.manage']],
  ['Vendors', ['vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete']],
  ['Vehicles', ['vehicles.view', 'vehicles.create', 'vehicles.edit', 'vehicles.delete']],
  ['Items & Masters', ['items.view', 'items.create', 'items.edit', 'items.delete']],
  ['Settlement', ['settlement.view', 'settlement.create', 'settlement.edit', 'settlement.approve', 'settlement.cancel']],
  ['Debit Notes', ['debitnote.view', 'debitnote.create', 'debitnote.approve']],
  [
    'Inventory',
    ['inventory.view', 'inventory.stock_in', 'inventory.stock_out', 'inventory.transfer', 'inventory.adjust'],
  ],
  ['Vehicle Movements', ['vehicle.view']],
  ['Reports', ['reports.view']],
  ['Settings', ['settings.manage']],
  ['Audit', ['audit.view']],
]

const ALL_PERMS = PERMISSION_GROUPS.flatMap(([, perms]) => perms)

export default function Roles() {
  const toast = useToast()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/roles')
      setRoles(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load roles'))
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  function openEdit(role) {
    setEditing(role)
    setSelected((role.permissions || []).map((p) => p.name))
  }

  function toggle(perm) {
    setSelected((s) => (s.includes(perm) ? s.filter((p) => p !== perm) : [...s, perm]))
  }

  async function save() {
    setSaving(true)
    try {
      await api.put(`/roles/${editing.id}`, { permissions: selected })
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
      <PageHeader title="Roles & Permissions" subtitle="Toggle permissions per role" />
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
              <span className="text-xs text-slate-500">{(r.permissions || []).length} granted</span>
            ),
          },
        ]}
        actions={{
          render: (row) => (
            <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
              Edit Permissions
            </Button>
          ),
        }}
      />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Permissions — ${editing.label || editing.name}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {PERMISSION_GROUPS.map(([group, perms]) => (
            <div key={group} className="rounded border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-700">{group}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {perms.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={selected.includes(p)}
                      onChange={() => toggle(p)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-between text-xs text-slate-500">
            <span>
              {selected.length} / {ALL_PERMS.length} selected
            </span>
            <div className="flex gap-2">
              <button type="button" className="underline" onClick={() => setSelected([...ALL_PERMS])}>
                Select all
              </button>
              <button type="button" className="underline" onClick={() => setSelected([])}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
