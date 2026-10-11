import React, { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Building2,
  Users2,
  Package,
  Receipt,
  Scale,
  FileText,
  BookOpen,
  BarChart3,
  UserCheck,
  Settings,
  History,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Building,
  Sparkles,
  Boxes,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Crown,
  Globe,
  Search,
  Check,
  Briefcase,
} from 'lucide-react'

const NAVIGATION = [
  { label: 'Dashboard', to: '/panel', icon: LayoutDashboard, perm: null, end: true },
  { label: 'Godowns', to: '/panel/branches', icon: Building2, perm: 'branches.view' },
  { label: 'Vendors', to: '/panel/vendors', icon: Users2, perm: 'vendors.view' },
  { label: 'Products', to: '/panel/products', icon: Package, perm: 'products.view' },
  { label: 'Settlements', to: '/panel/settlements', icon: Scale, perm: 'settlements.view' },
  { label: 'Debit Notes', to: '/panel/debit-notes', icon: FileText, perm: 'debit_notes.view' },
  { label: 'Inventory', to: '/panel/inventory', icon: Package, perm: 'inventory.view', isGold: true },
  { label: 'Reports', to: '/panel/reports', icon: BarChart3, perm: 'reports.view' },
  { label: 'Users', to: '/panel/users', icon: UserCheck, perm: 'users.view' },
  { label: 'Companies', to: '/panel/companies', icon: Briefcase, perm: 'companies.view' },
  { label: 'Settings', to: '/panel/settings', icon: Settings, perm: 'settings.view' },
  { label: 'Audit Logs', to: '/panel/audit-logs', icon: History, perm: 'audit.view' },
]

const INVENTORY_SUBTABS = [
  { id: 'inward', label: 'Inward (Receipt)', icon: PlusCircle, to: '/panel/inventory/inward' },
  { id: 'outward', label: 'Outward / Dispatch', icon: MinusCircle, to: '/panel/inventory/outward' },
  { id: 'production', label: 'Mixing / Production', icon: ArrowRightLeft, to: '/panel/inventory/production' },
  { id: 'transfer', label: 'Stock Transfer', icon: ArrowRightLeft, to: '/panel/inventory/transfer' },
  { id: 'lots', label: 'Lots / Stock', icon: Boxes, to: '/panel/inventory/lots' },
  { id: 'materials', label: 'Materials', icon: Package, to: '/panel/inventory/materials' },
  { id: 'grades', label: 'Grades', icon: BookOpen, to: '/panel/inventory/grades' },
  { id: 'gold-dashboard', label: 'Gold Party Dashboard', icon: Package, to: '/panel/inventory?tab=gold-dashboard' },
  { id: 'current-stock', label: 'Current Items Stock', icon: Boxes, to: '/panel/inventory?tab=current-stock' },
  { id: 'ledger', label: 'Stock Ledger', icon: BookOpen, to: '/panel/inventory?tab=ledger' },
]

