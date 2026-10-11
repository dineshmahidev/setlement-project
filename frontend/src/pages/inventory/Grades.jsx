import CrudPage from '../masters/CrudPage'
import { useAuth } from '../../context/AuthContext'

const MATERIAL_TYPES = [
  { value: 'Raw', label: 'Raw' },
  { value: 'Boiled', label: 'Boiled' },
  { value: 'Silky', label: 'Silky' },
  { value: 'Brown', label: 'Brown' },
  { value: 'Other', label: 'Other' },
]

export default function Grades() {
  const { can } = useAuth()
  return (
    <CrudPage
      title="Grades"
      subtitle="Oil% grade rules used for lot grading & production"
      endpoint="/grades"
      canCreate={can('inventory.create')}
      canEdit={can('inventory.edit')}
      canDelete={can('inventory.delete')}
      searchPlaceholder="Search grades…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'material_type', label: 'Material Type' },
        { key: 'oil_range', label: 'Oil % Range', render: (r) => `${r.min_oil_pct ?? '—'} – ${r.max_oil_pct ?? '—'}` },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'code', label: 'Grade Code', required: true },
        { name: 'name', label: 'Grade Name', required: true },
        {
          name: 'material_type',
          label: 'Material Type',
          type: 'select',
          default: 'Raw',
          options: MATERIAL_TYPES,
        },
        { name: 'min_oil_pct', label: 'Min Oil %', type: 'number', step: '0.01' },
        { name: 'max_oil_pct', label: 'Max Oil %', type: 'number', step: '0.01' },
        { name: 'sort_order', label: 'Sort Order', type: 'number', step: '1' },
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
        min_oil_pct: form.min_oil_pct === '' ? null : Number(form.min_oil_pct),
        max_oil_pct: form.max_oil_pct === '' ? null : Number(form.max_oil_pct),
        sort_order: form.sort_order === '' ? 0 : Number(form.sort_order),
      })}
    />
  )
}
