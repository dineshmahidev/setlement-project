import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiErrorMessage } from '../../services/api'
import {
  Plus,
  Search,
  Users2,
  Edit2,
  Trash2,
  BookOpen,
  Phone,
  Mail,
  Building,
  CreditCard,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Modal, PageSpinner, StatusBadge, ConfirmDialog } from '../../components'
import { extractList } from '../../utils/helpers'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [lookingUpGst, setLookingUpGst] = useState(false)
  const [gstFeedback, setGstFeedback] = useState('')

  const [formData, setFormData] = useState({
    vendor_code: '',
    vendor_name: '',
    business_name: '',
    address: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    gstin: '',
    pan: '',
    phone: '',
    email: '',
    contact_person: '',
    bank_name: '',
    account_number: '',
    ifsc: '',
    opening_balance: 0,
    party_type: 'both',
    status: 'active',
  })

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const res = await api.get('/vendors', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      })
      setVendors(extractList(res))
    } catch (err) {
      console.error(err)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [search, statusFilter])

  const openCreateModal = () => {
    setEditingVendor(null)
    setFormData({
      vendor_code: 'VEND-' + Math.floor(100 + Math.random() * 900),
      vendor_name: '',
      business_name: '',
      address: '',
      city: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: '',
      gstin: '',
      pan: '',
      phone: '',
      email: '',
      contact_person: '',
      bank_name: '',
      account_number: '',
      ifsc: '',
      opening_balance: 0,
      party_type: 'both',
      status: 'active',
    })
    setFormErrors({})
    setGstFeedback('')
    setModalOpen(true)
  }

  const openEditModal = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      vendor_code: vendor.vendor_code || '',
      vendor_name: vendor.vendor_name || '',
      business_name: vendor.business_name || '',
      address: vendor.address || '',
      city: vendor.city || '',
      district: vendor.district || '',
      state: vendor.state || 'Tamil Nadu',
      pincode: vendor.pincode || '',
      gstin: vendor.gstin || '',
      pan: vendor.pan || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      contact_person: vendor.contact_person || '',
      bank_name: vendor.bank_name || '',
      account_number: vendor.account_number || '',
      ifsc: vendor.ifsc || '',
      opening_balance: vendor.opening_balance || 0,
      party_type: vendor.party_type || 'both',
      status: vendor.status || 'active',
    })
    setFormErrors({})
    setGstFeedback('')
    setModalOpen(true)
  }

  const handleGstinLookup = async () => {
    const gstin = formData.gstin.trim()
    if (!gstin || gstin.length < 15) {
      setGstFeedback('Please enter a full 15-character GSTIN.')
      return
    }

    setLookingUpGst(true)
    setGstFeedback('')

    try {
      const res = await api.post('/vendors/lookup-gstin', { gstin })
      const data = res.data.data
      if (data) {
        setFormData((prev) => ({
          ...prev,
          vendor_name: data.legal_name || prev.vendor_name,
          business_name: data.trade_name || prev.business_name,
          pan: data.pan || prev.pan,
          state: data.state || prev.state,
          city: data.city || prev.city,
          address: data.address ? data.address.trim() : prev.address,
          pincode: data.pincode || prev.pincode,
        }))
        setGstFeedback(
          data.legal_name
            ? `GSTIN verified! Loaded legal details from ${data.api_source}.`
            : `Parsed PAN: ${data.pan} & State: ${data.state}`,
        )
      }
    } catch (err) {
      setGstFeedback('Could not verify online. You may enter vendor details manually.')
    } finally {
      setLookingUpGst(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})

    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.id}`, formData)
      } else {
        await api.post('/vendors', formData)
      }
      setModalOpen(false)
      fetchVendors()
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      } else {
        alert(apiErrorMessage(err, 'Failed to save vendor'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!vendorToDelete) return
    try {
      await api.delete(`/vendors/${vendorToDelete.id}`)
      setDeleteConfirmOpen(false)
      setVendorToDelete(null)
      fetchVendors()
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to delete vendor'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Vendor Master</h1>
          <p className="text-xs text-slate-500">Manage rice mills, bran suppliers, brokers, and trade accounts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          Add New Vendor
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, code, GSTIN, PAN, phone..."
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
            <PageSpinner label="Loading vendors..." />
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No vendors found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Vendor & Trade Name</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Tax IDs (GST / PAN)</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(vendors) ? vendors : []).map((v) => {
                  return (
                    <tr key={v.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">{v.vendor_code}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{v.vendor_name}</span>
                        {v.business_name && (
                          <span className="text-[11px] text-slate-500 italic block">{v.business_name}</span>
                        )}
                        {v.contact_person && (
                          <span className="text-[10.5px] text-slate-400 block">Attn: {v.contact_person}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {v.city ? `${v.city}, ` : ''}{v.state}
                        {v.pincode ? ` - ${v.pincode}` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-800 font-medium">{v.gstin || '-'}</div>
                        {v.pan && <div className="text-[10.5px] text-slate-500">PAN: {v.pan}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {v.phone && <div className="flex items-center gap-1 font-medium">{v.phone}</div>}
                        {v.email && <div className="text-[10.5px] text-slate-400 truncate max-w-[140px]">{v.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/vendor-ledger?vendor_id=${v.id}`}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            title="View statement / ledger"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => openEditModal(v)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                            title="Edit vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setVendorToDelete(v)
                              setDeleteConfirmOpen(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendor ? 'Edit Vendor Master' : 'Create Vendor Master'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* GSTIN Lookup Section */}
          <div className="rounded-xl border border-[#b37d14]/30 bg-[#fdfbf7] p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#0b3558] uppercase tracking-wide flex items-center gap-1.5">
                <Search className="w-4 h-4 text-[#b37d14]" />
                GSTIN Quick Lookup & Auto-fill
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="Enter 15-digit GSTIN"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono uppercase focus:border-[#0b3558] focus:outline-none"
                  maxLength={15}
                />
                <button
                  type="button"
                  onClick={handleGstinLookup}
                  disabled={lookingUpGst}
                  className="rounded-lg bg-[#0b3558] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/40 disabled:opacity-50 flex items-center gap-1"
                >
                  {lookingUpGst ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch Details'}
                </button>
              </div>
            </div>
            {gstFeedback && <p className="text-[11px] text-[#0b3558] mt-2 font-medium">{gstFeedback}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Vendor Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.vendor_code}
                onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. VEND-001"
              />
              {formErrors.vendor_code && <p className="text-[11px] text-red-500 mt-1">{formErrors.vendor_code[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Vendor / Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none font-semibold"
                placeholder="e.g. S.K. Sathana Traders"
              />
              {formErrors.vendor_name && <p className="text-[11px] text-red-500 mt-1">{formErrors.vendor_name[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Trade / Business Name</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. Sathana Agro Mills"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. K. Sathasivam"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Party Type</label>
              <select
                value={formData.party_type}
                onChange={(e) => setFormData({ ...formData, party_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="both">Supplier &amp; Customer</option>
                <option value="supplier">Supplier</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Street Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              placeholder="Door No, Street Name, Landmark"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">PAN Number</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none"
                placeholder="10-digit PAN"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone / Mobile</label>
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
          </div>

          {/* Bank Details & Accounting */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-500" />
              Bank & Financial Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Canara Bank"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifsc}
                  onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none font-medium"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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
              {saving ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete vendor "${vendorToDelete?.vendor_name}" (${vendorToDelete?.vendor_code})? If this vendor has existing invoices or settlements, consider deactivating them instead.`}
      />
    </div>
  )
}
