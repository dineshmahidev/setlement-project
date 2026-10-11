import CrudPage from '../masters/CrudPage'

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export default function Companies() {
  return (
    <CrudPage
      title="Companies"
      subtitle="Registered companies (multi-tenant) and their branches"
      endpoint="/companies"
      canCreate
      canEdit
      canDelete
      searchPlaceholder="Search companies…"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'company_name', label: 'Company Name' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'state', label: 'State' },
        {
          key: 'branches',
          label: 'Godowns',
          render: (r) =>
            (r.branches || []).map((b) => b.branch_name || b.name).join(', ') ||
            (Array.isArray(r.branch_ids) ? r.branch_ids.length : 0),
        },
        { key: 'status', label: 'Status', status: true },
      ]}
      fields={[
        { name: 'code', label: 'Company Code', required: true, disabledOnEdit: true },
        { name: 'slug', label: 'Panel Slug', required: true, disabledOnEdit: true },
        { name: 'company_name', label: 'Company Name', required: true },
        { name: 'tagline', label: 'Tagline' },
        { name: 'short_name', label: 'Short Name' },
        { name: 'settlement_prefix', label: 'Settlement Prefix' },
        { name: 'trade_name', label: 'Trade Name' },
        { name: 'gstin', label: 'GSTIN' },
        { name: 'state', label: 'State' },
        { name: 'state_code', label: 'State Code' },
        { name: 'pincode', label: 'Pincode' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Address', type: 'textarea', full: true },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          default: 'ACTIVE',
          options: STATUSES,
        },
      ]}
      transformOut={(form) => ({ ...form })}
    />
  )
}
