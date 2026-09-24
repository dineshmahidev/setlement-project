import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { Select } from '../components/FormField'

const NAV = [
  { label: 'Dashboard', to: '/', perm: 'dashboard.view', end: true },
  {
    label: 'Masters',
    perm: 'vendors.view',
    children: [
      { label: 'Vendors', to: '/masters/vendors', perm: 'vendors.view' },
      { label: 'Items', to: '/masters/items', perm: 'items.view' },
      { label: 'Categories', to: '/masters/categories', perm: 'items.view' },
      { label: 'Vehicles', to: '/masters/vehicles', perm: 'vehicles.view' },
      { label: 'Branches', to: '/masters/branches', perm: 'branches.manage' },
      { label: 'Units', to: '/masters/units', perm: 'items.view' },
    ],
  },
  {
    label: 'Billing',
    children: [
      { label: 'Settlement Bills', to: '/billing/settlement-bills', perm: 'settlement.view' },
      { label: 'Debit Notes', to: '/billing/debit-notes', perm: 'debitnote.view' },
    ],
  },
  {
    label: 'Inventory',
    children: [
      { label: 'Current Stock', to: '/inventory/current-stock', perm: 'inventory.view' },
      { label: 'Stock In', to: '/inventory/stock-in', perm: 'inventory.stock_in' },
      { label: 'Stock Out', to: '/inventory/stock-out', perm: 'inventory.stock_out' },
      { label: 'Stock Transfer', to: '/inventory/stock-transfer', perm: 'inventory.transfer' },
      { label: 'Stock Ledger', to: '/inventory/stock-ledger', perm: 'inventory.view' },
      { label: 'Low Stock', to: '/inventory/low-stock', perm: 'inventory.view' },
    ],
  },
  { label: 'Vehicle Movements', to: '/vehicle-movements', perm: 'vehicle.view' },
  { label: 'Reports', to: '/reports', perm: 'reports.view' },
  {
    label: 'Administration',
    perm: 'users.manage',
    children: [
      { label: 'Staff', to: '/admin/staff', perm: 'users.manage' },
      { label: 'Roles & Permissions', to: '/admin/roles', perm: 'users.manage' },
      { label: 'Field Configuration', to: '/admin/field-configurations', perm: 'settings.manage' },
      { label: 'Company Settings', to: '/admin/settings', perm: 'settings.manage' },
      { label: 'Audit Logs', to: '/admin/audit-logs', perm: 'audit.view' },
    ],
  },
]

function canShow(node, can) {
  if (node.children) {
    const children = node.children.filter((c) => canShow(c, can))
    if (!children.length) return false
    return !node.perm || can(node.perm)
  }
  return !node.perm || can(node.perm)
}

function NavItem({ node, can, openGroups, toggleGroup }) {
  if (node.children) {
    const visible = node.children.filter((c) => canShow(c, can))
    if (!visible.length) return null
    const open = openGroups[node.label]
    return (
      <div className="mb-1">
        <button
          type="button"
          onClick={() => toggleGroup(node.label)}
          className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          <span>{node.label}</span>
          <span className={`text-xs transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        </button>
        {open && (
          <div className="ml-2 border-l border-slate-700 pl-2">
            {visible.map((c) => (
              <NavLink
                key={c.to}
                to={c.to}
                className={({ isActive }) =>
                  `block rounded-md px-2.5 py-1.5 text-sm ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                {c.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }
  if (!canShow(node, can)) return null
  return (
    <NavLink
      to={node.to}
      end={node.end}
      className={({ isActive }) =>
        `mb-1 block rounded-md px-2.5 py-2 text-sm font-medium ${
          isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {node.label}
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, can, logout, branchId, setBranchId, showBranchFilter, branches } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({ Masters: true, Billing: true, Inventory: true, Administration: true })

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // keep group open if active child
  useEffect(() => {
    NAV.forEach((n) => {
      if (n.children?.some((c) => location.pathname.startsWith(c.to))) {
        setOpenGroups((g) => ({ ...g, [n.label]: true }))
      }
    })
  }, [location.pathname])

  const toggleGroup = (label) => setOpenGroups((g) => ({ ...g, [label]: !g[label] }))

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-600 text-sm font-bold text-white">SV</div>
          <div>
            <p className="text-sm font-semibold text-white">SVMA Agro</p>
            <p className="text-[11px] text-slate-400">Settlement & Inventory</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.filter((n) => canShow(n, can)).map((node) =>
            node.children ? (
              <NavItem key={node.label} node={node} can={can} openGroups={openGroups} toggleGroup={toggleGroup} />
            ) : (
              <NavItem key={node.label} node={node} can={can} openGroups={openGroups} toggleGroup={toggleGroup} />
            ),
          )}
        </nav>
        <div className="border-t border-slate-800 p-3 text-xs text-slate-400">
          {user?.name}
          <div className="text-slate-500">{user?.role_label || user?.role}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            {showBranchFilter && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="hidden sm:inline">Branch</span>
                <Select
                  value={branchId || ''}
                  onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
                  className="w-44 py-1.5"
                >
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </label>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{user?.email}</span>
            <Button size="sm" variant="secondary" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
