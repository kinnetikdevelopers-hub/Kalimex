import { useState } from 'react'
import { CreditCard, Download, Send, CheckCircle, Clock, Smartphone, LogOut } from 'lucide-react'
import { Card, Badge, Button, Modal, Input, ProgressBar } from '../../components/ui'
import { DEMO_STUDENTS, DEMO_INVOICES, DEMO_PAYMENTS, formatKES, CURRENT_TERM } from '../../lib/mockData'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// Simulate parent seeing their two children (Kamau family)
const PARENT_STUDENTS = DEMO_STUDENTS.filter(s => s.family_id === 'fam-001')

function PayModal({ open, onClose, invoiceId }: { open: boolean; onClose: () => void; invoiceId: string }) {
  const [step, setStep] = useState<'form' | 'waiting' | 'done'>('form')
  const [phone, setPhone] = useState('0712345678')
  const [amount, setAmount] = useState('')
  const invoice = DEMO_INVOICES.find(i => i.id === invoiceId)

  const handlePay = () => {
    if (!phone || !amount) return
    setStep('waiting')
    setTimeout(() => setStep('done'), 4000)
  }

  const reset = () => { setStep('form'); setAmount(''); onClose() }

  return (
    <Modal open={open} onClose={reset} title="Pay via M-Pesa" width={440}>
      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {invoice && (
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Invoice</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>{invoice.invoice_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Outstanding Balance</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--mono)' }}>{formatKES(invoice.balance)}</span>
              </div>
            </div>
          )}

          <Input
            label="Your M-Pesa Phone Number"
            value={phone}
            onChange={setPhone}
            type="tel"
            placeholder="07XXXXXXXX"
            icon={<Smartphone size={14} />}
            required
          />

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Amount (KES) <span style={{ color: 'var(--red)' }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              {invoice && [invoice.balance, Math.ceil(invoice.balance / 2), 10000].filter(v => v > 0).map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  style={{
                    padding: '8px', borderRadius: 8, border: `1.5px solid ${amount === String(v) ? 'var(--green)' : 'var(--line)'}`,
                    background: amount === String(v) ? 'var(--green-light)' : 'var(--white)',
                    color: amount === String(v) ? 'var(--green)' : 'var(--ink-3)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {formatKES(v)}
                </button>
              ))}
            </div>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Or enter custom amount"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
            <Smartphone size={15} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--green)', lineHeight: 1.5 }}>
              You will receive an M-Pesa PIN prompt on {phone}. Enter your PIN to complete payment. It's instant and secure.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={reset} style={{ flex: 1 }}>Cancel</Button>
            <Button onClick={handlePay} icon={<Send size={14} />} style={{ flex: 2 }} disabled={!amount || !phone}>
              Pay {amount ? formatKES(Number(amount)) : 'Now'}
            </Button>
          </div>
        </div>
      )}

      {step === 'waiting' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--amber-light)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={32} style={{ color: 'var(--amber)', animation: 'pulse 1s ease infinite' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Check Your Phone</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            A payment request has been sent to<br /><strong style={{ color: 'var(--ink)' }}>{phone}</strong>.<br /><br />
            Please enter your M-Pesa PIN to complete the payment.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)', animation: `pulse 1s ease ${i * 0.33}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-light)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} style={{ color: 'var(--green)' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Payment Successful! 🎉</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            {formatKES(Number(amount))} received successfully.<br />
            A receipt has been sent to {phone} via SMS.
          </p>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 20 }}>
            {[
              { label: 'M-Pesa Code', value: 'QGH9XY' + Math.random().toString(36).substring(2, 7).toUpperCase() },
              { label: 'Receipt No.', value: 'GVA/RCP/2025/0265' },
              { label: 'Amount', value: formatKES(Number(amount)) },
              { label: 'Date', value: new Date().toLocaleDateString('en-KE') },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<Download size={13} />} style={{ flex: 1 }} onClick={() => toast.success('Receipt downloaded')}>Receipt</Button>
            <Button onClick={reset} style={{ flex: 2 }}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function ParentPortal() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [payInvoiceId, setPayInvoiceId] = useState('')
  const [activeChild, setActiveChild] = useState(PARENT_STUDENTS[0]?.id || '')

  const student = PARENT_STUDENTS.find(s => s.id === activeChild) || PARENT_STUDENTS[0]
  const invoice = DEMO_INVOICES.find(i => i.student_id === activeChild && i.term_id === 'term-2')
  const payments = DEMO_PAYMENTS.filter(p => p.student_id === activeChild)

  const allPayments = PARENT_STUDENTS.flatMap(s => DEMO_PAYMENTS.filter(p => p.student_id === s.id))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9" /></svg>
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Kalimex Parent Portal</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>Green Valley Academy</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{user?.full_name}</span>
          <button onClick={async () => { await signOut(); navigate('/login') }}
            style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Child switcher */}
        {PARENT_STUDENTS.length > 1 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', alignSelf: 'center', marginRight: 4 }}>Viewing:</p>
            {PARENT_STUDENTS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveChild(s.id)}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  border: `1.5px solid ${activeChild === s.id ? 'var(--green)' : 'var(--line)'}`,
                  background: activeChild === s.id ? 'var(--green-light)' : 'var(--white)',
                  color: activeChild === s.id ? 'var(--green)' : 'var(--ink-3)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {s.full_name.split(' ')[0]} ({s.grade?.name})
              </button>
            ))}
          </div>
        )}

        {/* Student card */}
        {student && invoice && (
          <Card style={{ marginBottom: 24, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>
                {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{student.full_name}</h2>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{student.admission_number} · {student.grade?.name} {student.stream?.name} · {CURRENT_TERM.name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Outstanding Balance</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: invoice.balance === 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em' }}>
                  {formatKES(invoice.balance)}
                </p>
                {invoice.balance === 0
                  ? <Badge variant="green" dot>Fully Paid</Badge>
                  : <Button icon={<CreditCard size={14} />} onClick={() => setPayInvoiceId(invoice.id)} style={{ marginTop: 8 }}>Pay Now</Button>}
              </div>
            </div>

            {invoice.net_amount > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Payment progress</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatKES(invoice.paid_amount)} of {formatKES(invoice.net_amount)}</span>
                </div>
                <ProgressBar value={invoice.paid_amount} max={invoice.net_amount} />
              </div>
            )}
          </Card>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Fee breakdown */}
          {invoice && (
            <Card>
              <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Fee Breakdown — {CURRENT_TERM.name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invoice.items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{item.description}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>{formatKES(item.amount)}</span>
                  </div>
                ))}
                {invoice.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--green-light)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--green)' }}>Sibling Discount</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--mono)' }}>− {formatKES(invoice.discount_amount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--ink)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Total</span>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--mono)', color: 'white' }}>{formatKES(invoice.net_amount)}</span>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={() => toast.success('Invoice PDF downloaded')} style={{ width: '100%' }}>
                  Download Invoice
                </Button>
              </div>
            </Card>
          )}

          {/* Payment history */}
          <Card>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Payment History</p>
            {allPayments.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No payments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allPayments.slice(0, 5).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{p.receipt_number}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {p.mpesa_code ? `M-Pesa · ${p.mpesa_code}` : p.payment_method.replace('_', ' ')} · {new Date(p.payment_date).toLocaleDateString('en-KE')}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatKES(p.amount)}</p>
                      <button onClick={() => toast.success('Receipt downloaded')} style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>Receipt</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {invoice && invoice.balance > 0 && (
              <Button onClick={() => setPayInvoiceId(invoice.id)} icon={<CreditCard size={14} />} style={{ width: '100%', marginTop: 12 }}>
                Make Payment
              </Button>
            )}
          </Card>
        </div>

        {/* Sibling info */}
        {PARENT_STUDENTS.length > 1 && (
          <Card style={{ background: 'var(--green-light)', border: '1px solid var(--green)' }}>
            <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>✓ Sibling Discount Applied</p>
            <p style={{ fontSize: 13, color: 'var(--green)', lineHeight: 1.5 }}>
              You have {PARENT_STUDENTS.length} children enrolled at Green Valley Academy. Sibling discounts have been automatically applied to your invoices.
            </p>
          </Card>
        )}
      </div>

      <PayModal open={!!payInvoiceId} onClose={() => setPayInvoiceId('')} invoiceId={payInvoiceId} />
    </div>
  )
}
