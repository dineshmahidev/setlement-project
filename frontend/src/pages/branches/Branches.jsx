import React, { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { Plus, Search, Building2, Edit2, Trash2, CheckCircle2, XCircle, Phone, Mail, MapPin } from 'lucide-react'
import { Modal, PageSpinner, StatusBadge, ConfirmDialog } from '../../components'
import { extractList } from '../../utils/helpers'

export default function Branches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    address: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    gstin: '',
    phone: '',
    email: '',
    status: 'active',
  })

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const res = await api.get('/branches', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      })
      setBranches(extractList(res))
    } catch (err) {
      console.error(err)
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [search, statusFilter])

  const openCreateModal = () => {
    setEditingBranch(null)
    setFormData({
      branch_code: 'BR-' + Math.floor(100 + Math.random() * 900),
      branch_name: '',
      address: '',
      city: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: '',
      gstin: '33AABCS1234F1Z5',
      phone: '',
      email: '',
      status: 'active',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEditModal = (branch) => {
    setEditingBranch(branch)
    setFormData({
      branch_code: branch.branch_code || '',
      branch_name: branch.branch_name || '',
      address: branch.address || '',
      city: branch.city || '',
      district: branch.district || '',
      state: branch.state || 'Tamil Nadu',
      pincode: branch.pincode || '',
      gstin: branch.gstin || '',
      phone: branch.phone || '',
      email: branch.email || '',
      status: branch.status || 'active',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})

    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, formData)
      } else {
        await api.post('/branches', formData)
      }
      setModalOpen(false)
      fetchBranches()
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      } else {
        alert(apiErrorMessage(err, 'Failed to save branch'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!branchToDelete) return
    setDeleting(true)
    try {
      const res = await api.delete(`/branches/${branchToDelete.id}`)
      setDeleteConfirmOpen(false)
      setBranchToDelete(null)
      fetchBranches()
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to delete godown and associated records'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Godown Master</h1>
          <p className="text-xs text-slate-500">Manage godowns, plant units, processing mills and regional depots</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          Add New Godown
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search godown code, name, city, GSTIN..."
            className="w-full rounded-lg border border-slate-200 bg-[#fdfbf7] pl-9 pr-3 py-1.5 text-xs text-slate-700 focus:border-[#0b3558] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3558]/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-[#fdfbf7] px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#0b3558] focus:bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <PageSpinner label="Loading godowns..." />
          </div>
        ) : branches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No godowns match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Godown Name</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(branches) ? branches : []).map((b) => (
                  <tr key={b.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">{b.branch_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {b.branch_name}
                      {b.address && <span className="block text-[11px] text-slate-400 font-normal truncate max-w-xs">{b.address}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.city ? `${b.city}, ` : ''}{b.state}
                      {b.pincode ? ` - ${b.pincode}` : ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{b.gstin || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {b.phone}</div>}
                      {b.email && <div className="flex items-center gap-1 text-[11px] text-slate-400"><Mail className="w-3 h-3" /> {b.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(b)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-[#fbf5ea] hover:text-[#0b3558] transition-colors"
                          title="Edit godown"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#b37d14]" />
                        </button>
                        <button
                          onClick={() => {
                            setBranchToDelete(b)
                            setDeleteConfirmOpen(true)
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete godown & all data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBranch ? 'Edit Godown Master' : 'Create New Godown'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Godown Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.branch_code}
                onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. BR-KNG"
              />
              {formErrors.branch_code && <p className="text-[11px] text-red-500 mt-1">{formErrors.branch_code[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Godown Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. Kangeyam Processing Plant"
              />
              {formErrors.branch_name && <p className="text-[11px] text-red-500 mt-1">{formErrors.branch_name[0]}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              placeholder="Full street address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="15-digit GSTIN"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none font-medium"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#0b3558] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingBranch ? 'Update Godown' : 'Create Godown'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteConfirmOpen(false)
            setBranchToDelete(null)
          }
        }}
        onCancel={() => {
          if (!deleting) {
            setDeleteConfirmOpen(false)
            setBranchToDelete(null)
          }
        }}
        onConfirm={handleDelete}
        title="Delete Godown & All Associated Data"
        message={`Are you sure you want to delete godown "${branchToDelete?.branch_name}" (${branchToDelete?.branch_code})? WARNING: This will permanently delete ALL related inward receipts, outward dispatches, stock ledger, lots, mixing batches, invoices, and settlements! This action CANNOT be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Godown & All Data'}
        danger
      />
    </div>
  )
}
