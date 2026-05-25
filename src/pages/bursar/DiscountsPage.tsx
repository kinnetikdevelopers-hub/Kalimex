import { useState, useMemo } from 'react'
import { Plus, Percent, Users, Tag, CheckCircle, Info } from 'lucide-react'
import { SectionHeader, Card, Button, Modal, Select, Input, Badge, Avatar, ProgressBar } from '../../components/ui'
import {
  DEMO_STUDENTS, DEMO_INVOICES, DEMO_FAMILIES, DEMO_GRADES,
  formatKES, CURRENT_TERM
} from '../../lib/mockData'
import {
  calculateSiblingDiscount, calculateEarlyPaymentDiscount,
  DEFAULT_DISCOUNT_CONFIG, type SiblingDiscountConfig
} from '../../lib/discountEngine'
import toast from 'react-hot-toast'

type DiscountType = 'sibling' | 'bursary' | 'scholarship' | 'early_payment' | 'staff_child' | 'custom'

interface AppliedDiscount {
  id: string
  student_name: string
  student_id: string
  admission_number: string
  grade: string
  type: DiscountType
  description: string
  amount: number
  percent?: number
  approved_by: string
  date: string
}

const DEMO_DISCOUNTS: AppliedDiscount[] = [
  { id: 'd-001', student_name: 'Amara Kamau', student_id: 'std-001', admission_number: 'GVA/2023/001', grade: 'Grade 4', type: 'sibling', description: 'Sibling discount (2nd child) — 7.5% off tuition', amount: 1350, percent: 7.5, approved_by: 'Jane Wanjiku', date: '2025-05-05' },
  { id: 'd-002', student_name: 'Brian Kamau', student_id: 'std-002', admission_number: 'GVA/2023/002', grade: 'Grade 1', type: 'sibling', description: 'Sibling discount (3rd+ child) — 17.5% off tuition', amount: 3150, percent: 17.5, approved_by: 'Jane Wanjiku', date: '2025-05-05' },
  { id: 'd-003', student_name: 'Daniel Mwangi', student_id: 'std-004', admission_number: 'GVA/2021/008', grade: 'Grade 8', type: 'bursary', description: 'CDF Bursary — Kiambu Constituency', amount: 5000, approved_by: 'Jane Wanjiku', date: '2025-05-07' },
]

const typeConfig: Record<DiscountType, { label: string; color: string; variant: any }> = {
  sibling:       { label: 'Sibling',       color: 'var(--green)', variant: 'green' },
  bursary:       { label: 'Bursary',       color: 'var(--blue)',  variant: 'blue'  },
  scholarship:   { label: 'Scholarship',   color: '#7C3AED',      variant: 'muted' },
  early_payment: { label: 'Early Payment', color: 'var(--amber)', variant: 'amber' },
  staff_child:   { label: 'Staff Child',   color: 'var(--ink)',   variant: 'ink'   },
  custom:        { label: 'Custom',        color: 'var(--muted)', variant: 'muted' },
}

