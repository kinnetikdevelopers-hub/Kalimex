import { useState, useMemo } from 'react'
import { Search, Plus, Send, CheckCircle, Clock, XCircle, Smartphone, Banknote, Building2, CreditCard, Download } from 'lucide-react'
import { SectionHeader, Badge, Card, Button, Modal, Input, Select, Avatar, EmptyState, Spinner } from '../../components/ui'
import { usePayments } from '../../lib/useSchoolData'
import { DEMO_STUDENTS, DEMO_INVOICES, DEMO_SCHOOL, formatKES } from '../../lib/mockData'
import { generateReceiptPDF, downloadPDF } from '../../lib/pdfReceipt'
import { useAuth } from '../../context/AuthContext'
import type { Payment } from '../../types'
import toast from 'react-hot-toast'

const methodLabel = (m: Payment['payment_method']) => ({
  mpesa_stk: 'M-Pesa STK', mpesa_paybill: 'M-Pesa Paybill',
  cash: 'Cash', cheque: 'Cheque', bank_transfer: 'Bank Transfer',
  bursary: 'Bursary', scholarship: 'Scholarship',
}[m] || m)

const methodIcon = (m: Payment['payment_method']) => {
  if (m === 'mpesa_stk' || m === 'mpesa_paybill') return <Smartphone size={13} />
  if (m === 'cash') return <Banknote size={13} />
  if (m === 'bank_transfer') return <Building2 size={13} />
  return <CreditCard size={13} />
}

const statusBadge = (s: Payment['status']) => {
  const m = { completed: 'green', pending: 'amber', failed: 'red', reversed: 'muted' } as const
  const icons = { completed: <CheckCircle size={10}/>, pending: <Clock size={10}/>, failed: <XCircle size={10}/>, reversed: <XCircle size={10}/> }
  return <Badge variant={m[s]}>{icons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</Badge>
}

// ─── STK Push Modal ───────────────────────────────────────────────────────────
function StkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [studentId, setStudentId] = useState('')
  const [phone, setPhone]         = useState('')
  const [amount, setAmount]       = useState('')
  const [step, setStep]           = useState<'form'|'waiting'|'done'>('form')
  const [loading, setLoading]     = useState(false)

  const student = DEMO_STUDENTS.find(s => s.id === studentId)
  const invoice = DEMO_INVOICES.find(i => i.student_id === studentId && i.term_id === 'term-2')

  const handleSend = () => {
    if (!studentId || !phone || !amount) { toast.error('Fill all fields'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('waiting'); setTimeout(() => setStep('done'), 4000) }, 1200)
  }

  const reset = () => { setStep('form'); setStudentId(''); setPhone(''); setAmount(''); onClose() }

  return (
    <Modal open={open} onClose={reset} title="Send STK Push to Parent" width={460}>
      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
            <Smartphone size={14} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--green)', lineHeight: 1.5 }}>Parent receives an M-Pesa PIN prompt instantly. Payment is auto-reconciled to their account.</p>
          </div>
          <Select label="Student" value={studentId} onChange={v => {
            setStudentId(v)
            const inv = DEMO_INVOICES.find(i => i.student_id === v && i.term_id === 'term-2')
            if (inv) setAmount(String(inv.balance))
          }} placeholder="Select student…" options={DEMO_STUDENTS.map(s => ({ value: s.id, label: `${s.full_name} (${s.admission_number})` }))} />
          {invoice && student && (
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Outstanding</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: invoice.balance > 0 ? 'var(--red)' : 'var(--green)' }}>{formatKES(invoice.balance)}</span>
              </div>
            </div>
          )}
          <Input label="Parent M-Pesa Phone" value={phone} onChange={setPhone} placeholder="07XXXXXXXX" type="tel" icon={<Smartphone size={13}/>} required />
          <Input label="Amount (KES)" value={amount} onChange={setAmount} placeholder="0" type="number" required />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={reset}>Cancel</Button>
            <Button loading={loading} icon={<Send size={13}/>} onClick={handleSend}>Send STK Push</Button>
          </div>
        </div>
      )}
      {step === 'waiting' && (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--amber-light)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={26} style={{ color: 'var(--amber)', animation: 'pulse 1s ease infinite' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Waiting for PIN…</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Push sent to <strong>{phone}</strong>. Parent is entering their M-Pesa PIN.</p>
        </div>
      )}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-light)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={28} style={{ color: 'var(--green)' }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Payment Confirmed 🎉</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{formatKES(Number(amount))} received. Ledger updated. Receipt SMS sent to parent.</p>
          <Button onClick={reset} style={{ width: '100%' }}>Done</Button>
        </div>
      )}
    </Modal>
  )
}

