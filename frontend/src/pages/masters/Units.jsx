import CrudPage from './CrudPage'
import { useAuth } from '../../context/AuthContext'

export default function Units() {
  const { can } = useAuth()
  return (
    <CrudPage
      title="Units"
      subtitle="Measurement units"
      endpoint="/units"
      canCreate={can('items.create')}
      canEdit={can('items.edit')}
      canDelete={can('items.delete')}
      searchPlaceholder="Search units…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'name', label: 'Unit Name', required: true },
        { name: 'code', label: 'Code (e.g. KG)', required: true },
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
    />
  )
}
