import React, { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import CompanyLogo from '../components/CompanyLogo'
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
  Globe,
  Search,
  Check,
  Briefcase,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Crown,
  Factory,
  ArrowRightLeft,
  Image,
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
  { label: 'Logo Management', to: '/panel/logo-management', icon: Image },
  { label: 'Website CMS', to: '/panel/cms', icon: Globe },
  { label: 'Leads & Traffic', to: '/panel/leads-traffic', icon: TrendingUp },
  { label: 'Users', to: '/panel/users', icon: UserCheck },
  { label: 'Settings', to: '/panel/settings', icon: Settings },
]

const INVENTORY_NAVIGATION = [
  { id: 'inventory-overview', label: 'Inventory Dashboard', to: '/panel/inventory', icon: Package, perm: 'inventory.view', end: true },
  { id: 'inward', label: 'Inward (Receipt)', to: '/panel/inventory/inward', icon: PlusCircle, perm: 'inventory.view' },
  { id: 'outward', label: 'Outward / Dispatch', to: '/panel/inventory/outward', icon: MinusCircle, perm: 'inventory.view' },
  { id: 'production', label: 'Mixing / Production', to: '/panel/inventory/production', icon: Factory, perm: 'inventory.view' },
  { id: 'transfer', label: 'Stock Transfer', to: '/panel/inventory?tab=transfer', icon: ArrowRightLeft, perm: 'inventory.view' },
  { id: 'lots', label: 'Lotwise Stock', to: '/panel/inventory/lots', icon: Boxes, perm: 'inventory.view' },
  { id: 'current-stock', label: 'Current Items Stock', to: '/panel/inventory?tab=current-stock', icon: Boxes, perm: 'inventory.view' },
  { id: 'ledger', label: 'Stock Ledger', to: '/panel/inventory?tab=ledger', icon: BookOpen, perm: 'inventory.view' },
  { id: 'items', label: 'Items', to: '/panel/inventory/items', icon: Package, perm: 'inventory.view' },
  { id: 'units', label: 'Units', to: '/panel/inventory/units', icon: Scale, perm: 'inventory.view' },
]

