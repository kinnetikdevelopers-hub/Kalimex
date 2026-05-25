import { useState } from 'react'
import { Plus, CheckCircle, AlertCircle, Wallet } from 'lucide-react'
import { SectionHeader, Card, Button, Modal, Input, Badge, Avatar } from '../../components/ui'
import { formatKES } from '../../lib/mockData'
import toast from 'react-hot-toast'

interface PettyCashRecord {
  id: string
  holder: string
  amount_given: number
  amount_accounted: number
  given_date: string
  accounted_date?: string
  status: 'open' | 'accounted' | 'overdue'
  expenses: { description: string; amount: number; date: string; receipt?: string }[]
}

const DEMO_PETTY: PettyCashRecord[] = [
  {
    id: 'pc-001', holder: 'Peter Mwangi (Bursar)', amount_given: 15000, amount_accounted: 9200,
    given_date: '2025-05-05', status: 'open',
    expenses: [
      { description: 'Printer paper and toner', amount: 2800, date: '2025-05-06', receipt: 'RCPT-001' },
      { description: 'Cleaning supplies', amount: 1500, date: '2025-05-07', receipt: 'RCPT-002' },
      { description: 'Tea and sugar — staffroom', amount: 900, date: '2025-05-09' },
      { description: 'Padlock for gate', amount: 600, date: '2025-05-10' },
      { description: 'Emergency electrician (fuse)', amount: 3400, date: '2025-05-12', receipt: 'RCPT-003' },
    ],
  },
  {
    id: 'pc-002', holder: 'Jane Wanjiku (Admin)', amount_given: 8000, amount_accounted: 8000,
    given_date: '2025-04-28', accounted_date: '2025-05-03', status: 'accounted',
    expenses: [
      { description: 'NHIF stamps — support staff', amount: 3200, date: '2025-04-29', receipt: 'RCPT-004' },
      { description: 'Gate register books (3)', amount: 750, date: '2025-04-30' },
      { description: 'Marker pens — classrooms', amount: 1200, date: '2025-05-01' },
      { description: 'Returned to petty cash float', amount: 2850, date: '2025-05-03' },
    ],
  },
]

function NewImprestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [holder, setHolder] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleIssue = () => {
    if (!holder || !amount) { toast.error('Fill all fields'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success(`KES ${Number(amount).toLocaleString()} imprest issued to ${holder}`)
      onClose()
    }, 1000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Issue Petty Cash Imprest" width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 13, color: 'var(--amber)', lineHeight: 1.5 }}>
            Petty cash imprest must be fully accounted for within 7 days. The holder is responsible for providing receipts for all expenditure.
          </p>
        </div>
        <Input label="Imprest Holder" value={holder} onChange={setHolder} placeholder="e.g. John Bursar" required />
        <Input label="Amount (KES)" value={amount} onChange={setAmount} type="number" placeholder="0" required />
        <Input label="Date Issued" value={new Date().toISOString().split('T')[0]} onChange={() => {}} type="date" />
        <Input label="Purpose / Notes" value="" onChange={() => {}} placeholder="e.g. Operational expenses — Term 2 Week 3" />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} icon={<CheckCircle size={14} />} onClick={handleIssue}>Issue Imprest</Button>
        </div>
      </div>
    </Modal>
  )
}

function PettyCashCard({ record }: { record: PettyCashRecord }) {
  const [showDetails, setShowDetails] = useState(false)
  const balance = record.amount_given - record.amount_accounted
  const pct = Math.round((record.amount_accounted / record.amount_given) * 100)

  const statusBadge = () => {
    if (record.status === 'accounted') return <Badge variant="green" dot>Accounted</Badge>
    if (record.status === 'overdue') return <Badge variant="red" dot>Overdue</Badge>
    return <Badge variant="amber" dot>Open</Badge>
  }

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Avatar name={record.holder.split(' ')[0]} size={42} color={record.status === 'accounted' ? 'var(--green)' : 'var(--amber)'} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{record.holder}</p>
              {statusBadge()}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
              Issued: {new Date(record.given_date).toLocaleDateString('en-KE')}
              {record.accounted_date && ` · Accounted: ${new Date(record.accounted_date).toLocaleDateString('en-KE')}`}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Issued</p>
                <p style={{ fontSize: 14, fontWeight: 700 }}>{formatKES(record.amount_given)}</p>
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Spent</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{formatKES(record.amount_accounted)}</p>
              </div>
              <div style={{ background: balance > 0 ? 'var(--amber-light)' : 'var(--green-light)', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Balance Due</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: balance > 0 ? 'var(--amber)' : 'var(--green)' }}>{formatKES(balance)}</p>
              </div>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, background: 'var(--line)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: record.status === 'accounted' ? 'var(--green)' : 'var(--amber)', borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{pct}% accounted</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {record.status === 'open' && (
              <button
                onClick={() => toast.success('Imprest marked as accounted')}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
              >
                Account
              </button>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Expense details */}
      {showDetails && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '14px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expenditure Breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {record.expenses.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{e.description}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(e.date).toLocaleDateString('en-KE')}
                    {e.receipt ? ` · Receipt: ${e.receipt}` : ' · No receipt'}
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--red)' }}>
                  {formatKES(e.amount)}
                </p>
                {!e.receipt && (
                  <button onClick={() => toast.success('Receipt uploaded')} style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    + Receipt
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--ink)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Total Spent</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: 'var(--mono)' }}>{formatKES(record.amount_accounted)}</p>
          </div>

          {record.status === 'open' && balance > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button
                onClick={() => toast.success('Add expense recorded')}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px dashed var(--line)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}
              >
                + Add Expense
              </button>
              <button
                onClick={() => toast.success(`KES ${formatKES(balance)} return recorded`)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid var(--green)', background: 'var(--green-light)', cursor: 'pointer', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}
              >
                Record Return ({formatKES(balance)})
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function PettyCashPage() {
  const [showNew, setShowNew] = useState(false)

  const totalIssued = DEMO_PETTY.reduce((s, p) => s + p.amount_given, 0)
  const totalSpent = DEMO_PETTY.reduce((s, p) => s + p.amount_accounted, 0)
  const totalOutstanding = DEMO_PETTY.filter(p => p.status === 'open').reduce((s, p) => s + (p.amount_given - p.amount_accounted), 0)

  return (
    <div className="animate-in">
      <SectionHeader
        title="Petty Cash / Imprest"
        subtitle="Track petty cash issued and accounted"
        action={<Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Issue Imprest</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Issued', value: formatKES(totalIssued), color: 'var(--ink)' },
          { label: 'Total Spent', value: formatKES(totalSpent), color: 'var(--red)' },
          { label: 'Unaccounted', value: formatKES(totalOutstanding), color: totalOutstanding > 0 ? 'var(--amber)' : 'var(--green)' },
          { label: 'Open Imprests', value: DEMO_PETTY.filter(p => p.status === 'open').length, color: 'var(--ink)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DEMO_PETTY.map(r => <PettyCashCard key={r.id} record={r} />)}
      </div>

      <NewImprestModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}
