import { cloneElement, isValidElement, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Seo from '../website/components/Seo'
import AuthLoader from '../components/AuthLoader'

// Shriee Laxmi Group Corporate Website Imports
import WebsiteLayout from '../website/layouts/WebsiteLayout'
import HomePage from '../website/pages/HomePage'
import AboutPage from '../website/pages/AboutPage'
import OurBusinessesPage from '../website/pages/OurBusinessesPage'
import ProductsServicesPage from '../website/pages/ProductsServicesPage'
import OurPresencePage from '../website/pages/OurPresencePage'
import ContactPage from '../website/pages/ContactPage'
import LaxmiTradersPage from '../website/pages/LaxmiTradersPage'
import SMTradersPage from '../website/pages/SMTradersPage'
import ShrieeFeedsPage from '../website/pages/ShrieeFeedsPage'

// Management App Panel Imports
import AppLayout from '../layouts/AppLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Branches from '../pages/branches/Branches'
import Vendors from '../pages/vendors/Vendors'
import Products from '../pages/products/Products'
import Invoices from '../pages/invoices/Invoices'
import InvoiceForm from '../pages/invoices/InvoiceForm'
import Settlements from '../pages/settlements/Settlements'
import SettlementForm from '../pages/settlements/SettlementForm'
import DebitNotes from '../pages/debit_notes/DebitNotes'
import DebitNoteForm from '../pages/debit_notes/DebitNoteForm'
import VendorLedger from '../pages/ledger/VendorLedger'
import Inventory from '../pages/inventory/Inventory'
import Items from '../pages/inventory/Items'
import Units from '../pages/masters/Units'
import Lots from '../pages/inventory/Lots'
import Inward from '../pages/inventory/Inward'
import Outward from '../pages/inventory/Outward'
import Production from '../pages/inventory/Production'
import Transfer from '../pages/inventory/Transfer'
import Companies from '../pages/admin/Companies'
import LogoManagement from '../pages/admin/LogoManagement'
import WebsiteCms from '../pages/cms/WebsiteCms'
import LeadsTraffic from '../pages/leads/LeadsTraffic'
import Trash from '../pages/trash/Trash'
import Reports from '../pages/reports/Reports'
import Users from '../pages/users/Users'
import Roles from '../pages/admin/Roles'
import Settings from '../pages/settings/Settings'
import AuditLogs from '../pages/audit/AuditLogs'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoader label="Authenticating session…" />
  if (!user) return <Navigate to="/panel/login" replace />
  return children
}

function RequireSuperAdmin({ children }) {
  const { user, isSuperAdmin, loading } = useAuth()
  if (loading) return <AuthLoader label="Verifying security clearance…" />
  if (!user) return <Navigate to="/panel/login" replace />
  if (!isSuperAdmin) return <Navigate to="/panel" replace />
  return children
}

function RequirePermission({ permission, children }) {
  const { user, can, loading } = useAuth()
  if (loading) return <AuthLoader label="Checking module access." />
  if (!user) return <Navigate to="/panel/login" replace />
  if (!can(permission)) return <Navigate to="/panel" replace />
  return children
}

function Guest({ children }) {
  const { loading } = useAuth()
  if (loading) return <AuthLoader label="Preparing sign-in…" />
  return children
}

/** /panel → /panel/<active-company-slug>. On /panel/:slug itself, render normally (no redirect loop). */
function PanelHome() {
  const { slug } = useParams()
  const { activeCompany, can, loading } = useAuth()
  if (loading) return <AuthLoader label="Loading company workspace." />

  if (!can('dashboard.view')) {
    const firstAllowed = [
      ['inventory.view', '/inventory'],
      ['settlements.view', '/settlements'],
      ['invoices.view', '/invoices'],
      ['debit_notes.view', '/debit-notes'],
      ['vendor_ledger.view', '/vendor-ledger'],
      ['vendors.view', '/vendors'],
      ['products.view', '/products'],
      ['reports.view', '/reports'],
      ['users.view', '/users'],
    ].find(([permission]) => can(permission))?.[1]

    if (firstAllowed) {
      const base = slug ? `/panel/${slug}` : activeCompany?.slug ? `/panel/${activeCompany.slug}` : '/panel'
      return <Navigate to={`${base}${firstAllowed}`} replace />
    }
  }

  // Already on a company URL: CompanyShell keeps state in sync - never bounce away.
  if (slug) return <Dashboard />
  if (activeCompany?.slug) return <Navigate to={`/panel/${activeCompany.slug}`} replace />
  return <Dashboard />
}

