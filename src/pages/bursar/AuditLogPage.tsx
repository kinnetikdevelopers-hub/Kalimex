import { useState, useMemo } from 'react'
import { Search, Shield, Download } from 'lucide-react'
import { SectionHeader, Card, Badge, Button, Avatar } from '../../components/ui'
import toast from 'react-hot-toast'

type LogAction =
  | 'PAYMENT_RECEIVED' | 'PAYMENT_REVERSED' | 'PAYMENT_MANUAL'
  | 'INVOICE_GENERATED' | 'INVOICE_WAIVED'
  | 'DISCOUNT_APPLIED' | 'DISCOUNT_REMOVED'
  | 'INSTALMENT_PLAN_CREATED' | 'INSTALMENT_PLAN_CANCELLED'
  | 'EXPENSE_SUBMITTED' | 'EXPENSE_APPROVED' | 'EXPENSE_REJECTED'
  | 'STUDENT_CREATED' | 'STUDENT_UPDATED'
  | 'FEE_STRUCTURE_UPDATED'
  | 'USER_LOGIN' | 'USER_LOGOUT'
  | 'SETTINGS_CHANGED'
  | 'PETTY_CASH_ISSUED' | 'PETTY_CASH_ACCOUNTED'

interface AuditEntry {
  id: string
  timestamp: string
  user_name: string
  user_role: string
  action: LogAction
  entity_type: string
  description: string
  meta?: string   // e.g. receipt number, amount, student name
  ip?: string
}

const DEMO_AUDIT: AuditEntry[] = [
  { id: 'a-001', timestamp: '2025-05-19T08:14:22', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'PAYMENT_RECEIVED',         entity_type: 'payment',   description: 'M-Pesa STK payment received',                  meta: 'KES 27,750 · GVA/RCP/2025/0234 · QGH2KL9X0A' },
  { id: 'a-002', timestamp: '2025-05-19T08:15:01', user_name: 'System',          user_role: 'system',       action: 'INVOICE_GENERATED',         entity_type: 'invoice',   description: 'Invoice auto-updated after payment',           meta: 'INV GVA/2025/T2/001 → status: paid' },
  { id: 'a-003', timestamp: '2025-05-19T09:02:11', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'PAYMENT_RECEIVED',         entity_type: 'payment',   description: 'M-Pesa STK payment received',                  meta: 'KES 21,038 · GVA/RCP/2025/0235 · QGH3ML0Y1B' },
  { id: 'a-004', timestamp: '2025-05-19T09:45:00', user_name: 'Jane Wanjiku',   user_role: 'school_admin', action: 'DISCOUNT_APPLIED',          entity_type: 'discount',  description: 'Bursary discount applied to student',          meta: 'KES 5,000 · Daniel Mwangi · CDF Bursary' },
  { id: 'a-005', timestamp: '2025-05-19T10:20:00', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'PAYMENT_MANUAL',           entity_type: 'payment',   description: 'Cash payment recorded manually',               meta: 'KES 10,000 · Felix Odhiambo · GVA/RCP/2025/0248' },
  { id: 'a-006', timestamp: '2025-05-19T10:21:00', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'EXPENSE_SUBMITTED',         entity_type: 'expense',   description: 'Expense submitted for approval',               meta: 'KES 22,000 · Classroom painting · GVA/VCH/2025/047' },
  { id: 'a-007', timestamp: '2025-05-19T11:05:00', user_name: 'Jane Wanjiku',   user_role: 'school_admin', action: 'EXPENSE_APPROVED',          entity_type: 'expense',   description: 'Expense approved',                             meta: 'KES 22,000 · GVA/VCH/2025/047 · Colour Masters' },
  { id: 'a-008', timestamp: '2025-05-19T11:30:00', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'INSTALMENT_PLAN_CREATED',  entity_type: 'instalment', description: 'Instalment plan created for student',         meta: 'Chloe Otieno · 2 instalments · KES 30,000' },
  { id: 'a-009', timestamp: '2025-05-19T12:15:00', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'PETTY_CASH_ISSUED',         entity_type: 'petty_cash', description: 'Petty cash imprest issued',                   meta: 'KES 15,000 · Peter Mwangi' },
  { id: 'a-010', timestamp: '2025-05-19T13:00:00', user_name: 'Jane Wanjiku',   user_role: 'school_admin', action: 'FEE_STRUCTURE_UPDATED',     entity_type: 'fee_structure', description: 'Fee structure updated for grade',           meta: 'Grade 4 · Term 2 2025 · Tuition: KES 22,000' },
  { id: 'a-011', timestamp: '2025-05-19T13:45:00', user_name: 'System',          user_role: 'system',       action: 'PAYMENT_RECEIVED',         entity_type: 'payment',   description: 'M-Pesa STK payment received',                  meta: 'KES 30,000 · GVA/RCP/2025/0252 · QXY9PQ3A3D' },
  { id: 'a-012', timestamp: '2025-05-19T14:00:00', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'STUDENT_CREATED',           entity_type: 'student',   description: 'New student added',                            meta: 'Gloria Waweru · GVA/2023/044 · Grade 4 East' },
  { id: 'a-013', timestamp: '2025-05-19T14:30:00', user_name: 'Grace Kamau',    user_role: 'parent',       action: 'USER_LOGIN',               entity_type: 'auth',      description: 'Parent portal login',                          meta: 'parent@test.com' },
  { id: 'a-014', timestamp: '2025-05-19T15:10:00', user_name: 'Jane Wanjiku',   user_role: 'school_admin', action: 'SETTINGS_CHANGED',          entity_type: 'settings',  description: 'Notification preferences updated',             meta: '' },
  { id: 'a-015', timestamp: '2025-05-18T16:00:00', user_name: 'Peter Mwangi',   user_role: 'bursar',       action: 'INVOICE_WAIVED',            entity_type: 'invoice',   description: 'Invoice item waived with reason',              meta: 'Hassan Abdi · Activity Fee · KES 1,500 · Hardship waiver' },
  { id: 'a-016', timestamp: '2025-05-18T09:30:00', user_name: 'System',          user_role: 'system',       action: 'INVOICE_GENERATED',         entity_type: 'invoice',   description: 'Term invoices bulk generated',                 meta: '8 invoices · Term 2 2025' },
]

