import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, Receipt, CreditCard,
  Settings, LogOut, Building2, ChevronRight,
  FileText, Wallet, AlertCircle, BookOpen, Calendar,
  Percent, Upload, PiggyBank, Shield, Menu, X, Bell
} from 'lucide-react'
import { Avatar, Badge } from '../ui'
import { roleLabel } from '../../lib/permissions'

const roleNavItems = {
  super_admin: [
    { icon: LayoutDashboard, label: 'Dashboard',    to: '/super-admin' },
    { icon: Building2,       label: 'Schools',      to: '/super-admin/schools' },
    { icon: Settings,        label: 'Settings',     to: '/super-admin/settings' },
  ],
  school_admin: [
    { icon: LayoutDashboard, label: 'Overview',        to: '/dashboard' },
    { icon: Users,           label: 'Students',         to: '/students' },
    { icon: Receipt,         label: 'Fees & Invoices',  to: '/fees' },
    { icon: CreditCard,      label: 'Payments',         to: '/payments' },
    { icon: Calendar,        label: 'Instalment Plans', to: '/instalments' },
    { icon: Percent,         label: 'Discounts',        to: '/discounts' },
    { icon: Wallet,          label: 'Expenses',         to: '/expenses' },
    { icon: PiggyBank,       label: 'Petty Cash',       to: '/expenses/petty-cash' },
    { icon: AlertCircle,     label: 'Defaulters',       to: '/defaulters' },
    { icon: FileText,        label: 'Reports',          to: '/reports' },
    { icon: BookOpen,        label: 'Fee Structure',    to: '/fee-structure' },
    { icon: Upload,          label: 'Import Students',  to: '/students/import' },
    { icon: Shield,          label: 'Audit Log',        to: '/audit' },
    { icon: Users,           label: 'Staff',             to: '/staff' },
    { icon: Settings,        label: 'Settings',          to: '/settings' },
  ],
  bursar: [
    { icon: LayoutDashboard, label: 'Overview',        to: '/dashboard' },
    { icon: Users,           label: 'Students',         to: '/students' },
    { icon: Receipt,         label: 'Fees & Invoices',  to: '/fees' },
    { icon: CreditCard,      label: 'Payments',         to: '/payments' },
    { icon: Calendar,        label: 'Instalment Plans', to: '/instalments' },
    { icon: Wallet,          label: 'Expenses',         to: '/expenses' },
    { icon: AlertCircle,     label: 'Defaulters',       to: '/defaulters' },
    { icon: FileText,        label: 'Reports',          to: '/reports' },
    { icon: Upload,          label: 'Import Students',  to: '/students/import' },
    { icon: Settings,        label: 'Settings',         to: '/settings' },
  ],
  parent: [
    { icon: LayoutDashboard, label: 'My Dashboard', to: '/parent' },
    { icon: Receipt, label: 'Fee Statements', to: '/parent/statements' },
    { icon: CreditCard, label: 'Make Payment', to: '/parent/pay' },
    { icon: FileText, label: 'Receipts', to: '/parent/receipts' },
  ],
  receptionist: [
    { icon: CreditCard, label: 'Record Payment', to: '/payments/new' },
    { icon: Receipt, label: 'Receipts', to: '/payments' },
  ],
}

export default function AppLayout() {
  const { user, signOut, isRole } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = user ? (roleNavItems[user.role] || []) : []

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const schoolName = isRole('super_admin') ? 'Kalimex Admin' : 'Green Valley Academy'

  const Sidebar = () => (
    <div style={{
      width: sidebarOpen ? 'var(--sidebar-w)' : 72,
      height: '100vh', background: 'var(--white)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease', overflow: 'hidden',
      position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarOpen ? '20px 24px' : '20px 16px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 'var(--header-h)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Kalimex</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{schoolName}</p>
            </div>
          )}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
          <ChevronRight size={16} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/super-admin' || item.to === '/parent'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: sidebarOpen ? '9px 12px' : '9px', justifyContent: sidebarOpen ? 'flex-start' : 'center',
                borderRadius: 10, color: isActive ? 'var(--green)' : 'var(--ink-3)',
                background: isActive ? 'var(--green-light)' : 'transparent',
                fontWeight: isActive ? 600 : 500, fontSize: 14,
                textDecoration: 'none', transition: 'all 0.12s', whiteSpace: 'nowrap',
              })}
            >
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User */}
      <div style={{
        padding: sidebarOpen ? '14px 16px' : '14px 12px',
        borderTop: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden',
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
      }}>
        <Avatar name={user?.full_name || 'U'} size={32} />
        {sidebarOpen && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.role ? roleLabel[user.role as keyof typeof roleLabel] : ''}
            </p>
          </div>
        )}
        {sidebarOpen && (
          <button onClick={handleSignOut} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0 }} title="Sign out">
            <LogOut size={15} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>
      <Sidebar />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile header */}
        <header style={{
          height: 'var(--header-h)', background: 'var(--white)',
          borderBottom: '1px solid var(--line)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', display: 'none' }}>Green Valley Academy</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', position: 'relative' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--white)' }} />
            </button>
            <Avatar name={user?.full_name || 'U'} size={30} />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