const navItemCls = (isActive) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
    isActive
      ? 'bg-[#C6F432] text-slate-950 font-extrabold shadow-lg shadow-lime-400/20'
      : 'text-slate-400 hover:bg-white/10 hover:text-white'
  }`

const sectionLabelCls =
  'px-3 pt-1 pb-1 flex items-center justify-between select-none pointer-events-none'

function SuperAdminBranchSelector({ branches, branchId, setBranchId, user, companyName = 'SHRIEE LAXMI GROUP' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [summary, setSummary] = useState(null)
  const dropdownRef = useRef(null)

  const fetchSummary = useCallback(() => {
    // Consolidated stock across every godown (no branch_id → company-wide totals).
    api
      .get('/lots/summary')
      .then((res) => setSummary(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // Retry whenever the switcher opens so totals never stay missing.
  useEffect(() => {
    if (open) fetchSummary()
  }, [open, fetchSummary])

  const fmtQty = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })
  const fmtValue = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`

  // Per-godown combined stock (sum of by_item rows per branch) from the same call.
  const branchTotals = {}
  for (const row of summary?.by_item || []) {
    const key = row.branch_id
    if (!branchTotals[key]) branchTotals[key] = { qty: 0, value: 0 }
    branchTotals[key].qty += Number(row.available_qty) || 0
    branchTotals[key].value += Number(row.stock_value) || 0
  }
  const combined = summary?.totals || null

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
          isMulti ? 'hover:text-violet-700 hover:bg-slate-100/80 cursor-pointer' : 'cursor-default'
        }`}
      >
        <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
        <span className="truncate max-w-[240px] sm:max-w-[340px] tracking-tight">
          {selectedBranch
            ? `${companyName} - ${selectedBranch.branch_name || selectedBranch.name}`
            : branchId
            ? `${companyName} - Godown #${branchId}`
            : `${companyName} - ALL GODOWNS${combined ? ` (${fmtQty(combined.total_qty)} MT)` : ''}`}
        </span>
        {isMulti && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              open ? 'rotate-180 text-violet-700' : ''
            }`}
          />
        )}
      </button>

      {/* Popover Glass Menu */}
      {open && isMulti && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-violet-200/80 shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-violet-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C6F432] text-slate-950 font-black">
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
            <span className="rounded-full bg-violet-100 border border-violet-300 px-2 py-0.5 text-[9px] font-black text-violet-800">
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
              className="w-full rounded-xl border border-slate-300 bg-slate-50/80 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none"
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
                ? 'border-violet-300 bg-violet-50 shadow-2xs font-bold text-violet-900'
                : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-lime-300 font-black">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#0B1A2D]">All Godowns (Consolidated)</div>
                <div className="text-[10px] text-slate-500">
                  {combined
                    ? `Combined stock: ${fmtQty(combined.total_qty)} MT • ${fmtValue(combined.total_value)}`
                    : 'Live combined stock across all branches'}
                </div>
              </div>
            </div>
            {branchId === null && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C6F432] text-slate-950 font-black">
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
                        ? 'border-violet-300 bg-violet-50 shadow-2xs font-bold text-violet-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-800 font-bold shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-violet-500" />
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

                    {branchTotals[b.id] && (
                      <span className="text-[10px] font-bold text-slate-500 shrink-0 mr-1">
                        {fmtQty(branchTotals[b.id].qty)} MT
                      </span>
                    )}

                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C6F432] text-slate-950 font-black shrink-0">
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
  const label = activeCompany?.company_name || activeCompany?.short_name || 'Active Company'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => isMulti && setOpen(!open)}
        className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1 text-xs font-bold text-[#0B1A2D] transition-all sm:text-sm border border-slate-200/90 bg-white shadow-2xs ${
          isMulti ? 'cursor-pointer hover:border-violet-400 hover:bg-violet-50/50' : 'cursor-default'
        }`}
        title={isMulti ? 'Switch active company' : label}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 p-0.5 shadow-2xs">
          <CompanyLogo company={activeCompany} initialsClass="text-[9px]" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span className="max-w-[150px] truncate tracking-tight sm:max-w-[220px] font-extrabold text-xs text-[#0B1A2D] leading-tight">
            {label}
          </span>
          <span className="text-[9px] font-bold text-violet-700 uppercase tracking-wider leading-none mt-0.5">
            {activeCompany?.short_name || 'Active Company'}
          </span>
        </div>
        {isMulti && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              open ? 'rotate-180 text-violet-700' : ''
            }`}
          />
        )}
      </button>

      {open && isMulti && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-2xl border border-violet-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 sm:w-96">
          <div className="flex items-center justify-between border-b border-violet-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C6F432] font-black text-slate-950">
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
                      ? 'border-violet-300 bg-violet-50 font-bold text-violet-900 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 p-0.5 shadow-2xs">
                      <CompanyLogo company={c} initialsClass="text-[10px]" />
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
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C6F432] font-black text-slate-950">
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
  const companyShort = activeCompany?.short_name || activeCompany?.company_name || 'Active Company'
  const isInventorySection = location.pathname.includes('/inventory')

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#EADFFF] via-[#F7F2FF] to-[#E3D6FF] font-sans text-slate-800">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-2 bottom-2 left-2 z-50 flex w-64 lg:w-68 flex-col rounded-[26px] bg-[#14151C] ring-1 ring-white/10 shadow-2xl shadow-black/40 overflow-hidden transition-transform duration-200 ease-in-out lg:static lg:m-2 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 p-1">
            <CompanyLogo
              company={activeCompany}
              initialsClass="text-sm text-[#C6F432]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5 truncate">
              {companyShort}
              <span className="rounded-md bg-[#C6F432] px-1.5 py-0.5 text-[8px] font-black text-slate-950 uppercase">PANEL</span>
            </h1>
            <p className="text-[10.5px] font-semibold text-slate-400 truncate">
              {isInventorySection
                ? (activeCompany?.city ? `${activeCompany.city} • Godowns` : 'Inventory & Godowns')
                : (activeCompany?.city || 'Company Panel')}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
          {/* SECTION 1: SETTLEMENT (Super Admin & Admin; Hidden for Branch Manager & Staff) */}
          {!isBranchManagerOrStaff && (
            <div className="space-y-1">
              <div className={sectionLabelCls}>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Settlement
                </span>
                <div className="h-px w-10 bg-white/10" />
              </div>

              {SETTLEMENT_NAVIGATION.filter((item) => !item.perm || can(item.perm)).map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={navTo(item.to)}
                    end={item.end || item.to === '/panel'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => navItemCls(isActive)}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2.1} />
                    <span className="truncate flex-1">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}

          {/* SECTION 2: INVENTORY (All Roles: Super Admin, Admin, Branch Manager, Staff) */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            <div className={sectionLabelCls}>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                Inventory
              </span>
              <div className="h-px w-12 bg-white/10" />
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
                  className={navItemCls(isItemActive)}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2.1} />
                  <span className="truncate flex-1">{item.label}</span>
                </NavLink>
              )
            })}
          </div>

          {/* SECTION 3: USER MANAGEMENT FOR NORMAL ADMIN (Admin can access Users, but NOT other Master Admin modules) */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-white/10">
              <div className={sectionLabelCls}>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  User Management
                </span>
              </div>
              <NavLink
                to={navTo('/panel/users')}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => navItemCls(isActive)}
              >
                <UserCheck className="w-[18px] h-[18px] shrink-0" strokeWidth={2.1} />
                <span className="truncate flex-1">Users & Staff</span>
              </NavLink>
            </div>
          )}

          {/* SECTION 4: MASTER ADMIN ONLY (Confidential: Godowns, Companies, CMS, Users, Settings) */}
          {isSuperAdmin && (
            <div className="space-y-1 pt-2 border-t border-white/10">
              <div className={sectionLabelCls}>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Master Admin
                </span>
                <span className="rounded-md bg-amber-400/15 border border-amber-400/40 px-1 py-0.2 text-[8px] font-black text-amber-300 uppercase">
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
                    className={({ isActive }) => navItemCls(isActive)}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2.1} />
                    <span className="truncate flex-1">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}

          {/* VERY LAST ITEM: TRASH (SUPER ADMIN ONLY) */}
          {isSuperAdmin && (
            <div className="pt-2 border-t border-white/10">
              <NavLink
                to={navTo('/panel/trash')}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => navItemCls(isActive)}
              >
                <Trash2 className="w-[18px] h-[18px] shrink-0" strokeWidth={2.1} />
                <span className="truncate flex-1">Trash</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User Card Footer — lime accent card */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#C6F432] p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#14151C] text-[11px] font-extrabold text-[#C6F432]">
                {displayName ? displayName.slice(0, 2).toUpperCase() : 'LG'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-950 truncate">{displayName}</p>
                <p className="text-[10px] font-semibold text-slate-700 truncate">{user?.role?.label || 'Administrator'}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="rounded-xl p-2 text-[#C6F432] bg-[#14151C] hover:bg-slate-800 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-slate-800">
        {/* Top Navbar — blends with page background */}
        <header className="flex h-14 items-center justify-between px-4 lg:px-8 z-20">
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
            <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden bg-[#C6F432] ring-2 ring-white shadow-md" title={`${displayName} — click sidebar footer to logout`}>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-950">
                {displayName ? displayName.slice(0, 2).toUpperCase() : 'LG'}
              </span>
              <img
                src={`https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(displayEmail || displayName || 'user')}&backgroundColor=c6f432,ddd6fe,a78bfa`}
                alt={displayName}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main id="panel-main" className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

