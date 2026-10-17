import React, { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resolveCompanyLogo } from '../utils/helpers'
import {
  LayoutDashboard,
  Building2,
  Users2,
  Package,
  Scale,
  BookOpen,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Boxes,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Globe,
  Search,
  Check,
  Briefcase,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Crown,
} from 'lucide-react'

const SETTLEMENT_NAVIGATION = [
  { label: 'Dashboard', to: '/panel', icon: LayoutDashboard, perm: null, end: true },
  { label: 'Vendors', to: '/panel/vendors', icon: Users2, perm: 'vendors.view' },
  { label: 'Products', to: '/panel/products', icon: Package, perm: 'products.view' },
  { label: 'Settlements', to: '/panel/settlements', icon: Scale, perm: 'settlements.view' },
  { label: 'Vendor Ledger', to: '/panel/vendor-ledger', icon: BookOpen, perm: 'vendors.view' },
]

const MASTER_ADMIN_NAVIGATION = [
  { label: 'Godowns', to: '/panel/branches', icon: Building2 },
  { label: 'Companies', to: '/panel/companies', icon: Briefcase },
  { label: 'Website CMS', to: '/panel/cms', icon: Globe },
  { label: 'Leads & Traffic', to: '/panel/leads-traffic', icon: TrendingUp },
  { label: 'Users', to: '/panel/users', icon: UserCheck },
  { label: 'Settings', to: '/panel/settings', icon: Settings },
]

const INVENTORY_NAVIGATION = [
  { id: 'inventory-overview', label: 'Inventory Dashboard', to: '/panel/inventory', icon: Package, perm: 'inventory.view', end: true },
  { id: 'inward', label: 'Inward (Receipt)', to: '/panel/inventory/inward', icon: PlusCircle, perm: 'inventory.view' },
  { id: 'outward', label: 'Outward / Dispatch', to: '/panel/inventory/outward', icon: MinusCircle, perm: 'inventory.view' },
  { id: 'lots', label: 'Lots / Stock', to: '/panel/inventory/lots', icon: Boxes, perm: 'inventory.view' },
  { id: 'items', label: 'Items', to: '/panel/inventory/items', icon: Package, perm: 'inventory.view' },
  { id: 'units', label: 'Units', to: '/panel/inventory/units', icon: Scale, perm: 'inventory.view' },
  { id: 'current-stock', label: 'Current Items Stock', to: '/panel/inventory?tab=current-stock', icon: Boxes, perm: 'inventory.view' },
  { id: 'transfer', label: 'Stock Transfer', to: '/panel/inventory?tab=transfer', icon: ArrowRightLeft, perm: 'inventory.view' },
  { id: 'ledger', label: 'Stock Ledger', to: '/panel/inventory?tab=ledger', icon: BookOpen, perm: 'inventory.view' },
]