const actionConfig: Record<LogAction, { label: string; variant: any; category: string }> = {
  PAYMENT_RECEIVED:         { label: 'Payment Received',         variant: 'green',  category: 'payments'   },
  PAYMENT_REVERSED:         { label: 'Payment Reversed',         variant: 'red',    category: 'payments'   },
  PAYMENT_MANUAL:           { label: 'Manual Payment',           variant: 'green',  category: 'payments'   },
  INVOICE_GENERATED:        { label: 'Invoice Generated',        variant: 'blue',   category: 'invoices'   },
  INVOICE_WAIVED:           { label: 'Invoice Waived',           variant: 'amber',  category: 'invoices'   },
  DISCOUNT_APPLIED:         { label: 'Discount Applied',         variant: 'green',  category: 'discounts'  },
  DISCOUNT_REMOVED:         { label: 'Discount Removed',         variant: 'red',    category: 'discounts'  },
  INSTALMENT_PLAN_CREATED:  { label: 'Plan Created',             variant: 'blue',   category: 'instalments'},
  INSTALMENT_PLAN_CANCELLED:{ label: 'Plan Cancelled',           variant: 'red',    category: 'instalments'},
  EXPENSE_SUBMITTED:        { label: 'Expense Submitted',        variant: 'amber',  category: 'expenses'   },
  EXPENSE_APPROVED:         { label: 'Expense Approved',         variant: 'green',  category: 'expenses'   },
  EXPENSE_REJECTED:         { label: 'Expense Rejected',         variant: 'red',    category: 'expenses'   },
  STUDENT_CREATED:          { label: 'Student Added',            variant: 'blue',   category: 'students'   },
  STUDENT_UPDATED:          { label: 'Student Updated',          variant: 'muted',  category: 'students'   },
  FEE_STRUCTURE_UPDATED:    { label: 'Fee Structure Updated',    variant: 'amber',  category: 'fees'       },
  USER_LOGIN:               { label: 'Login',                    variant: 'muted',  category: 'auth'       },
  USER_LOGOUT:              { label: 'Logout',                   variant: 'muted',  category: 'auth'       },
  SETTINGS_CHANGED:         { label: 'Settings Changed',         variant: 'amber',  category: 'settings'   },
  PETTY_CASH_ISSUED:        { label: 'Imprest Issued',           variant: 'amber',  category: 'expenses'   },
  PETTY_CASH_ACCOUNTED:     { label: 'Imprest Accounted',        variant: 'green',  category: 'expenses'   },
}

