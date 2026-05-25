import { useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export interface RealtimePayment {
  id: string
  student_name: string
  admission_number: string
  amount: number
  mpesa_code: string
  receipt_number: string
  phone: string
  timestamp: string
  grade: string
}

interface UseRealtimePaymentsOptions {
  schoolId: string
  enabled?: boolean
  onPayment?: (payment: RealtimePayment) => void
}

// ─── Simulated realtime payment stream ───────────────────────────────────────
// In production this is: supabase.channel('payments').on('postgres_changes', ...)
// The hook below has the exact same interface — just swap the body for Supabase

const SIMULATED_PAYMENTS: RealtimePayment[] = [
  { id: 'rt-001', student_name: 'Esther Njeri',  admission_number: 'GVA/2024/031', amount: 25500, mpesa_code: 'QRT9AB1C2D', receipt_number: 'GVA/RCP/2025/0260', phone: '0756789012', timestamp: new Date().toISOString(), grade: 'Grade 1' },
  { id: 'rt-002', student_name: 'Gloria Waweru', admission_number: 'GVA/2023/044', amount: 15000, mpesa_code: 'QRT5EF3G4H', receipt_number: 'GVA/RCP/2025/0261', phone: '0756789013', timestamp: new Date().toISOString(), grade: 'Grade 4' },
  { id: 'rt-003', student_name: 'Hassan Abdi',   admission_number: 'GVA/2022/019', amount: 30000, mpesa_code: 'QRT2IJ5K6L', receipt_number: 'GVA/RCP/2025/0262', phone: '0756789014', timestamp: new Date().toISOString(), grade: 'Grade 4' },
]

export function useRealtimePayments({ schoolId, enabled = true, onPayment }: UseRealtimePaymentsOptions) {
  const [payments, setPayments] = useState<RealtimePayment[]>([])
  const [connected, setConnected] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)

  const addPayment = useCallback((payment: RealtimePayment) => {
    setPayments(prev => [payment, ...prev].slice(0, 50))
    onPayment?.(payment)
  }, [onPayment])

  useEffect(() => {
    if (!enabled) return

    // Simulate connection delay
    const connectTimer = setTimeout(() => setConnected(true), 800)

    // Simulate incoming payments every 25 seconds (demo purposes)
    const scheduleNext = () => {
      timerRef.current = setTimeout(() => {
        if (indexRef.current < SIMULATED_PAYMENTS.length) {
          const payment = {
            ...SIMULATED_PAYMENTS[indexRef.current],
            timestamp: new Date().toISOString(),
          }
          addPayment(payment)
          toast.success(
            `💳 Payment received — ${payment.student_name}: KES ${payment.amount.toLocaleString()}`,
            { duration: 5000, icon: '🎉' }
          )
          indexRef.current++
        }
        scheduleNext()
      }, 25000)
    }

    scheduleNext()

    // --- Production Supabase implementation (replace above with this) ---
    // const channel = supabase
    //   .channel(`payments:school:${schoolId}`)
    //   .on('postgres_changes', {
    //     event: 'INSERT',
    //     schema: 'public',
    //     table: 'payments',
    //     filter: `school_id=eq.${schoolId}`,
    //   }, payload => {
    //     const payment = payload.new as RealtimePayment
    //     addPayment(payment)
    //     toast.success(`Payment received — ${payment.student_name}: KES ${payment.amount.toLocaleString()}`)
    //   })
    //   .subscribe(status => setConnected(status === 'SUBSCRIBED'))
    //
    // return () => { supabase.removeChannel(channel) }

    return () => {
      clearTimeout(connectTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [schoolId, enabled, addPayment])

  return { payments, connected }
}

// ─── Realtime payment ticker component ───────────────────────────────────────
import { Wifi, WifiOff, X } from 'lucide-react'
import { formatKES } from './mockData'

export function RealtimeTicker({ schoolId }: { schoolId: string }) {
  const [visible, setVisible] = useState(true)
  const { payments, connected } = useRealtimePayments({ schoolId })

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 340,
      background: 'var(--white)', borderRadius: 16,
      border: '1px solid var(--line)', boxShadow: 'var(--shadow-lg)',
      zIndex: 200, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', background: 'var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {connected
            ? <Wifi size={14} style={{ color: 'var(--green-mid)' }} />
            : <WifiOff size={14} style={{ color: 'var(--amber)' }} />}
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Live Payments</p>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--green-mid)' : 'var(--amber)', animation: connected ? 'pulse 2s ease infinite' : 'none' }} />
        </div>
        <button onClick={() => setVisible(false)} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <X size={15} />
        </button>
      </div>

      {/* Feed */}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {payments.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {connected ? 'Waiting for payments…' : 'Connecting…'}
            </p>
          </div>
        ) : (
          payments.map((p, i) => (
            <div
              key={p.id}
              className={i === 0 ? 'animate-in' : ''}
              style={{
                padding: '12px 16px',
                borderBottom: i < payments.length - 1 ? '1px solid var(--surface)' : 'none',
                background: i === 0 ? 'var(--green-light)' : 'var(--white)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{p.student_name}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatKES(p.amount)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>{p.grade} · {p.mpesa_code}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {new Date(p.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {payments.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>{payments.length} payment{payments.length !== 1 ? 's' : ''} today</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
            +{formatKES(payments.reduce((s, p) => s + p.amount, 0))}
          </p>
        </div>
      )}
    </div>
  )
}
