import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/bursar/DashboardPage'
import StudentsPage from './pages/bursar/StudentsPage'
import PaymentsPage from './pages/bursar/PaymentsPage'
import FeesPage from './pages/bursar/FeesPage'
import DefaultersPage from './pages/bursar/DefaultersPage'
import ExpensesPage from './pages/bursar/ExpensesPage'
import ReportsPage from './pages/bursar/ReportsPage'
import FeeStructurePage from './pages/bursar/FeeStructurePage'
import SettingsPage from './pages/bursar/SettingsPage'
import InstalmentPlansPage from './pages/bursar/InstalmentPlansPage'
import ImportStudentsPage from './pages/bursar/ImportStudentsPage'
import PettyCashPage from './pages/bursar/PettyCashPage'
import DiscountsPage from './pages/bursar/DiscountsPage'
import AuditLogPage from './pages/bursar/AuditLogPage'
import StaffPage from './pages/bursar/StaffPage'
import ParentPortal from './pages/parent/ParentPortal'
import PaymentLinkPage from './pages/parent/PaymentLinkPage'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import SchoolsPage from './pages/super-admin/SchoolsPage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ink)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9"/></svg>
        </div>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Loading Kalimex…</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'super_admin') return <Navigate to="/super-admin" replace />
  if (user.role === 'parent') return <Navigate to="/parent" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Public — no auth */}
      <Route path="/pay/:token" element={<PaymentLinkPage />} />

      {/* Parent portal */}
      <Route path="/parent" element={<ProtectedRoute roles={['parent','school_admin','super_admin']}><ParentPortal /></ProtectedRoute>} />

      {/* Super admin */}
      <Route path="/super-admin" element={<ProtectedRoute roles={['super_admin']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="schools" element={<SchoolsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* School staff */}
      <Route element={<ProtectedRoute roles={['school_admin','bursar','receptionist']}><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"             element={<DashboardPage />} />
        <Route path="/students"              element={<StudentsPage />} />
        <Route path="/students/import"       element={<ImportStudentsPage />} />
        <Route path="/payments"              element={<PaymentsPage />} />
        <Route path="/payments/new"          element={<PaymentsPage />} />
        <Route path="/payments/link"         element={<PaymentsPage />} />
        <Route path="/fees"                  element={<FeesPage />} />
        <Route path="/expenses"              element={<ExpensesPage />} />
        <Route path="/expenses/petty-cash"   element={<PettyCashPage />} />
        <Route path="/defaulters"            element={<DefaultersPage />} />
        <Route path="/reports"               element={<ReportsPage />} />
        <Route path="/fee-structure"         element={<FeeStructurePage />} />
        <Route path="/discounts"             element={<DiscountsPage />} />
        <Route path="/instalments"           element={<InstalmentPlansPage />} />
        <Route path="/audit"                 element={<AuditLogPage />} />
        <Route path="/staff"                  element={<StaffPage />} />
        <Route path="/settings"              element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'var(--font)', fontSize: 13, borderRadius: 10, border: '1px solid var(--line)', boxShadow: 'var(--shadow)' },
            success: { iconTheme: { primary: 'var(--green)', secondary: 'white' } },
            error:   { iconTheme: { primary: 'var(--red)',   secondary: 'white' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