// ─── Sibling Engine Preview Card ──────────────────────────────────────────────
function SiblingEngineCard({ config, onConfigChange }: { config: SiblingDiscountConfig; onConfigChange: (c: SiblingDiscountConfig) => void }) {
  // Group students by family
  const families = DEMO_FAMILIES.map(fam => {
    const students = DEMO_STUDENTS.filter(s => s.family_id === fam.id && s.status === 'active')
    return { fam, students }
  }).filter(f => f.students.length > 1)

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} style={{ color: 'var(--green)' }} />
          <p style={{ fontSize: 14, fontWeight: 700 }}>Sibling Discount Engine</p>
          <Badge variant="green" dot>Auto-applied</Badge>
        </div>
      </div>

      {/* Config */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16, padding: '14px 16px', background: 'var(--surface)', borderRadius: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>2nd Child %</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number" min="0" max="100"
              value={config.secondChild}
              onChange={e => onConfigChange({ ...config, secondChild: Number(e.target.value) })}
              style={{ width: 60, padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none' }}
            />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>3rd+ Child %</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number" min="0" max="100"
              value={config.thirdChildPlus}
              onChange={e => onConfigChange({ ...config, thirdChildPlus: Number(e.target.value) })}
              style={{ width: 60, padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none' }}
            />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Early Payment %</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number" min="0" max="100"
              value={config.earlyPayment}
              onChange={e => onConfigChange({ ...config, earlyPayment: Number(e.target.value) })}
              style={{ width: 60, padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none' }}
            />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Apply Discount To</label>
          <select
            value={config.applyTo}
            onChange={e => onConfigChange({ ...config, applyTo: e.target.value as any })}
            style={{ padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 12, outline: 'none', background: 'var(--white)', width: '100%' }}
          >
            <option value="tuition_only">Tuition Only</option>
            <option value="all">All Fees</option>
          </select>
        </div>
      </div>

      {/* Live family preview */}
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Live Family Preview</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {families.map(({ fam, students }) => (
          <div key={fam.id} style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={13} style={{ color: 'var(--muted)' }} />
              <p style={{ fontSize: 13, fontWeight: 700 }}>{fam.name}</p>
              <Badge variant="muted">{students.length} children</Badge>
            </div>
            {students.map((s, i) => {
              const inv = DEMO_INVOICES.find(inv => inv.student_id === s.id && inv.term_id === 'term-2')
              const tuition = inv?.items?.find(it => it.description.toLowerCase().includes('tuition'))?.amount || 0
              const disc = calculateSiblingDiscount(s, students, inv?.subtotal || 0, tuition, config)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: '1px solid var(--surface)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? 'var(--line)' : 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--muted)' : 'var(--green)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{s.full_name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>{s.grade?.name}</p>
                  </div>
                  {disc.discountAmount > 0 ? (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>− {formatKES(disc.discountAmount)}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>{disc.discountPercent}% off {config.applyTo === 'tuition_only' ? 'tuition' : 'total'}</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>No discount (1st child)</p>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 8 }}>
        <Button variant="secondary" onClick={() => toast.success('Settings reset to defaults')}>Reset Defaults</Button>
        <Button icon={<CheckCircle size={14} />} onClick={() => toast.success('Sibling discount config saved! Applied to all future invoices.')}>
          Save & Apply to All Invoices
        </Button>
      </div>
    </Card>
  )
}

// ─── Apply Manual Discount Modal ──────────────────────────────────────────────
function ApplyDiscountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [studentId, setStudentId] = useState('')
  const [type, setType] = useState<DiscountType>('bursary')
  const [mode, setMode] = useState<'percent' | 'fixed'>('fixed')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const invoice = DEMO_INVOICES.find(i => i.student_id === studentId && i.term_id === 'term-2')
  const discountAmount = mode === 'percent' && invoice
    ? Math.round((invoice.net_amount * Number(value)) / 100)
    : Number(value)

  const handleApply = () => {
    if (!studentId || !value) { toast.error('Fill all fields'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success(`${typeConfig[type].label} discount of ${formatKES(discountAmount)} applied`)
      onClose()
    }, 1000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply Manual Discount" width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select
          label="Student"
          value={studentId}
          onChange={setStudentId}
          options={DEMO_STUDENTS.map(s => ({ value: s.id, label: `${s.full_name} (${s.admission_number})` }))}
          placeholder="Select student…"
        />

        {invoice && (
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Current Invoice</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{formatKES(invoice.net_amount)}</span>
          </div>
        )}

        <Select
          label="Discount Type"
          value={type}
          onChange={v => setType(v as DiscountType)}
          options={Object.entries(typeConfig).map(([k, v]) => ({ value: k, label: v.label }))}
        />

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>Discount Amount</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {(['fixed', 'percent'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8,
                  border: `1.5px solid ${mode === m ? 'var(--ink)' : 'var(--line)'}`,
                  background: mode === m ? 'var(--ink)' : 'var(--white)',
                  color: mode === m ? 'white' : 'var(--ink-3)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {m === 'fixed' ? 'Fixed Amount (KES)' : 'Percentage (%)'}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={mode === 'fixed' ? 'e.g. 5000' : 'e.g. 10'}
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none' }}
          />
          {mode === 'percent' && value && invoice && (
            <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 6 }}>
              = {formatKES(discountAmount)} off {formatKES(invoice.net_amount)}
            </p>
          )}
        </div>

        <Input label="Description / Reason" value={description} onChange={setDescription} placeholder="e.g. CDF Bursary — Kiambu Constituency" />

        {discountAmount > 0 && (
          <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>Discount to Apply</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--mono)' }}>− {formatKES(discountAmount)}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} icon={<CheckCircle size={14} />} onClick={handleApply}>Apply Discount</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DiscountsPage() {
  const [config, setConfig] = useState<SiblingDiscountConfig>(DEFAULT_DISCOUNT_CONFIG)
  const [showApply, setShowApply] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('')

  const filtered = typeFilter ? DEMO_DISCOUNTS.filter(d => d.type === typeFilter) : DEMO_DISCOUNTS
  const totalDiscounts = DEMO_DISCOUNTS.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="animate-in">
      <SectionHeader
        title="Discounts & Bursaries"
        subtitle={`${DEMO_DISCOUNTS.length} active discounts · ${CURRENT_TERM.name}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<Plus size={14} />} onClick={() => setShowApply(true)}>Apply Discount</Button>
          </div>
        }
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Discounted', value: formatKES(totalDiscounts), color: 'var(--green)' },
          { label: 'Sibling Discounts', value: DEMO_DISCOUNTS.filter(d => d.type === 'sibling').length, color: 'var(--green)', suffix: ' applied' },
          { label: 'Bursaries/Scholarships', value: DEMO_DISCOUNTS.filter(d => d.type === 'bursary' || d.type === 'scholarship').length, color: 'var(--blue)', suffix: ' applied' },
          { label: 'Families Linked', value: DEMO_FAMILIES.length, color: 'var(--ink)', suffix: ' families' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}{s.suffix || ''}</p>
          </Card>
        ))}
      </div>

      {/* Sibling engine */}
      <SiblingEngineCard config={config} onConfigChange={setConfig} />

      {/* Info box */}
      <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <Info size={15} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--blue)', lineHeight: 1.6 }}>
          <strong>Sibling discounts</strong> are auto-applied when generating invoices — no manual entry needed.
          For bursaries, scholarships, and staff discounts, use the "Apply Discount" button to apply them per student.
        </p>
      </div>

      {/* Applied discounts table */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, fontWeight: 700 }}>Applied Discounts — {CURRENT_TERM.name}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setTypeFilter('')}
              style={{ padding: '5px 12px', borderRadius: 7, border: `1.5px solid ${!typeFilter ? 'var(--ink)' : 'var(--line)'}`, background: !typeFilter ? 'var(--ink)' : 'var(--white)', color: !typeFilter ? 'white' : 'var(--ink-3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >All</button>
            {Object.entries(typeConfig).filter(([k]) => DEMO_DISCOUNTS.some(d => d.type === k)).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setTypeFilter(k)}
                style={{ padding: '5px 12px', borderRadius: 7, border: `1.5px solid ${typeFilter === k ? v.color : 'var(--line)'}`, background: typeFilter === k ? v.color + '15' : 'var(--white)', color: typeFilter === k ? v.color : 'var(--ink-3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
                {['Student', 'Grade', 'Type', 'Description', 'Amount', 'Approved By', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--surface)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={d.student_name} size={30} color={typeConfig[d.type].color} />
                      <div>
                        <p style={{ fontWeight: 600 }}>{d.student_name}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>{d.admission_number}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--ink-3)' }}>{d.grade}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge variant={typeConfig[d.type].variant}>{typeConfig[d.type].label}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--ink-2)', maxWidth: 200 }}>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</p>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                    − {formatKES(d.amount)}
                    {d.percent && <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font)', marginLeft: 4 }}>({d.percent}%)</span>}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--ink-3)' }}>{d.approved_by}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                    {new Date(d.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => toast.success('Discount removed')} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ApplyDiscountModal open={showApply} onClose={() => setShowApply(false)} />
    </div>
  )
}
