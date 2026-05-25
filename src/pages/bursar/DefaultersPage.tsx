import { useState, useMemo } from 'react'
import { AlertCircle, Send, MessageSquare, Phone, ChevronDown } from 'lucide-react'
import { SectionHeader, Badge, Card, Button, Modal, Avatar, ProgressBar } from '../../components/ui'
import { DEMO_INVOICES, DEMO_STUDENTS, DEMO_GRADES, formatKES, getStudentGuardians } from '../../lib/mockData'
import type { Invoice } from '../../types'
import toast from 'react-hot-toast'

export default function DefaultersPage() {
  const [gradeFilter, setGradeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'unpaid' | 'partial'>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [smsText, setSmsText] = useState(`Dear Parent,\n\nThis is a reminder that fees for [STUDENT_NAME] (Term 2 2025) are outstanding.\n\nBalance: [BALANCE]\n\nPlease pay via M-Pesa Paybill 400200, Account: [ADMISSION_NO] or click your payment link.\n\nGreen Valley Academy`)
  const [smsSending, setSmsSending] = useState(false)

  const defaulters = useMemo(() => {
    return DEMO_INVOICES.filter(inv => {
      const s = DEMO_STUDENTS.find(st => st.id === inv.student_id)
      const matchStatus = typeFilter === 'all' ? inv.status !== 'paid' : inv.status === typeFilter
      const matchGrade = !gradeFilter || s?.grade_id === gradeFilter
      return matchStatus && matchGrade && inv.balance > 0
    })
  }, [gradeFilter, typeFilter])

  const totalOutstanding = defaulters.reduce((s, i) => s + i.balance, 0)
  const allSelected = selected.length === defaulters.length && defaulters.length > 0

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleAll = () => setSelected(allSelected ? [] : defaulters.map(i => i.id))

  const sendBulkSms = () => {
    setSmsSending(true)
    setTimeout(() => {
      setSmsSending(false)
      toast.success(`SMS sent to ${selected.length} guardians`)
      setShowSmsModal(false)
      setSelected([])
    }, 2000)
  }

  const DefaulterRow = ({ inv }: { inv: Invoice }) => {
    const student = DEMO_STUDENTS.find(s => s.id === inv.student_id)
    const guardians = getStudentGuardians(inv.student_id)
    const primaryGuardian = guardians.find(g => g.is_primary) || guardians[0]
    const isChecked = selected.includes(inv.id)
    const pctPaid = inv.net_amount > 0 ? Math.round((inv.paid_amount / inv.net_amount) * 100) : 0

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
        borderBottom: '1px solid var(--surface)', background: isChecked ? '#FFF8E6' : 'transparent',
        transition: 'background 0.1s',
      }}>
        <input
          type="checkbox" checked={isChecked} onChange={() => toggleSelect(inv.id)}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--green)', flexShrink: 0 }}
        />
        <Avatar name={student?.full_name || '?'} size={38} color={inv.status === 'unpaid' ? 'var(--red)' : 'var(--amber)'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{student?.full_name}</p>
            <Badge variant={inv.status === 'unpaid' ? 'red' : 'amber'} dot>
              {inv.status === 'unpaid' ? 'No Payment' : 'Partial'}
            </Badge>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{student?.admission_number} · {student?.grade?.name} {student?.stream?.name}</p>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, maxWidth: 160 }}>
              <ProgressBar value={inv.paid_amount} max={inv.net_amount} color={inv.status === 'unpaid' ? 'var(--red)' : 'var(--amber)'} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{pctPaid}% paid</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Invoice</p>
          <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>{formatKES(inv.net_amount)}</p>
        </div>
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Paid</p>
          <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{formatKES(inv.paid_amount)}</p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 100 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Balance</p>
          <p style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--red)' }}>{formatKES(inv.balance)}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {primaryGuardian && (
            <a
              href={`tel:${primaryGuardian.phone}`}
              style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={`Call ${primaryGuardian.full_name}`}
            >
              <Phone size={13} />
            </a>
          )}
          <button
            onClick={() => toast.success(`STK push sent to ${primaryGuardian?.phone || 'guardian'}`)}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Send payment link"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <SectionHeader
        title="Defaulters"
        subtitle={`${defaulters.length} students with outstanding balances · ${formatKES(totalOutstanding)} total`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {selected.length > 0 && (
              <Button
                variant="secondary"
                icon={<MessageSquare size={14} />}
                onClick={() => setShowSmsModal(true)}
              >
                SMS {selected.length} Selected
              </Button>
            )}
            <Button
              icon={<MessageSquare size={14} />}
              onClick={() => { setSelected(defaulters.map(i => i.id)); setShowSmsModal(true) }}
            >
              Bulk SMS All
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Outstanding', value: formatKES(totalOutstanding), color: 'var(--red)' },
          { label: 'Fully Unpaid', value: defaulters.filter(i => i.status === 'unpaid').length, color: 'var(--red)', suffix: ' students' },
          { label: 'Partial Payers', value: defaulters.filter(i => i.status === 'partial').length, color: 'var(--amber)', suffix: ' students' },
          { label: 'Avg. Balance', value: formatKES(Math.round(totalOutstanding / (defaulters.length || 1))), color: 'var(--ink)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}{s.suffix || ''}</p>
          </Card>
        ))}
      </div>

      {/* Filters + select */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'unpaid', 'partial'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${typeFilter === t ? 'var(--ink)' : 'var(--line)'}`,
                background: typeFilter === t ? 'var(--ink)' : 'var(--white)',
                color: typeFilter === t ? 'var(--white)' : 'var(--ink-3)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
          style={{ padding: '8px 14px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
          <option value="">All Grades</option>
          {DEMO_GRADES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>
          {selected.length > 0 ? `${selected.length} selected` : ''}
        </span>
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        {/* Table header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
          <input
            type="checkbox" checked={allSelected} onChange={toggleAll}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--green)', flexShrink: 0 }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>Student</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 90, textAlign: 'center' }}>Invoice</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 90, textAlign: 'center' }}>Paid</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 100, textAlign: 'right' }}>Balance</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 70 }}>Actions</span>
        </div>

        {defaulters.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)' }}>All students are paid up! 🎉</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>No outstanding balances for the current filter.</p>
          </div>
        ) : (
          defaulters.map(inv => <DefaulterRow key={inv.id} inv={inv} />)
        )}
      </Card>

      {/* Bulk SMS Modal */}
      <Modal open={showSmsModal} onClose={() => setShowSmsModal(false)} title={`Send SMS to ${selected.length} guardians`} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--amber)', display: 'flex', gap: 10 }}>
            <MessageSquare size={15} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--amber)', lineHeight: 1.5 }}>
              {selected.length} SMS messages will be sent via Africa's Talking. Placeholders [STUDENT_NAME], [BALANCE], [ADMISSION_NO] will be auto-filled per student.
            </p>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
              Message Template <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({smsText.length} chars)</span>
            </label>
            <textarea
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              rows={7}
              style={{
                width: '100%', padding: '12px 14px', border: '1.5px solid var(--line)',
                borderRadius: 10, fontSize: 13, color: 'var(--ink)',
                fontFamily: 'var(--mono)', resize: 'vertical', outline: 'none',
              }}
            />
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['[STUDENT_NAME]', '[BALANCE]', '[ADMISSION_NO]'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSmsText(prev => prev + ' ' + tag)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--white)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer', color: 'var(--blue)' }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>Est. cost: KES {selected.length * 2}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowSmsModal(false)}>Cancel</Button>
            <Button loading={smsSending} icon={<Send size={14} />} onClick={sendBulkSms}>
              Send {selected.length} Messages
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