// ─── Record Manual Payment Modal ──────────────────────────────────────────────
function RecordModal({ open, onClose, onRecord }: { open: boolean; onClose: () => void; onRecord: (p: any) => Promise<any> }) {
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [method, setMethod]       = useState('')
  const [amount, setAmount]       = useState('')
  const [ref, setRef]             = useState('')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)

  const invoice = DEMO_INVOICES.find(i => i.student_id === studentId && i.term_id === 'term-2')

  const handleSave = async () => {
    if (!studentId || !method || !amount) { toast.error('Fill all required fields'); return }
    setSaving(true)
    const { data, error } = await onRecord({
      student_id: studentId,
      invoice_id: invoice?.id,
      payment_method: method,
      amount: Number(amount),
      mpesa_code: method === 'mpesa_paybill' ? ref : undefined,
      cheque_number: method === 'cheque' ? ref : undefined,
      bank_ref: method === 'bank_transfer' ? ref : undefined,
      notes,
      received_by: user?.id || 'b-001',
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success('Payment recorded. Receipt generated.')

    // Auto-download PDF receipt
    if (data && invoice) {
      const student = DEMO_STUDENTS.find(s => s.id === studentId)
      if (student) {
        try {
          const bytes = await generateReceiptPDF({ payment: data, invoice, student, school: DEMO_SCHOOL })
          downloadPDF(bytes, `${data.receipt_number?.replace(/\//g, '-') || 'receipt'}.pdf`)
        } catch { /* pdf generation is bonus, don't block */ }
      }
    }

    setStudentId(''); setMethod(''); setAmount(''); setRef(''); setNotes('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Select label="Student *" value={studentId} onChange={v => {
          setStudentId(v)
          const inv = DEMO_INVOICES.find(i => i.student_id === v && i.term_id === 'term-2')
          if (inv) setAmount(String(inv.balance))
        }} placeholder="Select student…" options={DEMO_STUDENTS.map(s => ({ value: s.id, label: `${s.full_name} (${s.admission_number})` }))} />
        {invoice && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { l: 'Invoice', v: formatKES(invoice.net_amount), c: 'var(--ink)' },
              { l: 'Paid', v: formatKES(invoice.paid_amount), c: 'var(--green)' },
              { l: 'Balance', v: formatKES(invoice.balance), c: invoice.balance > 0 ? 'var(--red)' : 'var(--green)' },
            ].map(s => (
              <div key={s.l} style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--muted)' }}>{s.l}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
        )}
        <Select label="Method *" value={method} onChange={setMethod} placeholder="Select method…" options={[
          { value: 'cash', label: 'Cash' },
          { value: 'cheque', label: 'Cheque' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'mpesa_paybill', label: 'M-Pesa Paybill (manual entry)' },
        ]} />
        <Input label="Amount (KES) *" value={amount} onChange={setAmount} type="number" placeholder="0" />
        {(method === 'cheque' || method === 'bank_transfer' || method === 'mpesa_paybill') && (
          <Input label={method === 'cheque' ? 'Cheque Number' : method === 'bank_transfer' ? 'Bank Reference' : 'M-Pesa Code'}
            value={ref} onChange={setRef} placeholder={method === 'mpesa_paybill' ? 'e.g. QGH2KL9X0A' : ''} />
        )}
        <Input label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any notes…" />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} icon={<CheckCircle size={13}/>} onClick={handleSave}>Record & Download Receipt</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id || 'sch-001'
  const { payments, loading, recordPayment } = usePayments(schoolId)
  const [search, setSearch]       = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [showStk, setShowStk]     = useState(false)
  const [showRecord, setShowRecord] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return payments.filter(p => {
      const name = (p.student as any)?.full_name?.toLowerCase() || ''
      const code = p.mpesa_code?.toLowerCase() || ''
      const rcp  = p.receipt_number.toLowerCase()
      return (!q || name.includes(q) || code.includes(q) || rcp.includes(q))
        && (!methodFilter || p.payment_method === methodFilter)
    })
  }, [payments, search, methodFilter])

  const totalToday = payments
    .filter(p => p.payment_date?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((s, p) => s + p.amount, 0)

  const handleDownload = async (p: Payment) => {
    const invoice = DEMO_INVOICES.find(i => i.id === p.invoice_id)
    const student = DEMO_STUDENTS.find(s => s.id === p.student_id)
    if (!invoice || !student) { toast.error('Receipt data unavailable'); return }
    toast.loading('Generating PDF…', { id: 'pdf' })
    try {
      const bytes = await generateReceiptPDF({ payment: p, invoice, student, school: DEMO_SCHOOL })
      downloadPDF(bytes, `${p.receipt_number.replace(/\//g, '-')}.pdf`)
      toast.success('Receipt downloaded', { id: 'pdf' })
    } catch { toast.error('Failed to generate PDF', { id: 'pdf' }) }
  }

  return (
    <div className="animate-in">
      <SectionHeader
        title="Payments"
        subtitle={`${payments.length} transactions this term`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<Send size={13}/>} onClick={() => setShowStk(true)}>STK Push</Button>
            <Button icon={<Plus size={13}/>} onClick={() => setShowRecord(true)}>Record Payment</Button>
          </div>
        }
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { l: "Today's Collections", v: formatKES(totalToday), c: 'var(--green)', sub: `${payments.filter(p => p.payment_date?.startsWith(new Date().toISOString().split('T')[0])).length} transactions` },
          { l: 'M-Pesa Payments', v: formatKES(payments.filter(p => p.payment_method?.startsWith('mpesa')).reduce((s,p) => s+p.amount,0)), c: 'var(--ink)', sub: `${payments.filter(p => p.payment_method?.startsWith('mpesa')).length} transactions` },
          { l: 'Cash / Cheque / Bank', v: formatKES(payments.filter(p => !p.payment_method?.startsWith('mpesa')).reduce((s,p) => s+p.amount,0)), c: 'var(--ink)', sub: `${payments.filter(p => !p.payment_method?.startsWith('mpesa')).length} transactions` },
        ].map(s => (
          <Card key={s.l} style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, receipt, M-Pesa code…"
            style={{ width: '100%', padding: '9px 14px 9px 34px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 13, background: 'var(--white)', outline: 'none' }} />
        </div>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
          style={{ padding: '9px 13px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
          <option value="">All Methods</option>
          <option value="mpesa_stk">M-Pesa STK</option>
          <option value="mpesa_paybill">M-Pesa Paybill</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={24} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={null} title="No payments found" description="Adjust your search or record a payment" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
                  {['Student','Receipt No.','Method','M-Pesa Code','Amount','Date','Status','Receipt'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const s = DEMO_STUDENTS.find(st => st.id === p.student_id)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--surface)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Avatar name={(p.student as any)?.full_name || s?.full_name || '?'} size={28} />
                          <div>
                            <p style={{ fontWeight: 600 }}>{(p.student as any)?.full_name || s?.full_name}</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{(p.student as any)?.admission_number || s?.admission_number}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)' }}>{p.receipt_number}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-3)' }}>
                          {methodIcon(p.payment_method)}<span>{methodLabel(p.payment_method)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: p.mpesa_code ? 'var(--ink)' : 'var(--muted)' }}>{p.mpesa_code || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatKES(p.amount)}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                        {new Date(p.payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '11px 14px' }}>{statusBadge(p.status)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <button onClick={() => handleDownload(p)}
                          style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Download size={12}/> PDF
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <StkModal open={showStk} onClose={() => setShowStk(false)} />
      <RecordModal open={showRecord} onClose={() => setShowRecord(false)} onRecord={recordPayment} />
    </div>
  )
}
