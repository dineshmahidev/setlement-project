import CrudPage from './CrudPage'
import { useAuth } from '../../context/AuthContext'

export default function Categories() {
  const { can } = useAuth()
  return (
    <CrudPage
      title="Categories"
      subtitle="Item categories"
      endpoint="/categories"
      canCreate={can('items.create')}
      canEdit={can('items.edit')}
      canDelete={can('items.delete')}
      searchPlaceholder="Search categories…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'name', label: 'Category Name', required: true },
        { name: 'code', label: 'Code' },
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
    />
  )
}
