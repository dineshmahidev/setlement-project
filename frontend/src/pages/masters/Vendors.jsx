import { useEffect, useState } from 'react'
import api from '../../services/api'
import CrudPage from './CrudPage'
import { useAuth } from '../../context/AuthContext'

export default function Vendors() {
  const { can } = useAuth()
  const [branchOpts, setBranchOpts] = useState([])

  useEffect(() => {
    api
      .get('/branches')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.data || []
        setBranchOpts(list.map((b) => ({ value: b.id, label: b.name })))
      })
      .catch(() => {})
  }, [])

  return (
    <CrudPage
      title="Vendors"
      subtitle="Vendor master data"
      endpoint="/vendors"
      canCreate={can('vendors.create')}
      canEdit={can('vendors.edit')}
      canDelete={can('vendors.delete')}
      searchPlaceholder="Search vendors…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'gst_number', label: 'GSTIN' },
        { key: 'phone', label: 'Phone' },
        { key: 'po_number', label: 'PO Number' },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'code', label: 'Vendor Code', required: true },
        { name: 'name', label: 'Vendor Name', required: true },
        { name: 'address', label: 'Address', type: 'textarea', full: true },
        { name: 'city', label: 'City' },
        { name: 'district', label: 'District' },
        { name: 'state', label: 'State' },
        { name: 'pincode', label: 'Pincode' },
        { name: 'gst_number', label: 'GST Number' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'pan', label: 'PAN' },
        { name: 'po_number', label: 'PO Number' },
        {
          name: 'default_branch_id',
          label: 'Default Branch',
          type: 'select',
          options: branchOpts,
        },
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
      transformOut={(form) => {
        const out = { ...form }
        if (!out.default_branch_id) out.default_branch_id = null
        else out.default_branch_id = Number(out.default_branch_id)
        return out
      }}
    />
  )
}
