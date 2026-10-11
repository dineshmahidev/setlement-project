import CrudPage from '../masters/CrudPage'
import { useAuth } from '../../context/AuthContext'

const MATERIAL_TYPES = [
  { value: 'Raw', label: 'Raw' },
  { value: 'Boiled', label: 'Boiled' },
  { value: 'Silky', label: 'Silky' },
  { value: 'Brown', label: 'Brown' },
  { value: 'Other', label: 'Other' },
]

export default function Materials() {
  const { can } = useAuth()
  return (
    <CrudPage
      title="Materials"
      subtitle="Material master with type, default oil% and stock levels"
      endpoint="/materials"
      canCreate={can('items.create')}
      canEdit={can('items.edit')}
      canDelete={can('items.delete')}
      searchPlaceholder="Search materials…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'material_type', label: 'Type' },
        { key: 'default_oil_pct', label: 'Oil %', align: 'right', render: (r) => (r.default_oil_pct != null ? `${r.default_oil_pct}` : '—') },
        { key: 'category', label: 'Category', render: (r) => r.category?.name || '—' },
        { key: 'unit', label: 'Unit', render: (r) => r.unit?.code || '—' },
        { key: 'min_stock_level', label: 'Min', align: 'right' },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'code', label: 'Material Code', required: true },
        { name: 'name', label: 'Material Name', required: true },
        { name: 'material_type', label: 'Material Type', type: 'select', default: 'Raw', options: MATERIAL_TYPES },
        { name: 'default_oil_pct', label: 'Default Oil %', type: 'number', step: '0.01' },
        { name: 'category_id', label: 'Category', type: 'select', options: [] },
        { name: 'unit_id', label: 'Unit', type: 'select', options: [] },
        { name: 'min_stock_level', label: 'Min Stock Level', type: 'number', step: '0.001' },
        { name: 'max_stock_level', label: 'Max Stock Level', type: 'number', step: '0.001' },
        { name: 'description', label: 'Description', type: 'textarea' },
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
        default_oil_pct: form.default_oil_pct === '' ? null : Number(form.default_oil_pct),
        min_stock_level: form.min_stock_level === '' ? 0 : Number(form.min_stock_level),
        max_stock_level: form.max_stock_level === '' ? 0 : Number(form.max_stock_level),
      })}
    />
  )
}
