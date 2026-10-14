import { cloneElement, isValidElement, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
import Grades from '../pages/inventory/Grades'
import Items from '../pages/inventory/Items'
import Materials from '../pages/inventory/Materials'
import Units from '../pages/masters/Units'
import Lots from '../pages/inventory/Lots'
import Inward from '../pages/inventory/Inward'
import Outward from '../pages/inventory/Outward'
import Production from '../pages/inventory/Production'
import Transfer from '../pages/inventory/Transfer'
import Companies from '../pages/admin/Companies'
import WebsiteCms from '../pages/cms/WebsiteCms'
import LeadsTraffic from '../pages/leads/LeadsTraffic'
import Trash from '../pages/trash/Trash'
import Reports from '../pages/reports/Reports'
import Users from '../pages/users/Users'
import Settings from '../pages/settings/Settings'
import AuditLogs from '../pages/audit/AuditLogs'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9A227] border-t-transparent"></div>
          <span className="text-xs font-bold text-slate-600">Authenticating session...</span>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/panel/login" replace />
  return children
}

function RequireSuperAdmin({ children }) {
  const { user, isSuperAdmin, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9A227] border-t-transparent"></div>
          <span className="text-xs font-bold text-slate-600">Verifying security clearance...</span>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/panel/login" replace />
  if (!isSuperAdmin) return <Navigate to="/panel" replace />
  return children
}

function Guest({ children }) {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9A227] border-t-transparent"></div>
      </div>
    )
  }
  return children
}

/** /panel → /panel/<active-company-slug>. On /panel/:slug itself, render normally (no redirect loop). */
function PanelHome() {
  const { slug } = useParams()
  const { activeCompany, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9A227] border-t-transparent"></div>
      </div>
    )
  }
  // Already on a company URL: CompanyShell keeps state in sync — never bounce away.
  if (slug) return <Dashboard />
  if (activeCompany?.slug) return <Navigate to={`/panel/${activeCompany.slug}`} replace />
  return <Dashboard />
}

const panelChildren = [
  <Route key="index" index element={<PanelHome />} />,

  // Restricted Confidential Routes: Super Admin / Master Admin Only
  <Route key="branches" path="branches" element={<RequireSuperAdmin><Branches /></RequireSuperAdmin>} />,
  <Route key="companies" path="companies" element={<RequireSuperAdmin><Companies /></RequireSuperAdmin>} />,
  <Route key="cms" path="cms" element={<RequireSuperAdmin><WebsiteCms /></RequireSuperAdmin>} />,
  <Route key="users" path="users" element={<RequireSuperAdmin><Users /></RequireSuperAdmin>} />,
  <Route key="settings" path="settings" element={<RequireSuperAdmin><Settings /></RequireSuperAdmin>} />,
  <Route key="audit-logs" path="audit-logs" element={<RequireSuperAdmin><AuditLogs /></RequireSuperAdmin>} />,
  <Route key="trash" path="trash" element={<RequireSuperAdmin><Trash /></RequireSuperAdmin>} />,

  // Standard Operational Routes: Accessible with role permissions
  <Route key="vendors" path="vendors" element={<Vendors />} />,
  <Route key="products" path="products" element={<Products />} />,

  <Route key="invoices" path="invoices" element={<Invoices />} />,
  <Route key="invoices-new" path="invoices/new" element={<InvoiceForm />} />,
  <Route key="invoices-edit" path="invoices/:id/edit" element={<InvoiceForm />} />,

  <Route key="settlements" path="settlements" element={<Settlements />} />,
  <Route key="settlements-new" path="settlements/new" element={<SettlementForm />} />,
  <Route key="settlements-show" path="settlements/:id" element={<SettlementForm />} />,
  <Route key="settlements-edit" path="settlements/:id/edit" element={<SettlementForm />} />,

  <Route key="debit-notes" path="debit-notes" element={<DebitNotes />} />,
  <Route key="debit-notes-new" path="debit-notes/new" element={<DebitNoteForm />} />,
  <Route key="debit-notes-show" path="debit-notes/:id" element={<DebitNoteForm />} />,
  <Route key="debit-notes-edit" path="debit-notes/:id/edit" element={<DebitNoteForm />} />,

  <Route key="inventory" path="inventory" element={<Inventory />} />,
  <Route key="inventory-items" path="inventory/items" element={<Items />} />,
  <Route key="inventory-materials" path="inventory/materials" element={<Items />} />,
  <Route key="inventory-units" path="inventory/units" element={<Units />} />,
  <Route key="inventory-grades" path="inventory/grades" element={<Grades />} />,
  <Route key="inventory-lots" path="inventory/lots" element={<Lots />} />,
  <Route key="inventory-inward" path="inventory/inward" element={<Inward />} />,
  <Route key="inventory-outward" path="inventory/outward" element={<Outward />} />,
  <Route key="inventory-production" path="inventory/production" element={<Production />} />,
  <Route key="inventory-transfer" path="inventory/transfer" element={<Transfer />} />,
  <Route key="vendor-ledger" path="vendor-ledger" element={<VendorLedger />} />,
  <Route key="reports" path="reports" element={<Reports />} />,
  <Route key="leads-traffic" path="leads-traffic" element={<LeadsTraffic />} />,
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
