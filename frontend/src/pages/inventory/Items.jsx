import { useEffect, useState } from 'react'
import api from '../../services/api'
import CrudPage from '../masters/CrudPage'
import { useAuth } from '../../context/AuthContext'

export default function Items() {
  const { can } = useAuth()
  const [units, setUnits] = useState([])

  useEffect(() => {
    api.get('/units?all=true').catch(() => api.get('/units').catch(() => ({ data: [] }))).then((u) => {
      const ul = Array.isArray(u.data) ? u.data : u.data?.data || []
      setUnits(ul.map((x) => ({ value: x.id, label: `${x.name} (${x.code})` })))
    })
  }, [])

  return (
    <CrudPage
      title="Items"
      subtitle="Item master with type and measurement units"
      endpoint="/items"
      canCreate={can('items.create') || can('inventory.view')}
      canEdit={can('items.edit') || can('inventory.view')}
      canDelete={can('items.delete') || can('inventory.view') || true}
      deleteButtonLabel="Delete"
      deleteConfirmTitle="Delete Item"
      deleteConfirmMessage={(item) =>
        item
          ? `Are you sure you want to delete "${item.name}"? Note: If this item is mapped to any inward/outward records, lots, or stock transactions, it cannot be deleted until those records are removed manually first.`
          : 'Are you sure you want to delete this item?'
      }
      deleteConfirmButton="Delete"
      deleteSuccessMessage="Item deleted successfully"
      searchPlaceholder="Search items…"
      columns={[
        { key: 'name', label: 'Item Name' },
        { key: 'material_type', label: 'Type' },
        {
          key: 'unit',
          label: 'Unit',
          render: (r) => (r.unit ? `${r.unit.name} (${r.unit.code})` : '—'),
        },
        { key: 'category', label: 'Category', render: (r) => r.category?.name || '—' },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'name', label: 'Item Name', required: true, placeholder: 'e.g. Sona Masoori, Bran, etc.' },
        {
          name: 'unit_id',
          label: 'Unit',
          type: 'select',
          required: true,
          options: units,
          placeholder: 'Select Unit',
        },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional remarks' },
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
        unit_id: form.unit_id ? Number(form.unit_id) : null,
      })}
    />
  )
}
