import { useState, useMemo } from 'react'
import { Plus, Calendar, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { SectionHeader, Card, Badge, Button, Modal, Select, Input, Avatar, ProgressBar } from '../../components/ui'
import { DEMO_STUDENTS, DEMO_INVOICES, formatKES, CURRENT_TERM } from '../../lib/mockData'
import type { Student, Invoice } from '../../types'
import toast from 'react-hot-toast'
import { format, addWeeks, addMonths } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScheduleItem {
  id: string
  due_date: string
  amount: number
  paid: boolean
  paid_date?: string
  payment_ref?: string
}

interface Plan {
  id: string
  student: Student
  invoice: Invoice
  total_amount: number
  paid_amount: number
  status: 'active' | 'completed' | 'defaulted'
  created_at: string
  notes: string
  schedule: ScheduleItem[]
}

// ─── Demo plans ───────────────────────────────────────────────────────────────
const DEMO_PLANS: Plan[] = [
  {
    id: 'plan-001',
    student: DEMO_STUDENTS[2], // Chloe — partial payer
    invoice: DEMO_INVOICES[2],
    total_amount: 30000,
    paid_amount: 15000,
    status: 'active',
    created_at: '2025-05-06',
    notes: 'Parent requested 2-instalment plan due to salary schedule',
    schedule: [
      { id: 's1', due_date: '2025-05-09', amount: 15000, paid: true, paid_date: '2025-05-08', payment_ref: 'QRT4NO2Z2C' },
      { id: 's2', due_date: '2025-06-15', amount: 15000, paid: false },
    ],
  },
  {
    id: 'plan-002',
    student: DEMO_STUDENTS[5], // Felix — partial payer
    invoice: DEMO_INVOICES[5],
    total_amount: 30000,
    paid_amount: 10000,
    status: 'active',
    created_at: '2025-05-09',
    notes: '3-instalment plan approved by principal',
    schedule: [
      { id: 's3', due_date: '2025-05-09', amount: 10000, paid: true, paid_date: '2025-05-09' },
      { id: 's4', due_date: '2025-06-01', amount: 10000, paid: false },
      { id: 's5', due_date: '2025-07-01', amount: 10000, paid: false },
    ],
  },
]

// ─── Create Plan Modal ────────────────────────────────────────────────────────
function CreatePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [studentId, setStudentId] = useState('')
  const [instalments, setInstalments] = useState('2')
  const [freq, setFreq] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly')
  const [notes, setNotes] = useState('')
  const [customAmounts, setCustomAmounts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const student = DEMO_STUDENTS.find(s => s.id === studentId)
  const invoice = DEMO_INVOICES.find(i => i.student_id === studentId && i.term_id === 'term-2')
  const outstanding = invoice?.balance || 0

  const schedule = useMemo(() => {
    if (!outstanding || !instalments) return []
    const n = parseInt(instalments)
    const base = Math.floor(outstanding / n)
    const remainder = outstanding - base * n

    return Array.from({ length: n }, (_, i) => {
      let dueDate = new Date()
      if (freq === 'weekly') dueDate = addWeeks(new Date(), i + 1)
      else if (freq === 'biweekly') dueDate = addWeeks(new Date(), (i + 1) * 2)
      else dueDate = addMonths(new Date(), i + 1)

      const amt = customAmounts[i] !== undefined
        ? Number(customAmounts[i])
        : i === n - 1 ? base + remainder : base

      return { index: i + 1, due_date: format(dueDate, 'yyyy-MM-dd'), amount: amt }
    })
  }, [outstanding, instalments, freq, customAmounts])

  const totalScheduled = schedule.reduce((s, r) => s + r.amount, 0)

  const handleCreate = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success(`Instalment plan created for ${student?.full_name}. SMS sent to guardian.`)
      onClose()
      setStep(1); setStudentId(''); setInstalments('2'); setNotes('')
    }, 1200)
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Instalment Plan" width={560}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        {['Select Student', 'Schedule', 'Confirm'].map((s, i) => (
          <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--ink)' : 'var(--line)',
                color: step >= i + 1 ? 'white' : 'var(--muted)',
              }}>{step > i + 1 ? '✓' : i + 1}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? 'var(--green)' : 'var(--line)', margin: '0 8px' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select student */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select
            label="Student"
            value={studentId}
            onChange={setStudentId}
            options={DEMO_INVOICES.filter(i => i.balance > 0).map(i => {
              const s = DEMO_STUDENTS.find(st => st.id === i.student_id)
              return { value: i.student_id, label: `${s?.full_name} — Balance: ${formatKES(i.balance)}` }
            })}
            placeholder="Select a student with outstanding balance…"
          />

          {invoice && student && (
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar name={student.full_name} size={40} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{student.full_name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{student.grade?.name} · {invoice.invoice_number}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Invoice Total', v: formatKES(invoice.net_amount) },
                  { l: 'Paid So Far', v: formatKES(invoice.paid_amount), c: 'var(--green)' },
                  { l: 'Outstanding', v: formatKES(invoice.balance), c: 'var(--red)' },
                ].map(r => (
                  <div key={r.l} style={{ textAlign: 'center', background: 'var(--white)', borderRadius: 8, padding: '8px 4px' }}>
                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>{r.l}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: r.c || 'var(--ink)' }}>{r.v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input label="Notes / Reason for Plan" value={notes} onChange={setNotes} placeholder="e.g. Parent requested 2-instalment plan" />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { if (!studentId) { toast.error('Select a student'); return } setStep(2) }}>Next: Set Schedule</Button>
          </div>
        </div>
      )}

      {/* Step 2: Schedule */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Number of Instalments"
              value={instalments}
              onChange={v => { setInstalments(v); setCustomAmounts([]) }}
              options={['2','3','4','5','6'].map(n => ({ value: n, label: `${n} instalments` }))}
            />
            <Select
              label="Frequency"
              value={freq}
              onChange={v => setFreq(v as any)}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Every 2 Weeks' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </div>

          {/* Schedule preview */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Payment Schedule Preview</p>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', background: 'var(--surface)', padding: '8px 14px', borderBottom: '1px solid var(--line)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>#</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>DUE DATE</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textAlign: 'right' }}>AMOUNT (KES)</p>
              </div>
              {schedule.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', padding: '10px 14px', borderBottom: i < schedule.length - 1 ? '1px solid var(--surface)' : 'none', alignItems: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{row.index}</p>
                  <p style={{ fontSize: 13, color: 'var(--ink)' }}>{new Date(row.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <input
                    type="number"
                    value={customAmounts[i] !== undefined ? customAmounts[i] : row.amount}
                    onChange={e => {
                      const next = [...customAmounts]
                      next[i] = e.target.value
                      setCustomAmounts(next)
                    }}
                    style={{ textAlign: 'right', padding: '6px 10px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none', width: '100%' }}
                  />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', padding: '10px 14px', background: 'var(--ink)' }}>
                <span />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Total Scheduled</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: totalScheduled !== outstanding ? 'var(--amber)' : 'var(--green-mid)', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                  {formatKES(totalScheduled)}
                  {totalScheduled !== outstanding && <span style={{ fontSize: 10, display: 'block', opacity: 0.8 }}>≠ outstanding {formatKES(outstanding)}</span>}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Review Plan</Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && student && invoice && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Plan Summary</p>
            {[
              { l: 'Student', v: student.full_name },
              { l: 'Invoice', v: invoice.invoice_number },
              { l: 'Outstanding', v: formatKES(invoice.balance) },
              { l: 'Instalments', v: `${instalments} payments (${freq})` },
              { l: 'Notes', v: notes || '—' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{r.l}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 8 }}>
            <AlertCircle size={15} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--amber)', lineHeight: 1.5 }}>
              An SMS will be sent to the guardian with the payment schedule and reminders will be auto-sent 2 days before each instalment is due.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button loading={loading} icon={<CheckCircle size={14} />} onClick={handleCreate}>
              Create Plan & Notify Guardian
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan }: { plan: Plan }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round((plan.paid_amount / plan.total_amount) * 100)
  const overdue = plan.schedule.filter(s => !s.paid && new Date(s.due_date) < new Date())
  const next = plan.schedule.find(s => !s.paid)

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Avatar name={plan.student.full_name} size={42} color={overdue.length > 0 ? 'var(--red)' : 'var(--green)'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{plan.student.full_name}</p>
              {overdue.length > 0
                ? <Badge variant="red" dot>{overdue.length} overdue</Badge>
                : <Badge variant="green" dot>On track</Badge>}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              {plan.student.grade?.name} · {plan.invoice.invoice_number} · {plan.schedule.length} instalments
            </p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Paid</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{formatKES(plan.paid_amount)}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Remaining</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>{formatKES(plan.total_amount - plan.paid_amount)}</p>
              </div>
              {next && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>Next Due</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: new Date(next.due_date) < new Date() ? 'var(--red)' : 'var(--amber)' }}>
                    {new Date(next.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )}
            </div>
            <ProgressBar value={plan.paid_amount} max={plan.total_amount} color={overdue.length > 0 ? 'var(--amber)' : 'var(--green)'} />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{pct}% of plan paid</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => toast.success('Payment reminder sent to guardian')}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Send size={12} /> Remind
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded schedule */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '14px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Schedule</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plan.schedule.map((s, i) => {
              const isOverdue = !s.paid && new Date(s.due_date) < new Date()
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 10, border: `1px solid ${s.paid ? 'var(--line)' : isOverdue ? 'var(--red)' : 'var(--line)'}`,
                  background: s.paid ? 'var(--green-light)' : isOverdue ? 'var(--red-light)' : 'var(--surface)',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.paid ? 'var(--green)' : isOverdue ? 'var(--red)' : 'var(--line)' }}>
                    {s.paid
                      ? <CheckCircle size={14} style={{ color: 'white' }} />
                      : isOverdue
                        ? <AlertCircle size={14} style={{ color: 'white' }} />
                        : <Clock size={14} style={{ color: 'var(--muted)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Instalment {i + 1}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Due: {new Date(s.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {s.paid_date && ` · Paid: ${new Date(s.paid_date).toLocaleDateString('en-KE')}`}
                      {s.payment_ref && ` · ${s.payment_ref}`}
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: s.paid ? 'var(--green)' : isOverdue ? 'var(--red)' : 'var(--ink)' }}>
                    {formatKES(s.amount)}
                  </p>
                  {!s.paid && (
                    <button
                      onClick={() => toast.success(`STK push sent for instalment ${i + 1}`)}
                      style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--ink)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                    >
                      Pay
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {plan.notes && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, fontStyle: 'italic' }}>Note: {plan.notes}</p>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InstalmentPlansPage() {
  const [showCreate, setShowCreate] = useState(false)

  const totalManaged = DEMO_PLANS.reduce((s, p) => s + p.total_amount, 0)
  const totalCollected = DEMO_PLANS.reduce((s, p) => s + p.paid_amount, 0)
  const overduePlans = DEMO_PLANS.filter(p => p.schedule.some(s => !s.paid && new Date(s.due_date) < new Date()))

  return (
    <div className="animate-in">
      <SectionHeader
        title="Instalment Plans"
        subtitle={`${DEMO_PLANS.length} active plans · ${CURRENT_TERM.name}`}
        action={<Button icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>Create Plan</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Plans', value: DEMO_PLANS.length, color: 'var(--ink)' },
          { label: 'Total Managed', value: formatKES(totalManaged), color: 'var(--ink)' },
          { label: 'Collected', value: formatKES(totalCollected), color: 'var(--green)' },
          { label: 'Overdue Plans', value: overduePlans.length, color: overduePlans.length > 0 ? 'var(--red)' : 'var(--green)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DEMO_PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
      </div>

      <CreatePlanModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
