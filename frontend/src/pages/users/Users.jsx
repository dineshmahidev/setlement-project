import React, { useState, useEffect, useCallback } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  KeyRound,
} from 'lucide-react'
import { extractList } from '../../utils/helpers'

export default function Users() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    employee_id: '',
    email: '',
    mobile: '',
    password: '',
    role_id: '',
    default_branch_id: '',
    branch_ids: [],
    status: 'active',
  })

  // Delete Dialog
  const [deleteModal, setDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/users', {
        params: {
          search,
          role_id: roleFilter || undefined,
          branch_id: branchFilter || undefined,
        },
      })
      setUsers(extractList(res))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to fetch users'))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, branchFilter, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    Promise.all([
      api.get('/roles').catch(() => ({ data: { data: [] } })),
      api.get('/branches?per_page=100').catch(() => ({ data: { data: [] } })),
    ]).then(([rRes, bRes]) => {
      const roleList = rRes.data?.data?.roles || rRes.data?.roles || extractList(rRes)
      setRoles(roleList)
      setBranches(extractList(bRes))
    })
  }, [])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setForm({
      name: '',
      employee_id: '',
      email: '',
      mobile: '',
      password: '',
      role_id: roles[0]?.id || '',
      default_branch_id: branches[0]?.id || '',
      branch_ids: branches.length > 0 ? [branches[0].id] : [],
      status: 'active',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (u) => {
    setEditingUser(u)
    setForm({
      name: u.name || '',
      employee_id: u.employee_id || '',
      email: u.email || '',
      mobile: u.mobile || '',
      password: '',
      role_id: u.role_id || u.role?.id || '',
      default_branch_id: u.default_branch_id || u.default_branch?.id || '',
      branch_ids: (u.branches || []).map((b) => b.id),
      status: u.status || 'active',
    })
    setModalOpen(true)
  }

  const toggleBranch = (branchId) => {
    setForm((prev) => {
      const exists = prev.branch_ids.includes(branchId)
      const nextBranches = exists
        ? prev.branch_ids.filter((id) => id !== branchId)
        : [...prev.branch_ids, branchId]
      return { ...prev, branch_ids: nextBranches }
    })
  }

  const handleSubmit = async (e) => {
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
      if (form.password) {
        payload.password = form.password
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload)
        toast.success('User updated successfully')
      } else {
        if (!form.password) {
          toast.error('Password is required for new users')
          setSaving(false)
          return
        }
        await api.post('/users', payload)
        toast.success('User created successfully')
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save user'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setDeleting(true)
    try {
      await api.delete(`/users/${deletingUser.id}`)
      toast.success('User removed successfully')
      setDeleteModal(false)
      setDeletingUser(null)
      fetchUsers()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete user'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">
            Control employee logins, security roles, branch scopes, and system permissions.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 transition-all"
        >
          <UserPlus className="w-4 h-4 text-[#d69e2e]" />
          Create New User
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-[#fdfbf7] pl-9 pr-3 py-2 text-xs focus:border-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#0b3558]/20"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-[#fdfbf7] focus:border-[#0b3558] focus:outline-none"
          >
            <option value="">All Roles</option>
            {(Array.isArray(roles) ? roles : []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.label || r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-[#fdfbf7] focus:border-[#0b3558] focus:outline-none"
          >
            <option value="">All Assigned Godowns</option>
            {(Array.isArray(branches) ? branches : []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name || b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold text-white">Staff Member</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white">Role & Security</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white">Default Godown</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white">Accessible Godowns</th>
                <th className="px-4 py-3.5 text-center font-semibold text-white">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0b3558] border-t-transparent"></div>
                      <span>Loading staff directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                (Array.isArray(users) ? users : []).map((u) => (
                  <tr key={u.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b3558] border border-[#b37d14]/40 text-xs font-bold text-[#d69e2e]">
                          {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            <span>{u.email}</span>
                            {u.mobile && (
                              <>
                                <span>•</span>
                                <Phone className="w-3 h-3" />
                                <span>{u.mobile}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        {u.role?.label || u.role?.name || 'Staff'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      {u.default_branch?.branch_name || u.default_branch?.name || '—'}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                      {u.branches && u.branches.length > 0
                        ? u.branches.map((b) => b.branch_name || b.name).join(', ')
                        : 'All Godowns'}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {String(u.status || '').toUpperCase() === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingUser(u)
                            setDeleteModal(true)
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingUser ? 'Edit User Profile' : 'Create New User Account'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    placeholder="EMP001"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    {editingUser ? 'Password (leave blank to retain)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? '••••••••' : 'Min 6 characters'}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Security Role *
                  </label>
                  <select
                    value={form.role_id}
                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Role...</option>
                    {(Array.isArray(roles) ? roles : []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label || r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Default Assigned Godown
                  </label>
                  <select
                    value={form.default_branch_id}
                    onChange={(e) => setForm({ ...form, default_branch_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">None / All</option>
                    {(Array.isArray(branches) ? branches : []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name || b.name} ({b.branch_code || b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Allowed Multi-Godown Access
                  </label>
                  <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {(Array.isArray(branches) ? branches : []).map((b) => (
                      <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.branch_ids.includes(b.id)}
                          onChange={() => toggleBranch(b.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{b.branch_name || b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Account Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#0b3558] px-5 py-2 text-xs font-semibold text-white hover:bg-[#07233b] border border-[#b37d14]/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Remove User?</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to deactivate <span className="font-semibold text-slate-900">{deletingUser?.name}</span>? They will no longer be able to log in to the application.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
