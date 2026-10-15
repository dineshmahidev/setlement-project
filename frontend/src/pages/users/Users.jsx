import React, { useState, useEffect, useCallback, useMemo } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
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
  Layers,
  Sparkles,
  Check,
} from 'lucide-react'
import { extractList } from '../../utils/helpers'

export default function Users() {
  const toast = useToast()
  const { isSuperAdmin, isAdmin, activeCompany, companies: authCompanies } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [companies, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [accessMode, setAccessMode] = useState('custom') // 'all' | 'custom'
  const [form, setForm] = useState({
    name: '',
    employee_id: '',
    email: '',
    mobile: '',
    password: '',
    role_id: '',
    company_id: '',
    company_ids: [],
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
          search: search || undefined,
          company_id: companyFilter || undefined,
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
  }, [search, companyFilter, roleFilter, branchFilter, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Load masters: roles, companies, all branches
  useEffect(() => {
    Promise.all([
      api.get('/roles').catch(() => ({ data: { data: [] } })),
      api.get('/companies').catch(() => ({ data: { data: [] } })),
      api.get('/branches?per_page=100&all=1').catch(() => ({ data: { data: [] } })),
    ]).then(([rRes, cRes, bRes]) => {
      const roleList = rRes.data?.data?.roles || rRes.data?.roles || extractList(rRes)
      setRoles(Array.isArray(roleList) ? roleList : [])

      const compList = extractList(cRes)
      const finalCompanies = compList.length > 0 ? compList : (authCompanies || [])
      setCompanies(finalCompanies)

      const branchList = extractList(bRes)
      setBranches(Array.isArray(branchList) ? branchList : [])
    })
  }, [authCompanies])

  // Frontend safeguard: never show Super Admin users if caller is not Super Admin
  const displayedUsers = useMemo(() => {
    if (isSuperAdmin) return users
    return users.filter((u) => {
      const roleName = (u.role?.name || u.role?.label || '').toLowerCase().trim()
      if (roleName.includes('super') || roleName.includes('master')) return false
      if (u.email === 'admin@laxmitraders.com') return false
      return true
    })
  }, [users, isSuperAdmin])

  // Selectable roles: Super Admin role hidden if caller is not Super Admin
  const selectableRoles = useMemo(() => {
    if (isSuperAdmin) return roles
    return roles.filter((r) => {
      const roleName = (r.name || r.label || '').toLowerCase().trim()
      return !roleName.includes('super') && !roleName.includes('master')
    })
  }, [roles, isSuperAdmin])

  // Branches filtered for filter toolbar
  const filterToolbarGodowns = useMemo(() => {
    if (!companyFilter) return branches
    return branches.filter((b) => String(b.company_id) === String(companyFilter))
  }, [branches, companyFilter])

  // Branches available for normal admin (single selected company)
  const singleCompanyGodowns = useMemo(() => {
    if (!form.company_id) return branches
    return branches.filter((b) => String(b.company_id) === String(form.company_id))
  }, [branches, form.company_id])

  // All godowns belonging to currently selected companies (in custom multi-company mode)
  const godownsOfSelectedCompanies = useMemo(() => {
    if (!form.company_ids || form.company_ids.length === 0) return []
    const selectedCIds = form.company_ids.map(Number)
    return branches.filter((b) => selectedCIds.includes(Number(b.company_id)))
  }, [branches, form.company_ids])

  // Helper for toggling a single company selection
  const toggleCompany = (companyId) => {
    const numId = Number(companyId)
    setForm((prev) => {
      const exists = prev.company_ids.includes(numId)
      let nextCompanyIds = []
      let nextBranchIds = [...prev.branch_ids]

      if (exists) {
        nextCompanyIds = prev.company_ids.filter((id) => id !== numId)
        // Remove branches belonging to unselected company
        const companyBranchIds = branches
          .filter((b) => Number(b.company_id) === numId)
          .map((b) => Number(b.id))
        nextBranchIds = nextBranchIds.filter((id) => !companyBranchIds.includes(id))
      } else {
        nextCompanyIds = [...prev.company_ids, numId]
        // Auto-select all godowns of the newly checked company
        const newBranchIds = branches
          .filter((b) => Number(b.company_id) === numId)
          .map((b) => Number(b.id))
        nextBranchIds = Array.from(new Set([...nextBranchIds, ...newBranchIds]))
      }

      const nextCompanyId = nextCompanyIds[0] ? String(nextCompanyIds[0]) : ''
      let nextDefault = prev.default_branch_id
      if (nextDefault && !nextBranchIds.includes(Number(nextDefault))) {
        nextDefault = nextBranchIds[0] ? String(nextBranchIds[0]) : ''
      } else if (!nextDefault && nextBranchIds[0]) {
        nextDefault = String(nextBranchIds[0])
      }

      return {
        ...prev,
        company_id: nextCompanyId,
        company_ids: nextCompanyIds,
        branch_ids: nextBranchIds,
        default_branch_id: nextDefault,
      }
    })
  }

  // Select all companies & all branches
  const selectAllCompanies = () => {
    const allCompanyIds = companies.map((c) => Number(c.id))
    const allBranchIds = branches.map((b) => Number(b.id))
    setForm((prev) => ({
      ...prev,
      company_ids: allCompanyIds,
      company_id: allCompanyIds[0] ? String(allCompanyIds[0]) : '',
      branch_ids: allBranchIds,
      default_branch_id: prev.default_branch_id || (allBranchIds[0] ? String(allBranchIds[0]) : ''),
    }))
  }

  // Clear all companies & branches
  const clearAllCompanies = () => {
    setForm((prev) => ({
      ...prev,
      company_ids: [],
      company_id: '',
      branch_ids: [],
      default_branch_id: '',
    }))
  }

  // Toggle single branch
  const toggleBranch = (branchId) => {
    const numId = Number(branchId)
    setForm((prev) => {
      const exists = prev.branch_ids.includes(numId)
      const nextBranches = exists
        ? prev.branch_ids.filter((id) => id !== numId)
        : [...prev.branch_ids, numId]

      let nextDefault = prev.default_branch_id
      if (exists && String(prev.default_branch_id) === String(numId)) {
        nextDefault = nextBranches[0] ? String(nextBranches[0]) : ''
      } else if (!exists && !prev.default_branch_id) {
        nextDefault = String(numId)
      }

      return { ...prev, branch_ids: nextBranches, default_branch_id: nextDefault }
    })
  }

  // Select all godowns for a specific company
  const selectAllGodownsForCompany = (companyId) => {
    const numCId = Number(companyId)
    const godownsOfC = branches.filter((b) => Number(b.company_id) === numCId).map((b) => Number(b.id))
    setForm((prev) => {
      const merged = Array.from(new Set([...prev.branch_ids, ...godownsOfC]))
      return {
        ...prev,
        branch_ids: merged,
        default_branch_id: prev.default_branch_id || (merged[0] ? String(merged[0]) : ''),
      }
    })
  }

  // Clear all godowns for a specific company
  const clearGodownsForCompany = (companyId) => {
    const numCId = Number(companyId)
    const godownsOfC = branches.filter((b) => Number(b.company_id) === numCId).map((b) => Number(b.id))
    setForm((prev) => {
      const remaining = prev.branch_ids.filter((id) => !godownsOfC.includes(id))
      let nextDefault = prev.default_branch_id
      if (godownsOfC.includes(Number(nextDefault))) {
        nextDefault = remaining[0] ? String(remaining[0]) : ''
      }
      return {
        ...prev,
        branch_ids: remaining,
        default_branch_id: nextDefault,
      }
    })
  }

  const handleOpenCreate = () => {
    setEditingUser(null)
    setAccessMode('custom')
    const initialCompany = activeCompany?.id || companies[0]?.id || ''
    const initialGodowns = branches.filter((b) => !initialCompany || String(b.company_id) === String(initialCompany))
    const firstGodown = initialGodowns[0]?.id || ''
    const defaultRole = selectableRoles[0]?.id ? String(selectableRoles[0].id) : ''

    setForm({
      name: '',
      employee_id: '',
      email: '',
      mobile: '',
      password: '',
      role_id: defaultRole,
      company_id: initialCompany ? String(initialCompany) : '',
      company_ids: initialCompany ? [Number(initialCompany)] : [],
      default_branch_id: firstGodown ? String(firstGodown) : '',
      branch_ids: firstGodown ? [Number(firstGodown)] : [],
      status: 'active',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (u) => {
    const roleName = (u.role?.name || u.role?.label || '').toLowerCase().trim()
    if (!isSuperAdmin && (roleName.includes('super') || roleName.includes('master') || u.email === 'admin@laxmitraders.com')) {
      toast.error('Unauthorized: You cannot view or modify a Super Admin user.')
      return
    }

    setEditingUser(u)
    const userCompanyIds = (u.companies || []).map((c) => Number(c.id))
    const userBranchIds = (u.branches || []).map((b) => Number(b.id))

    const hasAllCompanies = companies.length > 0 && userCompanyIds.length >= companies.length
    const hasAllBranches = branches.length > 0 && userBranchIds.length >= branches.length
    const isEnterpriseAll = isSuperAdmin && hasAllCompanies && hasAllBranches

    setAccessMode(isEnterpriseAll ? 'all' : 'custom')

    const userCompanyId =
      u.companies?.[0]?.id ||
      u.default_branch?.company_id ||
      u.branches?.[0]?.company_id ||
      activeCompany?.id ||
      ''

    if (userCompanyId && !userCompanyIds.includes(Number(userCompanyId))) {
      userCompanyIds.push(Number(userCompanyId))
    }

    setForm({
      name: u.name || '',
      employee_id: u.employee_id || '',
      email: u.email || '',
      mobile: u.mobile || '',
      password: '',
      role_id: u.role_id ? String(u.role_id) : u.role?.id ? String(u.role.id) : '',
      company_id: userCompanyId ? String(userCompanyId) : '',
      company_ids: userCompanyIds,
      default_branch_id: u.default_branch_id ? String(u.default_branch_id) : u.default_branch?.id ? String(u.default_branch.id) : '',
      branch_ids: userBranchIds,
      status: u.status || 'active',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.role_id) {
      toast.error('Please complete Name, Email, and Security Role.')
      return
    }

    const isEnterpriseAll = isSuperAdmin && accessMode === 'all'

    if (!isEnterpriseAll && (!form.company_ids || form.company_ids.length === 0) && !form.company_id) {
      toast.error('Please select at least one Company for this user.')
      return
    }

    setSaving(true)
    try {
      let finalCompanyIds = []
      let finalBranchIds = []
      let finalCompanyId = null
      let finalDefaultBranchId = null

      if (isEnterpriseAll) {
        finalCompanyIds = companies.map((c) => Number(c.id))
        finalBranchIds = branches.map((b) => Number(b.id))
        finalCompanyId = finalCompanyIds[0] || null
        finalDefaultBranchId = form.default_branch_id ? Number(form.default_branch_id) : (finalBranchIds[0] || null)
      } else {
        finalCompanyIds = form.company_ids.length > 0
          ? form.company_ids.map(Number)
          : (form.company_id ? [Number(form.company_id)] : [])
        finalBranchIds = (form.branch_ids || []).map(Number)
        finalCompanyId = form.company_id ? Number(form.company_id) : (finalCompanyIds[0] || null)
        finalDefaultBranchId = form.default_branch_id ? Number(form.default_branch_id) : (finalBranchIds[0] || null)
      }

      const payload = {
        name: form.name.trim(),
        employee_id: form.employee_id?.trim() || null,
        email: form.email.trim(),
        mobile: form.mobile?.trim() || null,
        role_id: Number(form.role_id),
        company_id: finalCompanyId,
        company_ids: finalCompanyIds,
        default_branch_id: finalDefaultBranchId,
        branch_ids: finalBranchIds,
        all_companies: isEnterpriseAll,
        all_branches: isEnterpriseAll,
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
          toast.error('Password is required for new user account')
          setSaving(false)
          return
        }
        await api.post('/users', payload)
        toast.success('User created successfully with assigned company & godown')
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
      toast.success('User deactivated successfully')
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">User Management</h1>
            <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
              COMPANY & GODOWN ACCESS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create employee logins, assign specific Company affiliation, designate primary Godown, and configure multi-godown security scopes.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#07233b] border border-[#b37d14]/40 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#d69e2e]" />
          Create New User
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, mobile, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs focus:border-[#0b3558] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value)
              setBranchFilter('')
            }}
            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-slate-50 focus:border-[#0b3558] focus:bg-white focus:outline-none font-semibold text-slate-700"
          >
            <option value="">All Companies ({companies.length})</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-slate-50 focus:border-[#0b3558] focus:bg-white focus:outline-none font-semibold text-slate-700"
          >
            <option value="">All Godowns ({filterToolbarGodowns.length})</option>
            {filterToolbarGodowns.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name || b.name} ({b.branch_code || b.code || `ID:${b.id}`})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-slate-50 focus:border-[#0b3558] focus:bg-white focus:outline-none font-semibold text-slate-700"
          >
            <option value="">All Security Roles ({selectableRoles.length})</option>
            {selectableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label || r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-[#0b3558] text-[10px] font-black uppercase tracking-wider text-white">
              <tr>
                <th className="px-5 py-3.5 text-left font-bold text-white">Staff Member</th>
                <th className="px-4 py-3.5 text-left font-bold text-white">Role & Access</th>
                <th className="px-4 py-3.5 text-left font-bold text-white">Assigned Company</th>
                <th className="px-4 py-3.5 text-left font-bold text-white">Primary Godown</th>
                <th className="px-4 py-3.5 text-left font-bold text-white">Accessible Godowns</th>
                <th className="px-4 py-3.5 text-center font-bold text-white">Status</th>
                <th className="px-5 py-3.5 text-right font-bold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                    <div className="flex flex-col justify-center items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0b3558] border-t-transparent"></div>
                      <span className="text-xs font-semibold text-slate-600">Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((u, idx) => {
                  const hasAllCompanies =
                    companies.length > 1 &&
                    u.companies &&
                    u.companies.length >= companies.length

                  const companyText =
                    hasAllCompanies ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800 border border-sky-300">
                        All Companies ({companies.length})
                      </span>
                    ) : u.companies && u.companies.length > 0 ? (
                      u.companies.map((c) => c.company_name).join(', ')
                    ) : (
                      u.default_branch?.company?.company_name || 'Shriee Laxmi Group'
                    )

                  const hasAllBranches =
                    branches.length > 1 &&
                    u.branches &&
                    u.branches.length >= branches.length

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${idx % 2 === 0 ? 'bg-amber-50/25' : 'bg-white'} hover:bg-amber-100/40`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b3558] text-xs font-black text-amber-300 shrink-0 shadow-2xs">
                            {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{u.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {u.email}
                              </span>
                              {u.mobile && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {u.mobile}
                                  </span>
                                </>
                              )}
                            </div>
                            {u.employee_id && (
                              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                Emp ID: {u.employee_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-800 border border-slate-200">
                          <Shield className="w-3.5 h-3.5 text-[#b37d14]" />
                          {u.role?.label || u.role?.name || 'Staff'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#0b3558] shrink-0" />
                          <span className="font-bold text-[#0b3558]">{companyText}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {u.default_branch?.branch_name || u.default_branch?.name || (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </div>
                        {u.default_branch?.branch_code && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {u.default_branch.branch_code}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {hasAllBranches ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                            All Godowns ({branches.length})
                          </span>
                        ) : u.branches && u.branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.branches.slice(0, 3).map((b) => (
                              <span
                                key={b.id}
                                className="inline-block rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300/40"
                              >
                                {b.branch_name || b.name}
                              </span>
                            ))}
                            {u.branches.length > 3 && (
                              <span className="text-[10px] font-bold text-slate-500">
                                +{u.branches.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">All Company Godowns</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {String(u.status || '').toUpperCase() === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-700" /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-amber-100 hover:text-amber-900 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingUser(u)
                              setDeleteModal(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Deactivate User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-amber-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0b3558] via-[#12426c] to-[#0b3558] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-amber-300 text-base">
                  {editingUser ? 'Edit User Profile & Access Scopes' : 'Create New User Account'}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {isSuperAdmin
                    ? 'Configure role, enterprise company assignment, and godown authorizations.'
                    : 'Configure employee details, role, and branch godown authorizations.'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#0b3558] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#0b3558] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    {editingUser ? 'Password (blank to keep)' : 'Login Password *'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? '••••••••' : 'Min 6 characters'}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#0b3558] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    placeholder="EMP001"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#0b3558] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#0b3558] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Security Role */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    Security Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.role_id}
                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-[#0b3558] focus:border-[#0b3558] focus:bg-white focus:outline-none"
                  >
                    <option value="">Select Role...</option>
                    {selectableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label || r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUPER ADMIN: ENTERPRISE ACCESS SCOPE ASSIGNMENT */}
                {isSuperAdmin ? (
                  <div className="sm:col-span-2 space-y-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-amber-100/40 p-4 border-2 border-amber-300/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-black uppercase text-[#0b3558] tracking-wider">
                          Enterprise Role Assignment
                        </span>
                      </div>
                      <span className="rounded-full bg-amber-200/90 border border-amber-400 px-2.5 py-0.5 text-[10px] font-black text-amber-950">
                        SUPER ADMIN PRIVILEGE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      As Super Admin, you can assign <strong>All Branches & All Companies</strong> to any role (Admin, Branch Manager, or Staff), or select specific companies and mapped godowns.
                    </p>

                    {/* Mode Toggle Bar */}
                    <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-amber-300">
                      <button
                        type="button"
                        onClick={() => setAccessMode('all')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          accessMode === 'all'
                            ? 'bg-[#0b3558] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        All Branches & All Companies
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccessMode('custom')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          accessMode === 'custom'
                            ? 'bg-[#0b3558] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        Select Specific Companies & Godowns
                      </button>
                    </div>

                    {/* Mode A: ALL ACCESS */}
                    {accessMode === 'all' ? (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Full Enterprise Scope: All {companies.length} Companies & All {branches.length} Godowns</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          This user will have access to all registered companies and branches across the entire organization.
                        </p>

                        <div className="pt-2 border-t border-emerald-200">
                          <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">
                            Primary / Default Login Godown (Optional):
                          </label>
                          <select
                            value={form.default_branch_id}
                            onChange={(e) => setForm({ ...form, default_branch_id: e.target.value })}
                            className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="">Auto (Default to First Godown)</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.company?.company_name ? `${b.company.company_name} — ` : ''}{b.branch_name || b.name} ({b.branch_code || `ID:${b.id}`})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      /* Mode B: CUSTOM SELECTABLE COMPANIES & GODOWNS */
                      <div className="space-y-4 pt-1">
                        {/* Company Selection Header */}
                        <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase text-[#0b3558] flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-[#b37d14]" />
                              Select Companies for this User <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={selectAllCompanies}
                                className="text-[10px] font-black text-[#0b3558] hover:underline cursor-pointer"
                              >
                                Select All Companies
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={clearAllCompanies}
                                className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          {/* Company Checkboxes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {companies.map((c) => {
                              const isChecked = form.company_ids.includes(Number(c.id))
                              return (
                                <label
                                  key={c.id}
                                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-amber-100/80 border-amber-400 text-amber-950 font-bold shadow-2xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCompany(c.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#0b3558] focus:ring-[#0b3558]"
                                  />
                                  <div className="truncate">
                                    <span className="block truncate font-bold">{c.company_name}</span>
                                    <span className="text-[10px] font-mono text-slate-400">Code: {c.code}</span>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        {/* Mapped Godowns per Selected Company */}
                        {form.company_ids.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-center text-xs text-amber-900 font-semibold">
                            Select at least one company above to view and assign mapped godowns.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="block text-xs font-black uppercase text-slate-800">
                              Mapped Godowns by Selected Company
                            </label>

                            {companies
                              .filter((c) => form.company_ids.includes(Number(c.id)))
                              .map((c) => {
                                const companyGodowns = branches.filter((b) => Number(b.company_id) === Number(c.id))
                                const selectedGodownsCount = companyGodowns.filter((b) =>
                                  form.branch_ids.includes(Number(b.id)),
                                ).length

                                return (
                                  <div
                                    key={c.id}
                                    className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-[#0b3558]" />
                                        <span className="font-extrabold text-xs text-slate-900">{c.company_name}</span>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                          {selectedGodownsCount}/{companyGodowns.length} Selected
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => selectAllGodownsForCompany(c.id)}
                                          className="text-[10px] font-bold text-[#0b3558] hover:underline cursor-pointer"
                                        >
                                          Select All
                                        </button>
                                        <span className="text-slate-300">•</span>
                                        <button
                                          type="button"
                                          onClick={() => clearGodownsForCompany(c.id)}
                                          className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                        >
                                          Clear
                                        </button>
                                      </div>
                                    </div>

                                    {companyGodowns.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic py-1">
                                        No godowns registered under {c.company_name}.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pt-1">
                                        {companyGodowns.map((b) => {
                                          const isChecked = form.branch_ids.includes(Number(b.id))
                                          const isDefault = String(form.default_branch_id) === String(b.id)
                                          return (
                                            <label
                                              key={b.id}
                                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                                isChecked
                                                  ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleBranch(b.id)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#0b3558] focus:ring-[#0b3558]"
                                              />
                                              <div className="truncate flex-1">
                                                <span className="block truncate">{b.branch_name || b.name}</span>
                                                <span className="text-[10px] font-mono text-slate-400">
                                                  {b.branch_code || `ID:${b.id}`}
                                                  {isDefault && ' (Primary)'}
                                                </span>
                                              </div>
                                            </label>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                            {/* Primary Godown Selector */}
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1.5">
                              <label className="block text-xs font-black uppercase text-slate-800">
                                Primary / Default Login Godown:
                              </label>
                              <select
                                value={form.default_branch_id}
                                onChange={(e) => setForm({ ...form, default_branch_id: e.target.value })}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                              >
                                <option value="">Auto (First Selected Godown)</option>
                                {godownsOfSelectedCompanies.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.company?.company_name ? `${b.company.company_name} — ` : ''}{b.branch_name || b.name} ({b.branch_code || `ID:${b.id}`})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* NORMAL ADMIN: SCOPED COMPANY & GODOWN SELECTION */
                  <>
                    <div className="sm:col-span-2 rounded-xl bg-amber-50/70 p-3.5 border border-amber-300/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-[#0b3558] uppercase flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#b37d14]" />
                          Assigned Company <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-amber-800">
                          Controls which company books user operates
                        </span>
                      </div>
                      <select
                        value={form.company_id}
                        onChange={(e) => {
                          const newCompanyId = e.target.value
                          const godownsOfC = branches.filter((b) => String(b.company_id) === String(newCompanyId))
                          const firstGodown = godownsOfC[0]?.id || ''
                          setForm((prev) => ({
                            ...prev,
                            company_id: newCompanyId,
                            company_ids: newCompanyId ? [Number(newCompanyId)] : [],
                            default_branch_id: firstGodown ? String(firstGodown) : '',
                            branch_ids: firstGodown ? [Number(firstGodown)] : [],
                          }))
                        }}
                        required
                        className="w-full rounded-xl border border-amber-400 bg-white px-3.5 py-2 text-xs font-extrabold text-[#0b3558] focus:outline-none shadow-xs"
                      >
                        <option value="">Select Company...</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.company_name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Primary Godown */}
                    <div className="sm:col-span-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2">
                      <label className="block text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#0b3558]" />
                        Primary / Default Godown (Branch)
                      </label>
                      <select
                        value={form.default_branch_id}
                        onChange={(e) => {
                          const val = e.target.value
                          setForm((prev) => {
                            const numVal = val ? Number(val) : null
                            const nextBranches = numVal && !prev.branch_ids.includes(numVal)
                              ? [...prev.branch_ids, numVal]
                              : prev.branch_ids
                            return {
                              ...prev,
                              default_branch_id: val,
                              branch_ids: nextBranches,
                            }
                          })
                        }}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-[#0b3558] focus:outline-none"
                      >
                        <option value="">None / Not Restricted</option>
                        {singleCompanyGodowns.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branch_name || b.name} ({b.branch_code || b.code || `ID:${b.id}`})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Permitted Godowns */}
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 uppercase">
                          Permitted Godowns in Selected Company ({singleCompanyGodowns.length} available)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const ids = singleCompanyGodowns.map((b) => b.id)
                              setForm((prev) => ({
                                ...prev,
                                branch_ids: ids,
                                default_branch_id: prev.default_branch_id || (ids[0] ? String(ids[0]) : ''),
                              }))
                            }}
                            className="text-[10px] font-bold text-[#0b3558] hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                branch_ids: [],
                                default_branch_id: '',
                              }))
                            }}
                            className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {singleCompanyGodowns.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                          No godowns registered under the selected company.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto bg-slate-50/50">
                          {singleCompanyGodowns.map((b) => {
                            const isChecked = form.branch_ids.includes(Number(b.id))
                            const isDefault = String(form.default_branch_id) === String(b.id)
                            return (
                              <label
                                key={b.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleBranch(b.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-[#0b3558] focus:ring-[#0b3558]"
                                />
                                <div className="flex-1 truncate">
                                  <span className="block truncate">{b.branch_name || b.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {b.branch_code || `ID:${b.id}`}
                                    {isDefault && ' (Primary)'}
                                  </span>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Account Status */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    Account Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#0b3558] focus:bg-white focus:outline-none"
                  >
                    <option value="active">Active (Can Login & Post)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#0b3558] px-6 py-2 text-xs font-extrabold text-white hover:bg-[#07233b] border border-[#b37d14]/40 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update User Account' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Confirmation Dialog */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-4 border border-rose-200">
            <h3 className="font-black text-rose-950 text-base">Deactivate User Account?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-slate-900">{deletingUser?.name}</strong>? They will immediately lose login access across all companies and godowns.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
