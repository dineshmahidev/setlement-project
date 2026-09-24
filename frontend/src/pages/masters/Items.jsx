import { useEffect, useState } from 'react'
import api from '../../services/api'
import CrudPage from './CrudPage'
import { useAuth } from '../../context/AuthContext'

export default function Items() {
  const { can } = useAuth()
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/categories').catch(() => ({ data: [] })),
      api.get('/units').catch(() => ({ data: [] })),
    ]).then(([c, u]) => {
      const cl = Array.isArray(c.data) ? c.data : c.data.data || []
      const ul = Array.isArray(u.data) ? u.data : u.data.data || []
      setCategories(cl.map((x) => ({ value: x.id, label: x.name })))
      setUnits(ul.map((x) => ({ value: x.id, label: `${x.name} (${x.code})` })))
    })
  }, [])

  return (
    <CrudPage
      title="Items"
      subtitle="Item master with stock levels"
      endpoint="/items"
      canCreate={can('items.create')}
      canEdit={can('items.edit')}
      canDelete={can('items.delete')}
      searchPlaceholder="Search items…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category', render: (r) => r.category?.name },
        { key: 'unit', label: 'Unit', render: (r) => r.unit?.code },
        { key: 'min_stock_level', label: 'Min Stock', align: 'right' },
        { key: 'max_stock_level', label: 'Max Stock', align: 'right' },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'code', label: 'Item Code', required: true },
        { name: 'name', label: 'Item Name', required: true },
        { name: 'category_id', label: 'Category', type: 'select', options: categories },
        { name: 'unit_id', label: 'Unit', type: 'select', options: units },
        { name: 'min_stock_level', label: 'Min Stock Level', type: 'number', step: '0.001' },
        { name: 'max_stock_level', label: 'Max Stock Level', type: 'number', step: '0.001' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          default: 'ACTIVE',
          options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ],
        },
      ]}
      transformOut={(form) => ({
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        unit_id: form.unit_id ? Number(form.unit_id) : null,
        min_stock_level: form.min_stock_level === '' ? 0 : Number(form.min_stock_level),
        max_stock_level: form.max_stock_level === '' ? 0 : Number(form.max_stock_level),
      })}
    />
  )
}
