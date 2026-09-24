import { useEffect, useState } from 'react'
import api from '../../services/api'
import CrudPage from './CrudPage'
import { useAuth } from '../../context/AuthContext'

export default function Vehicles() {
  const { can } = useAuth()
  const [branches, setBranches] = useState([])

  useEffect(() => {
    api
      .get('/branches')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.data || []
        setBranches(list.map((b) => ({ value: b.id, label: b.name })))
      })
      .catch(() => {})
  }, [])

  return (
    <CrudPage
      title="Vehicles"
      subtitle="Vehicle master"
      endpoint="/vehicles"
      canCreate={can('vehicles.create')}
      canEdit={can('vehicles.edit')}
      canDelete={can('vehicles.delete')}
      searchPlaceholder="Search vehicles…"
      columns={[
        { key: 'number', label: 'Number' },
        { key: 'type', label: 'Type' },
        { key: 'driver_name', label: 'Driver' },
        { key: 'driver_mobile', label: 'Driver Mobile' },
        { key: 'owner_name', label: 'Owner' },
        { key: 'branch', label: 'Branch', render: (r) => r.branch?.name },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'number', label: 'Vehicle Number', required: true },
        { name: 'type', label: 'Vehicle Type' },
        { name: 'owner_name', label: 'Owner Name' },
        { name: 'driver_name', label: 'Driver Name' },
        { name: 'driver_mobile', label: 'Driver Mobile' },
        { name: 'rc_number', label: 'RC Number' },
        { name: 'insurance_expiry', label: 'Insurance Expiry', type: 'date' },
        { name: 'permit_expiry', label: 'Permit Expiry', type: 'date' },
        { name: 'fitness_expiry', label: 'Fitness Expiry', type: 'date' },
        { name: 'branch_id', label: 'Branch', type: 'select', options: branches },
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
        branch_id: form.branch_id ? Number(form.branch_id) : null,
      })}
    />
  )
}
