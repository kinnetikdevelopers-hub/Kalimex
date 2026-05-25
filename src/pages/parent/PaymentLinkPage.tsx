import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Smartphone, CheckCircle, AlertCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { Button, ProgressBar, Badge } from '../../components/ui'
import { DEMO_STUDENTS, DEMO_INVOICES, DEMO_SCHOOL, formatKES } from '../../lib/mockData'
import toast from 'react-hot-toast'

// Simulated token → student mapping (in production, looked up from payment_links table)
const TOKEN_MAP: Record<string, string> = {
  'gva-std001-t2': 'std-001',
  'gva-std003-t2': 'std-003',
  'gva-std005-t2': 'std-005',
  'gva-std006-t2': 'std-006',
  'gva-std007-t2': 'std-007',
  'demo': 'std-003', // easy demo token
}

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<'loading' | 'invalid' | 'form' | 'waiting' | 'success'>('loading')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    setTimeout(() => {
      const sid = TOKEN_MAP[token || '']
      if (!sid) { setStep('invalid'); return }
      setStudentId(sid)
      setStep('form')
    }, 800)
  }, [token])

  const student = DEMO_STUDENTS.find(s => s.id === studentId)
  const invoice = DEMO_INVOICES.find(i => i.student_id === studentId && i.term_id === 'term-2')

  const handlePay = () => {
    const amt = Number(amount)
    if (!phone || phone.length < 10) { toast.error('Enter a valid M-Pesa phone number'); return }
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (invoice && amt > invoice.balance) { toast.error(`Amount cannot exceed balance of ${formatKES(invoice.balance)}`); return }
    setStep('waiting')
    setTimeout(() => setStep('success'), 4500)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--ink)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9" /></svg>
        </div>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Verifying payment link…</p>
      </div>
    </div>
  )

  // ── Invalid token ─────────────────────────────────────────────────────────
  if (step === 'invalid') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--red-light)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={28} style={{ color: 'var(--red)' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Invalid Payment Link</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          This payment link is invalid or has expired. Please contact the school office for a new link.
        </p>
      </div>
    </div>
  )

  if (!student || !invoice) return null

  const pct = invoice.net_amount > 0 ? Math.round((invoice.paid_amount / invoice.net_amount) * 100) : 0

  // ── Waiting for PIN ───────────────────────────────────────────────────────
  if (step === 'waiting') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--amber-light)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Smartphone size={32} style={{ color: 'var(--amber)', animation: 'pulse 1s ease infinite' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Check Your Phone</h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
          An M-Pesa PIN request has been sent to<br />
          <strong style={{ color: 'var(--ink)', fontSize: 16 }}>{phone}</strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Enter your M-Pesa PIN to complete payment of <strong>{formatKES(Number(amount))}</strong></p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)', animation: `pulse 1s ease ${i * 0.33}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-light)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={36} style={{ color: 'var(--green)' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Payment Successful! 🎉</h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
          {formatKES(Number(amount))} received for <strong style={{ color: 'var(--ink)' }}>{student.full_name}</strong>.<br />
          An SMS receipt has been sent to {phone}.
        </p>

        {/* Receipt card */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'left', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9" /></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Kalimex</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>OFFICIAL RECEIPT</span>
          </div>
          {[
            { l: 'Student', v: student.full_name },
            { l: 'Grade', v: `${student.grade?.name} ${student.stream?.name}` },
            { l: 'School', v: DEMO_SCHOOL.name },
            { l: 'Term', v: 'Term 2 2025' },
            { l: 'Receipt No.', v: `GVA/RCP/2025/0265`, mono: true },
            { l: 'M-Pesa Code', v: `QGH${Math.random().toString(36).substring(2, 8).toUpperCase()}`, mono: true },
            { l: 'Amount Paid', v: formatKES(Number(amount)), bold: true, green: true },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{r.l}</span>
              <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 600, fontFamily: r.mono ? 'var(--mono)' : 'var(--font)', color: r.green ? 'var(--green)' : 'var(--ink)' }}>{r.v}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Thank you. For queries contact {DEMO_SCHOOL.phone}
        </p>
      </div>
    </div>
  )

  // ── Payment Form ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9" /></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{DEMO_SCHOOL.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Secure fee payment · Powered by Kalimex</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={13} style={{ color: 'var(--green-mid)' }} />
          <span style={{ fontSize: 12, color: 'var(--green-mid)', fontWeight: 600 }}>Secured</span>
        </div>
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto', padding: '32px 20px' }}>
        {/* Student summary */}
        <div style={{ background: 'var(--white)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>
              {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>{student.full_name}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{student.admission_number} · {student.grade?.name} {student.stream?.name}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Invoice Total</p>
              <p style={{ fontSize: 15, fontWeight: 700 }}>{formatKES(invoice.net_amount)}</p>
            </div>
            <div style={{ flex: 1, background: 'var(--green-light)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Paid</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{formatKES(invoice.paid_amount)}</p>
            </div>
            <div style={{ flex: 1, background: invoice.balance > 0 ? 'var(--red-light)' : 'var(--green-light)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Balance</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: invoice.balance > 0 ? 'var(--red)' : 'var(--green)' }}>{formatKES(invoice.balance)}</p>
            </div>
          </div>

          <ProgressBar value={invoice.paid_amount} max={invoice.net_amount} />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{pct}% paid · Term 2 2025</p>

          {/* Fee breakdown toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showBreakdown ? 'Hide' : 'View'} fee breakdown
          </button>

          {showBreakdown && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {invoice.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface)', borderRadius: 7 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{item.description}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>{formatKES(item.amount)}</span>
                </div>
              ))}
              {invoice.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--green-light)', borderRadius: 7 }}>
                  <span style={{ fontSize: 13, color: 'var(--green)' }}>Sibling Discount</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>− {formatKES(invoice.discount_amount)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment form */}
        {invoice.balance === 0 ? (
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 16, padding: '24px', textAlign: 'center' }}>
            <CheckCircle size={32} style={{ color: 'var(--green)', marginBottom: 10 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>Fees Fully Paid!</p>
            <p style={{ fontSize: 13, color: 'var(--green)', marginTop: 4 }}>No outstanding balance for Term 2 2025.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--white)', borderRadius: 16, padding: '24px', border: '1px solid var(--line)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Pay via M-Pesa</p>

            {/* Quick amount buttons */}
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>Select amount</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {[invoice.balance, Math.ceil(invoice.balance / 2), 10000].filter(v => v > 0 && v <= invoice.balance).map(v => (
                <button
                  key={v}
                  onClick={() => { setAmount(String(v)); setCustomAmount(false) }}
                  style={{
                    padding: '10px', borderRadius: 10,
                    border: `1.5px solid ${amount === String(v) && !customAmount ? 'var(--green)' : 'var(--line)'}`,
                    background: amount === String(v) && !customAmount ? 'var(--green-light)' : 'var(--white)',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    color: amount === String(v) && !customAmount ? 'var(--green)' : 'var(--ink)',
                    transition: 'all 0.15s',
                  }}
                >
                  {v === invoice.balance ? 'Full Balance' : v === Math.ceil(invoice.balance / 2) ? 'Half' : 'KES 10K'}
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', marginTop: 2 }}>{formatKES(v)}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setCustomAmount(true); setAmount('') }}
              style={{
                width: '100%', padding: '9px', borderRadius: 10, marginBottom: 16,
                border: `1.5px dashed ${customAmount ? 'var(--green)' : 'var(--line)'}`,
                background: customAmount ? 'var(--green-light)' : 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: customAmount ? 'var(--green)' : 'var(--ink-3)',
              }}
            >
              Enter custom amount
            </button>

            {customAmount && (
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount in KES"
                autoFocus
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--green)', borderRadius: 10, fontSize: 15, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none', marginBottom: 16 }}
              />
            )}

            {/* Phone input */}
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>Your M-Pesa phone number</p>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Smartphone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0712 345 678"
                style={{ width: '100%', padding: '13px 14px 13px 42px', border: '1.5px solid var(--line)', borderRadius: 12, fontSize: 15, outline: 'none' }}
              />
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={!amount || !phone}
              style={{
                width: '100%', padding: '15px', borderRadius: 12,
                background: !amount || !phone ? 'var(--line)' : 'var(--ink)',
                color: !amount || !phone ? 'var(--muted)' : 'white',
                border: 'none', cursor: !amount || !phone ? 'not-allowed' : 'pointer',
                fontSize: 16, fontWeight: 800, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <Smartphone size={18} />
              {amount ? `Pay ${formatKES(Number(amount))}` : 'Select an amount to pay'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              🔒 Secured by Safaricom M-Pesa. You will receive a PIN prompt on your phone to confirm.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
