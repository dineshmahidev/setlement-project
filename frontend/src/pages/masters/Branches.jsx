import CrudPage from './CrudPage'
import { useAuth } from '../../context/AuthContext'

export default function Branches() {
  const { can } = useAuth()
  return (
    <CrudPage
      title="Branches"
      subtitle="Company branches"
      endpoint="/branches"
      canCreate={can('branches.manage')}
      canEdit={can('branches.manage')}
      canDelete={can('branches.manage')}
      searchPlaceholder="Search branches…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'City' },
        { key: 'district', label: 'District' },
        { key: 'state', label: 'State' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'code', label: 'Branch Code', required: true },
        { name: 'name', label: 'Branch Name', required: true },
        { name: 'address', label: 'Address', type: 'textarea', full: true },
        { name: 'city', label: 'City' },
        { name: 'district', label: 'District' },
        { name: 'state', label: 'State' },
        { name: 'pincode', label: 'Pincode' },
        { name: 'gstin', label: 'GSTIN' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email', type: 'email' },
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
