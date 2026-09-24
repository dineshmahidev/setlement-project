import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import { PageSpinner } from '../components'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Vendors from '../pages/masters/Vendors'
import Items from '../pages/masters/Items'
import Categories from '../pages/masters/Categories'
import Vehicles from '../pages/masters/Vehicles'
import Branches from '../pages/masters/Branches'
import Units from '../pages/masters/Units'
import SettlementList, { SettlementForm } from '../pages/billing/SettlementBills'
import DebitNoteList, { DebitNoteForm } from '../pages/billing/DebitNotes'
import {
  CurrentStock,
  LowStock,
  StockIn,
  StockLedger,
  StockOut,
  StockTransfer,
} from '../pages/inventory/Inventory'
import VehicleMovements from '../pages/vehicle/VehicleMovements'
import Reports from '../pages/Reports'
import Staff from '../pages/admin/Staff'
import Roles from '../pages/admin/Roles'
import FieldConfiguration from '../pages/admin/FieldConfiguration'
import CompanySettings from '../pages/admin/CompanySettings'
import AuditLogs from '../pages/admin/AuditLogs'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageSpinner label="Checking session…" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Guest({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageSpinner label="Loading…" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return children
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-800">404 — Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you requested does not exist.</p>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Guest>
              <Login />
            </Guest>
          }
        />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="masters/vendors" element={<Vendors />} />
          <Route path="masters/items" element={<Items />} />
          <Route path="masters/categories" element={<Categories />} />
          <Route path="masters/vehicles" element={<Vehicles />} />
          <Route path="masters/branches" element={<Branches />} />
          <Route path="masters/units" element={<Units />} />

          <Route path="billing/settlement-bills" element={<SettlementList />} />
          <Route path="billing/settlement-bills/new" element={<SettlementForm />} />
          <Route path="billing/settlement-bills/:id/edit" element={<SettlementForm />} />
          <Route path="billing/debit-notes" element={<DebitNoteList />} />
          <Route path="billing/debit-notes/new" element={<DebitNoteForm />} />
          <Route path="billing/debit-notes/:id/edit" element={<DebitNoteForm />} />

          <Route path="inventory/current-stock" element={<CurrentStock />} />
          <Route path="inventory/stock-in" element={<StockIn />} />
          <Route path="inventory/stock-out" element={<StockOut />} />
          <Route path="inventory/stock-transfer" element={<StockTransfer />} />
          <Route path="inventory/stock-ledger" element={<StockLedger />} />
          <Route path="inventory/low-stock" element={<LowStock />} />

          <Route path="vehicle-movements" element={<VehicleMovements />} />
          <Route path="reports" element={<Reports />} />

          <Route path="admin/staff" element={<Staff />} />
          <Route path="admin/roles" element={<Roles />} />
          <Route path="admin/field-configurations" element={<FieldConfiguration />} />
          <Route path="admin/settings" element={<CompanySettings />} />
          <Route path="admin/audit-logs" element={<AuditLogs />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