const roleColor: Record<string, string> = {
  bursar: 'var(--green)', school_admin: 'var(--blue)',
  parent: 'var(--amber)', system: 'var(--muted)', super_admin: '#7C3AED',
}

const categories = ['all', 'payments', 'invoices', 'expenses', 'discounts', 'students', 'instalments', 'auth', 'fees', 'settings']

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')

  const filtered = useMemo(() => {
    return DEMO_AUDIT.filter(e => {
      const cfg = actionConfig[e.action]
      const matchCat = category === 'all' || cfg.category === category
      const q = search.toLowerCase()
      const matchQ = !q || e.user_name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.meta || '').toLowerCase().includes(q)
      const matchDate = !dateFrom || e.timestamp.startsWith(dateFrom)
      return matchCat && matchQ && matchDate
    })
  }, [search, category, dateFrom])

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, AuditEntry[]> = {}
    filtered.forEach(e => {
      const date = e.timestamp.split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(e)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="animate-in">
      <SectionHeader
        title="Audit Log"
        subtitle="Complete tamper-evident record of all financial activity"
        action={
          <Button variant="secondary" icon={<Download size={14} />} onClick={() => toast.success('Audit log exported as PDF')}>
            Export Log
          </Button>
        }
      />

      {/* Info banner */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Shield size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
          Every financial action is logged automatically with timestamp, user, and details. Entries <strong style={{ color: 'var(--ink)' }}>cannot be edited or deleted</strong> — this log is the source of truth for any audit or dispute.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action, or detail…"
            style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', outline: 'none' }}
          />
        </div>
        <input
          type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: '9px 12px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--white)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none',
                background: category === c ? 'var(--ink)' : 'var(--surface)',
                color: category === c ? 'white' : 'var(--ink-3)', cursor: 'pointer',
                textTransform: 'capitalize', transition: 'all 0.12s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries grouped by date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {grouped.map(([date, entries]) => (
          <div key={date}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              {formatDate(date)} · {entries.length} event{entries.length !== 1 ? 's' : ''}
            </p>
            <Card style={{ padding: 0 }}>
              {entries.map((e, i) => {
                const cfg = actionConfig[e.action]
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '12px 18px',
                      borderBottom: i < entries.length - 1 ? '1px solid var(--surface)' : 'none',
                    }}
                  >
                    {/* Time */}
                    <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', whiteSpace: 'nowrap', paddingTop: 2, minWidth: 44 }}>
                      {formatTime(e.timestamp)}
                    </p>

                    {/* Avatar */}
                    <Avatar
                      name={e.user_name === 'System' ? 'SY' : e.user_name}
                      size={28}
                      color={roleColor[e.user_role] || 'var(--muted)'}
                    />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{e.user_name}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: e.meta ? 3 : 0 }}>{e.description}</p>
                      {e.meta && (
                        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{e.meta}</p>
                      )}
                    </div>

                    {/* Role pill */}
                    <p style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', paddingTop: 2, textTransform: 'capitalize' }}>
                      {e.user_role.replace('_', ' ')}
                    </p>
                  </div>
                )
              })}
            </Card>
          </div>
        ))}

        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted)' }}>
            <Shield size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-3)' }}>No log entries match your filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
