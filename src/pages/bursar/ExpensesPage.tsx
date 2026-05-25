import { useState, useMemo } from 'react'
import { Plus, CheckCircle, Clock, XCircle, TrendingDown } from 'lucide-react'
import { SectionHeader, Badge, Card, Button, Modal, Input, Select, Avatar, ProgressBar } from '../../components/ui'
import { DEMO_EXPENSES, DEMO_EXPENSE_CATEGORIES, DEMO_TERM_SUMMARY, formatKES } from '../../lib/mockData'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../lib/permissions'
import type { Expense } from '../../types'
import toast from 'react-hot-toast'

const statusBadge = (s: Expense['status']) => {
  const m = { paid: 'green', approved: 'blue', pending_approval: 'amber', rejected: 'red' } as const
  const labels = { paid: 'Paid', approved: 'Approved', pending_approval: 'Pending Approval', rejected: 'Rejected' }
  return <Badge variant={m[s]}>{labels[s]}</Badge>
}

function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [vendor, setVendor] = useState('')
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    if (!desc || !cat || !amount || !method) { toast.error('Fill all required fields'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Expense recorded and submitted for approval')
      onClose()
    }, 1000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Expense" width={500}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Description" value={desc} onChange={setDesc} placeholder="e.g. Electricity bill — May" required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="Category"
            value={cat} onChange={setCat}
            options={DEMO_EXPENSE_CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select category…"
          />
          <Input label="Amount (KES)" value={amount} onChange={setAmount} type="number" placeholder="0" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="Payment Method"
            value={method} onChange={setMethod}
            options={[
              { value: 'cash', label: 'Cash / Petty Cash' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'mpesa', label: 'M-Pesa' },
            ]}
            placeholder="Method…"
          />
          <Input label="Vendor / Supplier" value={vendor} onChange={setVendor} placeholder="e.g. KPLC" />
        </div>
        {(method === 'cheque' || method === 'bank_transfer' || method === 'mpesa') && (
          <Input label="Reference / Code" value={ref} onChange={setRef} placeholder="Ref number or M-Pesa code" />
        )}
        <Input label="Payment Date" value="" onChange={() => {}} type="date" />
        <div style={{ background: 'var(--amber-light)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8 }}>
          <Clock size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.5 }}>Expenses above KES 10,000 require principal approval before payment is processed.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={handleSave} icon={<CheckCircle size={14} />}>Submit for Approval</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const perms = can(user?.role as any)
  const [showAdd, setShowAdd] = useState(false)
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return DEMO_EXPENSES.filter(e =>
      (!catFilter || e.category_id === catFilter) &&
      (!statusFilter || e.status === statusFilter)
    )
  }, [catFilter, statusFilter])

  const totalExpenses = DEMO_EXPENSES.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)
  const pendingApproval = DEMO_EXPENSES.filter(e => e.status === 'pending_approval').reduce((s, e) => s + e.amount, 0)

  const categoryTotals = DEMO_EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    spent: DEMO_EXPENSES.filter(e => e.category_id === cat.id && e.status === 'paid').reduce((s, e) => s + e.amount, 0),
  }))

  return (
    <div className="animate-in">
      <SectionHeader
        title="Expenses"
        subtitle="Track and manage school expenditure"
        action={<Button icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Record Expense</Button>}
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Income (Collected)', value: formatKES(DEMO_TERM_SUMMARY.total_collected), color: 'var(--green)' },
          { label: 'Total Expenses', value: formatKES(totalExpenses), color: 'var(--red)' },
          { label: 'Net Surplus', value: formatKES(DEMO_TERM_SUMMARY.total_collected - totalExpenses), color: DEMO_TERM_SUMMARY.total_collected > totalExpenses ? 'var(--green)' : 'var(--red)' },
          { label: 'Pending Approval', value: formatKES(pendingApproval), color: 'var(--amber)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Main table */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              style={{ padding: '9px 14px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
              <option value="">All Categories</option>
              {DEMO_EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '9px 14px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="approved">Approved</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <Card style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
                    {['Voucher', 'Description', 'Category', 'Vendor', 'Method', 'Amount', 'Date', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--surface)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{exp.voucher_number.split('/').slice(-1)[0]}</td>
                      <td style={{ padding: '11px 14px', maxWidth: 200 }}>
                        <p style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description}</p>
                      </td>
                      <td style={{ padding: '11px 14px', color: 'var(--ink-3)' }}>{exp.category?.name}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--ink-3)' }}>{exp.vendor || '—'}</td>
                      <td style={{ padding: '11px 14px', textTransform: 'capitalize', color: 'var(--ink-3)' }}>{exp.payment_method.replace('_', ' ')}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap' }}>{formatKES(exp.amount)}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{new Date(exp.payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</td>
                      <td style={{ padding: '11px 14px' }}>{statusBadge(exp.status)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {exp.status === 'pending_approval' && perms.approveExpense && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => toast.success('Expense approved')} style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--green-light)', color: 'var(--green)', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => toast.error('Expense rejected')} style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--red-light)', color: 'var(--red)', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                          </div>
                        )}
                        {exp.status === 'pending_approval' && !perms.approveExpense && (
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Awaiting approval</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Category budget breakdown */}
        <div>
          <Card>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingDown size={16} style={{ color: 'var(--red)' }} />
              Budget vs Spent
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {categoryTotals.filter(c => c.budget_per_term).map(cat => {
                const pct = Math.min(100, Math.round((cat.spent / (cat.budget_per_term || 1)) * 100))
                const over = cat.spent > (cat.budget_per_term || 0)
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{cat.name}</p>
                      <p style={{ fontSize: 12, color: over ? 'var(--red)' : 'var(--muted)', fontWeight: over ? 700 : 400 }}>
                        {pct}%{over ? ' ⚠' : ''}
                      </p>
                    </div>
                    <ProgressBar value={cat.spent} max={cat.budget_per_term || 1} color={over ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--green)'} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>Spent: {formatKES(cat.spent)}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>Budget: {formatKES(cat.budget_per_term || 0)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