const panelChildren = [
  <Route key="index" index element={<PanelHome />} />,

  // Restricted Confidential Routes: Super Admin / Master Admin Only
  <Route key="branches" path="branches" element={<RequireSuperAdmin><Branches /></RequireSuperAdmin>} />,
  <Route key="companies" path="companies" element={<RequireSuperAdmin><Companies /></RequireSuperAdmin>} />,
  <Route key="logo-management" path="logo-management" element={<RequireSuperAdmin><LogoManagement /></RequireSuperAdmin>} />,
  <Route key="cms" path="cms" element={<RequireSuperAdmin><WebsiteCms /></RequireSuperAdmin>} />,
  <Route key="settings" path="settings" element={<RequireSuperAdmin><Settings /></RequireSuperAdmin>} />,
  <Route key="audit-logs" path="audit-logs" element={<RequireSuperAdmin><AuditLogs /></RequireSuperAdmin>} />,
  <Route key="trash" path="trash" element={<RequireSuperAdmin><Trash /></RequireSuperAdmin>} />,
  <Route key="leads-traffic" path="leads-traffic" element={<RequireSuperAdmin><LeadsTraffic /></RequireSuperAdmin>} />,

  // User Management: permission based
  <Route key="users" path="users" element={<RequirePermission permission="users.view"><Users /></RequirePermission>} />,
  <Route key="roles" path="roles" element={<RequireSuperAdmin><Roles /></RequireSuperAdmin>} />,

  // Settlement & Operational Routes: permission based
  <Route key="vendors" path="vendors" element={<RequirePermission permission="vendors.view"><Vendors /></RequirePermission>} />,
  <Route key="products" path="products" element={<RequirePermission permission="products.view"><Products /></RequirePermission>} />,

  <Route key="invoices" path="invoices" element={<RequirePermission permission="invoices.view"><Invoices /></RequirePermission>} />,
  <Route key="invoices-new" path="invoices/new" element={<RequirePermission permission="invoices.create"><InvoiceForm /></RequirePermission>} />,
  <Route key="invoices-edit" path="invoices/:id/edit" element={<RequirePermission permission="invoices.edit"><InvoiceForm /></RequirePermission>} />,

  <Route key="settlements" path="settlements" element={<RequirePermission permission="settlements.view"><Settlements /></RequirePermission>} />,
  <Route key="settlements-new" path="settlements/new" element={<RequirePermission permission="settlements.create"><SettlementForm /></RequirePermission>} />,
  <Route key="settlements-show" path="settlements/:id" element={<RequirePermission permission="settlements.view"><SettlementForm /></RequirePermission>} />,
  <Route key="settlements-edit" path="settlements/:id/edit" element={<RequirePermission permission="settlements.edit"><SettlementForm /></RequirePermission>} />,

  <Route key="debit-notes" path="debit-notes" element={<RequirePermission permission="debit_notes.view"><DebitNotes /></RequirePermission>} />,
  <Route key="debit-notes-new" path="debit-notes/new" element={<RequirePermission permission="debit_notes.create"><DebitNoteForm /></RequirePermission>} />,
  <Route key="debit-notes-show" path="debit-notes/:id" element={<RequirePermission permission="debit_notes.view"><DebitNoteForm /></RequirePermission>} />,
  <Route key="debit-notes-edit" path="debit-notes/:id/edit" element={<RequirePermission permission="debit_notes.edit"><DebitNoteForm /></RequirePermission>} />,

  <Route key="vendor-ledger" path="vendor-ledger" element={<RequirePermission permission="vendor_ledger.view"><VendorLedger /></RequirePermission>} />,
  <Route key="reports" path="reports" element={<RequirePermission permission="reports.view"><Reports /></RequirePermission>} />,

  // Inventory Routes: permission based
  <Route key="inventory" path="inventory" element={<RequirePermission permission="inventory.view"><Inventory /></RequirePermission>} />,
  <Route key="inventory-items" path="inventory/items" element={<RequirePermission permission="products.view"><Items /></RequirePermission>} />,
  <Route key="inventory-materials" path="inventory/materials" element={<RequirePermission permission="products.view"><Items /></RequirePermission>} />,
  <Route key="inventory-units" path="inventory/units" element={<RequirePermission permission="products.view"><Units /></RequirePermission>} />,
  <Route key="inventory-lots" path="inventory/lots" element={<RequirePermission permission="inventory.view"><Lots /></RequirePermission>} />,
  <Route key="inventory-inward" path="inventory/inward" element={<RequirePermission permission="inventory.view"><Inward /></RequirePermission>} />,
  <Route key="inventory-outward" path="inventory/outward" element={<RequirePermission permission="inventory.view"><Outward /></RequirePermission>} />,
  <Route key="inventory-production" path="inventory/production" element={<RequirePermission permission="inventory.view"><Production /></RequirePermission>} />,
  <Route key="inventory-transfer" path="inventory/transfer" element={<RequirePermission permission="inventory.transfer"><Transfer /></RequirePermission>} />,
]

/** Keeps the URL in sync with the active company (/panel/:slug/...) and
 *  remounts the whole panel on company change so every page refetches
 *  with the new X-Company-Id header (stale lists showed wrong company PDFs). */
function CompanyShell({ children }) {
  const { slug } = useParams()
  const { setCompanyBySlug, companyId } = useAuth()

  useEffect(() => {
    if (slug) setCompanyBySlug(slug)
  }, [slug, setCompanyBySlug])

  return isValidElement(children) ? cloneElement(children, { key: companyId || slug }) : children
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Seo />
      <Routes>
        {/* SHRIEE LAXMI GROUP Corporate Website Routes */}
        <Route path="/" element={<WebsiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="our-businesses" element={<OurBusinessesPage />} />
          <Route path="products-services" element={<ProductsServicesPage />} />
          <Route path="our-presence" element={<OurPresencePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="business/laxmi-traders" element={<LaxmiTradersPage />} />
          <Route path="business/sm-traders" element={<SMTradersPage />} />
          <Route path="business/shriee-feeds" element={<ShrieeFeedsPage />} />
        </Route>

        {/* Management App Panel Routes under /panel */}
        <Route
          path="/panel/login"
          element={
            <Guest>
              <Login />
            </Guest>
          }
        />
        <Route path="/login" element={<Navigate to="/panel/login" replace />} />

        <Route
          path="/panel"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          {panelChildren}
        </Route>

        {/* Company-specific panel: /panel/laxmi, /panel/sm, /panel/shriee */}
        <Route
          path="/panel/:slug"
          element={
            <Protected>
              <CompanyShell>
                <AppLayout />
              </CompanyShell>
            </Protected>
          }
        >
          {panelChildren}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
