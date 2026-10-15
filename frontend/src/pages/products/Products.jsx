import React, { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { Plus, Search, Package, Edit2, Trash2, Tag, Percent } from 'lucide-react'
import { Modal, PageSpinner, StatusBadge, ConfirmDialog } from '../../components'
import { extractList } from '../../utils/helpers'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    product_type: 'Rice Bran',
    unit: 'MT',
    default_rate: 203,
    default_cgst: 2.5,
    default_sgst: 2.5,
    default_igst: 5.0,
    status: 'active',
  })

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/products', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      })
      setProducts(extractList(res))
    } catch (err) {
      console.error(err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search, statusFilter])

  const openCreateModal = () => {
    setEditingProduct(null)
    setFormData({
      product_name: '',
      product_code: 'PROD-' + Math.floor(100 + Math.random() * 900),
      product_type: 'Rice Bran',
      unit: 'MT',
      default_rate: 203,
      default_cgst: 2.5,
      default_sgst: 2.5,
      default_igst: 5.0,
      status: 'active',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      product_name: product.product_name || '',
      product_code: product.product_code || '',
      product_type: product.product_type || 'Rice Bran',
      unit: product.unit || 'MT',
      default_rate: product.default_rate || 0,
      default_cgst: product.default_cgst || 2.5,
      default_sgst: product.default_sgst || 2.5,
      default_igst: product.default_igst || 5.0,
      status: product.status || 'active',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData)
      } else {
        await api.post('/products', formData)
      }
      setModalOpen(false)
      fetchProducts()
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      } else {
        alert(apiErrorMessage(err, 'Failed to save product'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      await api.delete(`/products/${productToDelete.id}`)
      setDeleteConfirmOpen(false)
      setProductToDelete(null)
      fetchProducts()
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to delete product'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Product Master</h1>
          <p className="text-xs text-slate-500">Configure agro products, standard units, contract rates, and GST rates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#0b3558] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#07233b] border border-[#b37d14]/30 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#d69e2e]" />
          Add New Product
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
            placeholder="Search product name, code, type..."
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
            <PageSpinner label="Loading products..." />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No products found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0e4470] bg-[#0b3558] text-[11px] font-semibold uppercase tracking-wider text-white">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category / Type</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4 text-right">Default Rate (₹)</th>
                  <th className="py-3.5 px-4 text-center">GST Rates</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(products) ? products : []).map((p) => (
                  <tr key={p.id} className="hover:bg-[#fbf5ea]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0b3558]">{p.product_code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.product_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#fdfbf7] border border-[#b37d14]/30 px-2 py-0.5 text-[11px] font-medium text-[#0b3558]">
                        <Tag className="w-3 h-3 text-[#b37d14]" />
                        {p.product_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{p.unit}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#0b3558]">
                      ₹{Number(p.default_rate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      <span className="font-mono text-[11px]">
                        CGST {Number(p.default_cgst)}% + SGST {Number(p.default_sgst)}% (IGST {Number(p.default_igst)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-[#fbf5ea] hover:text-[#0b3558] transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#b37d14]" />
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(p)
                            setDeleteConfirmOpen(true)
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete product"
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
        title={editingProduct ? 'Edit Product Master' : 'Create New Agro Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Product Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.product_code}
                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. PROD-RB2"
              />
              {formErrors.product_code && <p className="text-[11px] text-red-500 mt-1">{formErrors.product_code[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none font-semibold"
                placeholder="e.g. Rice Bran Grade II"
              />
              {formErrors.product_name && <p className="text-[11px] text-red-500 mt-1">{formErrors.product_name[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Type / Category</label>
              <input
                type="text"
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. Rice Bran"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit of Measure</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none font-semibold"
              >
                <option value="MT">MT (Metric Ton)</option>
                <option value="KG">KG (Kilogram)</option>
                <option value="BAG">BAG</option>
                <option value="QTL">QTL (Quintal)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Rate (₹ / MT)</label>
              <input
                type="number"
                step="0.01"
                value={formData.default_rate}
                onChange={(e) => setFormData({ ...formData, default_rate: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-slate-500" />
              Configured GST Tax Rates (%)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">CGST Rate (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.default_cgst}
                  onChange={(e) => setFormData({ ...formData, default_cgst: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">SGST Rate (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.default_sgst}
                  onChange={(e) => setFormData({ ...formData, default_sgst: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">IGST Rate (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.default_igst}
                  onChange={(e) => setFormData({ ...formData, default_igst: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
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
              {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.product_name}"?`}
      />
    </div>
  )
}