function SuperAdminBranchSelector({ branches, branchId, setBranchId, user, companyName = 'LAXMI GROUP' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Only resolve from the (company-scoped) branches list — never fall back to a
  // default_branch belonging to the previous company after a switch.
  const selectedBranch = (branches || []).find((b) => Number(b.id) === Number(branchId)) || null

  const isMulti = (branches && branches.length > 1) || user?.is_super_admin || user?.role?.name === 'SUPER ADMIN'

  const filteredBranches = (branches || []).filter((b) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (b.branch_name || b.name || '').toLowerCase().includes(q) ||
      (b.branch_code || b.code || '').toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Inline Location Trigger Header */}
      <button
        type="button"
        onClick={() => isMulti && setOpen(!open)}
        className={`flex items-center gap-2 px-2 py-1 text-xs sm:text-sm font-bold text-[#0B1A2D] transition-colors rounded-lg ${
          isMulti ? 'hover:text-amber-700 hover:bg-slate-100/80 cursor-pointer' : 'cursor-default'
        }`}
      >
        <Building2 className="w-4 h-4 text-[#C9A227] shrink-0" />
        <span className="truncate max-w-[240px] sm:max-w-[340px] tracking-tight">
          {selectedBranch
            ? `${companyName} - ${selectedBranch.branch_name || selectedBranch.name}`
            : branchId
            ? `${companyName} - Godown #${branchId}`
            : `${companyName} - ALL GODOWNS`}
        </span>
        {isMulti && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              open ? 'rotate-180 text-amber-700' : ''
            }`}
          />
        )}
      </button>

      {/* Popover Glass Menu */}
      {open && isMulti && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border-2 border-amber-300/80 shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-black">
                <Crown className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#0B1A2D] uppercase tracking-wide">
                  Godown Location Switcher
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {branches.length} Operational Locations Available
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[9px] font-black text-amber-900">
              SUPER ADMIN ACCESS
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search godown name, code or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/80 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Consolidated Option */}
          <div
            onClick={() => {
              setBranchId(null)
              setOpen(false)
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
              branchId === null
                ? 'border-amber-400 bg-gradient-to-r from-amber-100/90 to-amber-50 shadow-2xs font-bold text-amber-950'
                : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-amber-300 font-black">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#0B1A2D]">All Godowns (Consolidated)</div>
                <div className="text-[10px] text-slate-500">Live combined stock across all branches</div>
              </div>
            </div>
            {branchId === null && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Individual Godowns List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-1">
              Select Specific Godown:
            </span>

            {filteredBranches.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">No godowns match search.</div>
            ) : (
              filteredBranches.map((b) => {
                const isSelected = Number(branchId) === Number(b.id)
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setBranchId(Number(b.id))
                      setOpen(false)
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-gradient-to-r from-amber-100/90 to-amber-50 shadow-2xs font-bold text-amber-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-800 font-bold shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-[#C9A227]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#0B1A2D] truncate">
                          {b.branch_name || b.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>Code: {b.branch_code || b.code || `BR-${b.id}`}</span>
                          {b.city && <span>• {b.city}</span>}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CompanySwitcher({ companies, activeCompany, onSelect }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!companies || companies.length === 0) return null

  const isMulti = companies.length > 1
  const label = activeCompany?.company_name || activeCompany?.short_name || 'Select Company'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => isMulti && setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold text-[#0B1A2D] transition-colors sm:text-sm ${
          isMulti ? 'cursor-pointer hover:bg-slate-100/80 hover:text-amber-700' : 'cursor-default'
        }`}
      >
        <Briefcase className="w-4 h-4 shrink-0 text-[#C9A227]" />
        <span className="max-w-[180px] truncate tracking-tight sm:max-w-[260px]">{label}</span>
        {isMulti && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180 text-amber-700' : ''}`}
          />
        )}
      </button>

      {open && isMulti && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-2xl border-2 border-amber-300/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 sm:w-96">
          <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 font-black text-slate-950">
                <Briefcase className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0B1A2D]">Company Switcher</h4>
                <p className="text-[10px] font-medium text-slate-500">{companies.length} companies available</p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {companies.map((c) => {
              const isSelected = Number(activeCompany?.id) === Number(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelect(c)
                    setOpen(false)
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-gradient-to-r from-amber-100/90 to-amber-50 font-bold text-amber-950 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-800">
                      <Building className="w-3.5 h-3.5 text-[#C9A227]" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-extrabold text-[#0B1A2D]">{c.company_name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        {c.gstin && <span>GSTIN: {c.gstin}</span>}
                        {c.city && <span>• {c.city}</span>}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 font-black text-slate-950">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { user, can, logout, branchId, setBranchId, showBranchFilter, branches, companies, activeCompany, setCompanyById } =
    useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { slug: companySlug } = useParams()
  const [searchParams] = useSearchParams()
  const panelBase = companySlug ? `/panel/${companySlug}` : '/panel'
  const navTo = (to) => (to === '/panel' ? panelBase : `${panelBase}${to.slice('/panel'.length)}`)

  const currentTab = searchParams.get('tab') || 'gold-dashboard'
  const isInventoryActive = location.pathname.includes('/inventory')

  const displayName = user?.name || 'Administrator'
  const displayEmail = user?.email || ''
  const companyShort = activeCompany?.short_name || activeCompany?.company_name || 'LAXMI GROUP'

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#FFF5F7] via-[#F8FAFC] to-[#F0F7FF] font-sans text-slate-800">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col bg-white/90 backdrop-blur-md border-r border-slate-200/80 shadow-xs transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-200/80 px-4 bg-gradient-to-r from-[#0B1A2D] to-[#162A45] text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-[#C9A227] text-slate-950 font-black shadow-xs">
            <Scale className="w-4 h-4 text-slate-950" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1 truncate">
              {companyShort} <span className="rounded bg-[#C9A227]/20 border border-[#C9A227]/40 px-1 py-0.2 text-[8px] font-bold text-[#E0BD55] uppercase">PANEL</span>
            </h1>
            <p className="text-[9px] text-slate-300 truncate">Settlement & Management</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 bg-slate-50/40">
          {NAVIGATION.filter((item) => !item.perm || can(item.perm)).map((item) => {
            const Icon = item.icon
            const isGoldItem = item.isGold
            const isInventory = item.to === '/panel/inventory'

            return (
              <div key={item.to} className="space-y-1">
                <NavLink
                  to={navTo(item.to)}
                  end={item.end || item.to === '/panel'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      isGoldItem && isActive
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-[#C9A227] text-slate-950 font-extrabold shadow-sm border-l-4 border-amber-300'
                        : isGoldItem
                        ? 'bg-amber-100/70 text-amber-900 border border-amber-300/80 font-bold hover:bg-amber-200/80'
                        : isActive
                        ? 'bg-[#0B1A2D] text-white shadow-xs border-l-3 border-[#C9A227]'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isGoldItem ? 'text-amber-600' : 'text-[#C9A227]'}`} />
                  <span className="truncate text-xs flex-1">{item.label}</span>
                  {isInventory && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isInventoryActive ? 'rotate-180 text-amber-900' : 'text-slate-400'
                      }`}
                    />
                  )}
                  {isGoldItem && !isInventory && (
                    <span className="rounded-full bg-amber-400/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                      GOLD
                    </span>
                  )}
                </NavLink>

                {/* Nested Inventory Sub-Menu in Sidebar */}
                {isInventory && isInventoryActive && (
                  <div className="ml-3 pl-3 border-l-2 border-amber-300/60 space-y-1 py-1">
                    {INVENTORY_SUBTABS.map((sub) => {
                      const SubIcon = sub.icon
                      const subHref = navTo(sub.to.split('?')[0]) + (sub.to.includes('?') ? `?${sub.to.split('?')[1]}` : '')
                      const isSubActive =
                        sub.to.includes('?tab=') ? currentTab === sub.id : location.pathname === subHref.split('?')[0]
                      return (
                        <NavLink
                          key={sub.id}
                          to={subHref}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                            isSubActive
                              ? 'bg-[#0B1A2D] text-amber-300 font-extrabold shadow-2xs'
                              : 'text-slate-600 hover:bg-amber-100/60 hover:text-amber-900'
                          }`}
                        >
                          <SubIcon className={`w-3 h-3 ${isSubActive ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="truncate">{sub.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Card Footer */}
        <div className="border-t border-slate-200/80 p-3 bg-white/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B1A2D] text-[11px] font-extrabold text-[#E0BD55] border border-amber-300/40">
                {displayName ? displayName.slice(0, 2).toUpperCase() : 'LG'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0B1A2D] truncate">{displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.role?.label || 'Administrator'}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="rounded-lg p-1.5 text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-slate-800">
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 lg:px-6 shadow-2xs z-20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>

            <CompanySwitcher
              companies={companies}
              activeCompany={activeCompany}
              onSelect={(c) => {
                setCompanyById(c.id)
                if (c.slug) navigate(`/panel/${c.slug}`)
              }}
            />

            {/* Custom Godown Location Selector & Indicator */}
            <SuperAdminBranchSelector
              branches={branches}
              branchId={branchId}
              setBranchId={setBranchId}
              user={user}
              companyName={companyShort}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-[#0B1A2D]">{displayName}</span>
              <span className="text-[10px] text-slate-500">{displayEmail}</span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 hover:border-red-700 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline text-xs font-bold">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 lg:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