function SuperAdminBranchSelector({ branches, branchId, setBranchId, user, companyName = 'SHRIEE LAXMI GROUP' }) {
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

function CompanySwitcher({ companies = [], activeCompany, onSelect }) {
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

  const isMulti = Boolean(companies && companies.length > 1)
  const label = activeCompany?.company_name || activeCompany?.short_name || 'LAXMI TRADERS'
  const activeLogo = resolveCompanyLogo(activeCompany)
  const resolvedLogoUrl = (activeLogo || '/logos/laxmi_traders_transparent.png').startsWith('/')
    ? (activeLogo || '/logos/laxmi_traders_transparent.png')
    : `/${activeLogo}`

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => isMulti && setOpen(!open)}
        className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1 text-xs font-bold text-[#0B1A2D] transition-all sm:text-sm border border-slate-200/90 bg-white shadow-2xs ${
          isMulti ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/40' : 'cursor-default'
        }`}
        title={isMulti ? 'Switch active company' : label}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 p-0.5 shadow-2xs">
          <img
            src={resolvedLogoUrl}
            alt={label}
            className="h-full w-full object-contain"
            onError={(e) => {
              e.currentTarget.src = '/logos/laxmi_traders_transparent.png'
            }}
          />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span className="max-w-[150px] truncate tracking-tight sm:max-w-[220px] font-extrabold text-xs text-[#0B1A2D] leading-tight">
            {label}
          </span>
          <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider leading-none mt-0.5">
            {activeCompany?.short_name || 'Active Company'}
          </span>
        </div>
        {isMulti && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              open ? 'rotate-180 text-amber-700' : ''
            }`}
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
              const cLogo = resolveCompanyLogo(c)
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 p-0.5 shadow-2xs">
                      <img
                        src={cLogo.startsWith('/') ? cLogo : `/${cLogo}`}
                        alt={c.company_name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/logos/laxmi_traders_transparent.png'
                        }}
                      />
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
  const { user, isSuperAdmin, isAdmin, isBranchManagerOrStaff, can, logout, branchId, setBranchId, branches, companies, activeCompany, setCompanyById } =
    useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { slug: companySlug } = useParams()
  const [searchParams] = useSearchParams()
  const panelBase = companySlug ? `/panel/${companySlug}` : '/panel'
  const navTo = (to) => (to === '/panel' ? panelBase : `${panelBase}${to.slice('/panel'.length)}`)

  const currentTab = searchParams.get('tab') || 'gold-dashboard'

  const displayName = user?.name || 'Administrator'
  const displayEmail = user?.email || ''
  const companyShort = activeCompany?.short_name || activeCompany?.company_name || 'LAXMI TRADERS'
  const currentCompanyLogo = resolveCompanyLogo(activeCompany)
  const isInventorySection = location.pathname.includes('/inventory')

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 lg:w-68 flex-col bg-white/95 backdrop-blur-md border-r border-slate-200/90 shadow-xs transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header (Clean White Background with Prominent Company Logo) */}
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200/90 px-3.5 bg-white text-slate-900 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/90 p-1 shadow-2xs">
            <img
              src={currentCompanyLogo.startsWith('/') ? currentCompanyLogo : `/${currentCompanyLogo}`}
              alt={companyShort}
              className="h-full w-full object-contain"
              onError={(e) => {
                e.currentTarget.src = '/logos/laxmi_traders_transparent.png'
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 flex items-center gap-1 truncate">
              {companyShort}
              <span className="rounded bg-emerald-50 border border-emerald-300/80 px-1.5 py-0.2 text-[8px] font-black text-[#02492a] uppercase">PANEL</span>
            </h1>
            <p className="text-[10.5px] font-semibold text-slate-500 truncate">
              {isInventorySection
                ? (activeCompany?.city ? `${activeCompany.city} • Godowns` : 'Inventory & Godowns')
                : (activeCompany?.city || 'Company Panel')}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 bg-slate-50/50">
          {/* SECTION 1: SETTLEMENT (Super Admin & Admin; Hidden for Branch Manager & Staff) */}
          {!isBranchManagerOrStaff && (
            <div className="space-y-1">
              <div className="px-3 pt-1 pb-1 flex items-center justify-between select-none pointer-events-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Settlement
                </span>
                <div className="h-px w-10 bg-slate-200" />
              </div>

              {SETTLEMENT_NAVIGATION.filter((item) => !item.perm || can(item.perm)).map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={navTo(item.to)}
                    end={item.end || item.to === '/panel'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[#0B1A2D] text-white shadow-xs border-l-3 border-[#C9A227]'
                          : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-950'
                      }`
                    }
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0 text-[#C9A227]" strokeWidth={2.1} />
                    <span className="truncate flex-1">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}

          {/* SECTION 2: INVENTORY (All Roles: Super Admin, Admin, Branch Manager, Staff) */}
          <div className="space-y-1 pt-2 border-t border-slate-200/70">
            <div className="px-3 pt-1 pb-1 flex items-center justify-between select-none pointer-events-none">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#B78A16] flex items-center gap-1.5">
                Inventory
              </span>
              <div className="h-px w-12 bg-amber-300" />
            </div>

            {INVENTORY_NAVIGATION.filter((item) => !item.perm || can(item.perm)).map((item) => {
              const Icon = item.icon
              const targetPath = item.to.split('?')[0]
              const targetSearch = item.to.includes('?') ? `?${item.to.split('?')[1]}` : ''
              const fullHref = navTo(targetPath) + targetSearch

              const isQueryItem = item.to.includes('?tab=')
              const isItemActive = isQueryItem
                ? location.pathname.endsWith('/inventory') && currentTab === item.id
                : item.end
                ? location.pathname === navTo(targetPath) && !location.search
                : location.pathname.startsWith(navTo(targetPath))

              return (
                <NavLink
                  key={item.id || item.to}
                  to={fullHref}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    isItemActive
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-[#C9A227] text-slate-950 font-extrabold shadow-xs border-l-3 border-amber-300'
                      : 'text-slate-700 hover:bg-amber-100/70 hover:text-amber-950'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isItemActive ? 'text-slate-950' : 'text-[#C9A227]'}`} strokeWidth={2.1} />
                  <span className="truncate flex-1">{item.label}</span>
                </NavLink>
              )
            })}
          </div>

          {/* SECTION 3: USER MANAGEMENT FOR NORMAL ADMIN (Admin can access Users, but NOT other Master Admin modules) */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-slate-200/70">
              <div className="px-3 pt-1 pb-1 flex items-center justify-between select-none pointer-events-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#0b3558]" />
                  User Management
                </span>
              </div>
              <NavLink
                to={navTo('/panel/users')}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#0B1A2D] text-white shadow-xs border-l-3 border-[#C9A227]'
                      : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-950'
                  }`
                }
              >
                <UserCheck className="w-4.5 h-4.5 shrink-0 text-[#C9A227]" strokeWidth={2.1} />
                <span className="truncate flex-1">Users & Staff</span>
              </NavLink>
            </div>
          )}

          {/* SECTION 4: MASTER ADMIN ONLY (Confidential: Godowns, Companies, CMS, Users, Settings) */}
          {isSuperAdmin && (
            <div className="space-y-1 pt-2 border-t border-slate-200/70">
              <div className="px-3 pt-1 pb-1 flex items-center justify-between select-none pointer-events-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Master Admin
                </span>
                <span className="rounded bg-amber-100 border border-amber-300 px-1 py-0.2 text-[8px] font-black text-amber-900 uppercase">
                  CONFIDENTIAL
                </span>
              </div>

              {MASTER_ADMIN_NAVIGATION.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={navTo(item.to)}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[#0B1A2D] text-white shadow-xs border-l-3 border-[#C9A227]'
                          : 'text-slate-700 hover:bg-amber-100/60 hover:text-amber-950'
                      }`
                    }
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0 text-[#C9A227]" strokeWidth={2.1} />
                    <span className="truncate flex-1">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}

          {/* VERY LAST ITEM: TRASH (SUPER ADMIN ONLY) */}
          {isSuperAdmin && (
            <div className="pt-2 border-t border-slate-200/80">
              <NavLink
                to={navTo('/panel/trash')}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-rose-900 text-white shadow-xs border-l-3 border-rose-400'
                      : 'text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                  }`
                }
              >
                <Trash2 className="w-4.5 h-4.5 shrink-0 text-rose-500" strokeWidth={2.1} />
                <span className="truncate flex-1">Trash</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User Card Footer */}
        <div className="border-t border-slate-200 p-3 bg-white/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1A2D] text-[11px] font-extrabold text-[#E0BD55] border border-amber-300/40">
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

            {/* Custom Godown Location Selector & Indicator — Only in Inventory Section */}
            {isInventorySection && (
              <SuperAdminBranchSelector
                branches={branches}
                branchId={branchId}
                setBranchId={setBranchId}
                user={user}
                companyName={companyShort}
              />
            )}
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

