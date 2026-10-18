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
        {
          key: 'logo_transparent_path',
          label: 'Logo',
          render: (r) => {
            const logo = r.logo_transparent_path || r.logo_path || '/logos/laxmi_traders_transparent.png'
            return (
              <div className="flex items-center gap-2">
                <img
                  src={logo.startsWith('/') ? logo : `/${logo}`}
                  alt={r.company_name}
                  className="h-8 w-8 object-contain bg-white border border-slate-200 rounded p-1 shadow-2xs"
                  onError={(e) => {
                    e.currentTarget.src = '/logos/laxmi_traders_transparent.png'
                  }}
                />
              </div>
            )
          },
        },
        { key: 'code', label: 'Code' },
        { key: 'company_name', label: 'Company Name' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'state', label: 'State' },
        {
          key: 'branches',
          label: 'Godowns',
          render: (r) =>
            (r.branches || []).map((b) => b.branch_name || b.name).join(', ') ||
            (r.branches_count ? `${r.branches_count} godown${r.branches_count > 1 ? 's' : ''}` : '0'),
        },
        {
          key: 'signature_path',
          label: 'Digital Signature',
          render: (r) =>
            r.signature_path ? (
              <div className="flex items-center gap-2">
                <img
                  src={r.signature_path}
                  alt="Signature"
                  className="h-7 max-w-[90px] object-contain bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs"
                />
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic">Default</span>
            ),
        },
        { key: 'status', label: 'Status', status: true },
        {
          key: 'sort_order',
          label: 'Order',
          render: (r) => (
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-bold text-slate-600">
              {r.sort_order ?? '—'}
              {Number(r.sort_order) === 1 && (
                <span className="rounded bg-amber-100 px-1 text-[9px] font-black uppercase text-amber-800">Default</span>
              )}
            </span>
          ),
        },
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
        {
          name: 'signature_path',
          label: 'Digital Signature (Replaceable Picture)',
          type: 'image',
          full: true,
          presets: [
            { label: 'Laxmi Traders', value: '/signatures/laxmi_signature.png' },
            { label: 'S M Traders', value: '/signatures/sm_signature.png' },
            { label: 'Shriee Feeds', value: '/signatures/shriee_signature.png' },
            { label: 'Default Group', value: '/signatures/default_signature.png' },
          ],
        },
        {
          name: 'logo_transparent_path',
          label: 'Transparent Logo (Replaceable Picture)',
          type: 'image',
          presets: [
            { label: 'Laxmi Transparent', value: '/logos/laxmi_traders_transparent.png' },
            { label: 'SM Transparent', value: '/logos/sm_traders_transparent.png' },
            { label: 'Shree Feeds Transparent', value: '/logos/shree_feeds_transparent.png' },
          ],
        },
        {
          name: 'logo_path',
          label: 'Solid Logo (Replaceable Picture)',
          type: 'image',
          presets: [
            { label: 'Laxmi Solid', value: '/logos/laxmi_traders.png' },
            { label: 'SM Solid', value: '/logos/sm_traders.png' },
            { label: 'Shree Feeds Solid', value: '/logos/shree_feeds.png' },
          ],
        },
        {
          name: 'banner_path',
          label: 'Hero Banner (Replaceable Picture)',
          type: 'image',
          full: true,
          presets: [
            { label: 'Homepage Banner', value: '/banners/homepage_banner.png' },
            { label: 'Laxmi Traders Banner', value: '/banners/laxmi_traders_banner.png' },
            { label: 'Shree Feeds Banner', value: '/banners/shree_feeds_banner.png' },
            { label: 'SM Traders Banner', value: '/banners/sm_traders_banner.png' },
          ],
        },
        { name: 'authorized_signatory_title', label: 'Signatory Title (e.g. Authorized Signatory)' },
        { name: 'address', label: 'Address', type: 'textarea', full: true },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          default: 'ACTIVE',
          options: STATUSES,
        },
        {
          name: 'sort_order',
          label: 'Switch Order / Default (1 = first in switcher = default company)',
          type: 'number',
          hint: 'Companies are listed in the navbar switcher by this number. Order 1 becomes the default company on login.',
        },
      ]}
      transformOut={(form) => ({ ...form })}
    />
  )
}
