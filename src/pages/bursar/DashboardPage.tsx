import { useState } from 'react'
import { TrendingUp, Users, AlertCircle, CheckCircle, Clock, ArrowRight, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard, Badge, Card, Button, Avatar, ProgressBar } from '../../components/ui'
import {
  DEMO_TERM_SUMMARY, DEMO_DAILY_COLLECTIONS, DEMO_INVOICES,
  DEMO_PAYMENTS, DEMO_STUDENTS, formatKES, CURRENT_TERM
} from '../../lib/mockData'
import { RealtimeTicker } from '../../lib/realtimePayments'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Invoice } from '../../types'

const statusBadge = (status: Invoice['status']) => {
  const map = { paid: 'green', partial: 'amber', unpaid: 'red', overpaid: 'blue', waived: 'muted' } as const
  return <Badge variant={map[status]} dot>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [period] = useState('term-2')

  const summary = DEMO_TERM_SUMMARY
  const recentPayments = DEMO_PAYMENTS.slice(0, 5)
  const defaulters = DEMO_INVOICES.filter(i => i.status === 'unpaid' || i.status === 'partial').slice(0, 4)

  const chartData = DEMO_DAILY_COLLECTIONS.slice(-10).map(d => ({
    date: d.date.slice(5),
    amount: d.amount / 1000,
  }))

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="animate-in" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Avatar name={user?.full_name || 'U'} size={40} />
          <div>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>{greeting()},</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{user?.full_name?.split(' ')[0]} 👋</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Badge variant="green" dot>Term 2 2025 — Active</Badge>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Fee due: 9 May 2025 · Green Valley Academy</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total Expected"
          value={formatKES(summary.total_expected)}
          sub={`${summary.total_students} students`}
          icon={<TrendingUp size={20} />}
          color="var(--ink)"
        />
        <StatCard
          label="Collected"
          value={formatKES(summary.total_collected)}
          sub={`↑ ${summary.collection_rate}% collection rate`}
          icon={<CheckCircle size={20} />}
          color="var(--green)"
          trend="up"
        />
        <StatCard
          label="Outstanding"
          value={formatKES(summary.total_outstanding)}
          sub={`${summary.defaulters + summary.partial_payers} students pending`}
          icon={<Clock size={20} />}
          color="var(--amber)"
          trend="down"
        />
        <StatCard
          label="Defaulters"
          value={summary.defaulters}
          sub="No payment this term"
          icon={<AlertCircle size={20} />}
          color="var(--red)"
          trend="down"
        />
      </div>

      {/* Collection progress */}
      <Card style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Term Collection Progress</p>
            <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>{CURRENT_TERM.name}</p>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{summary.collection_rate}%</p>
        </div>
        <ProgressBar value={summary.total_collected} max={summary.total_expected} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Paid in full', value: summary.paid_in_full, color: 'var(--green)' },
              { label: 'Partial', value: summary.partial_payers, color: 'var(--amber)' },
              { label: 'Unpaid', value: summary.defaulters, color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{s.value} {s.label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{formatKES(summary.total_outstanding)} remaining</p>
        </div>
      </Card>

      {/* Chart + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 24 }}>
        {/* Chart */}
        <Card style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Daily Collections (KES '000s)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip
                formatter={(v) => [`KES ${Number(v).toFixed(1)}K`, 'Amount']}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="var(--green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <Card style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Quick Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Record Payment', sub: 'Cash, cheque or M-Pesa', icon: <Zap size={16} />, color: 'var(--green)', to: '/payments/new' },
              { label: 'Send Payment Link', sub: 'STK push to parent', icon: <TrendingUp size={16} />, color: 'var(--blue)', to: '/payments/link' },
              { label: 'View Defaulters', sub: `${summary.defaulters} unpaid`, icon: <AlertCircle size={16} />, color: 'var(--red)', to: '/defaulters' },
              { label: 'Generate Report', sub: 'Term financial report', icon: <CheckCircle size={16} />, color: 'var(--amber)', to: '/reports' },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--white)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = a.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: a.color + '15', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{a.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{a.sub}</p>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--muted)' }} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Payments + Pending */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Payments */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Recent Payments</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/payments')} icon={<ArrowRight size={14} />}>View all</Button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recentPayments.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
                <Avatar name={p.student?.full_name || '?'} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.student?.full_name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {p.mpesa_code ? `M-Pesa · ${p.mpesa_code}` : p.payment_method.replace('_', ' ')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{formatKES(p.amount)}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(p.payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending / Partial */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Pending Payments</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/defaulters')} icon={<ArrowRight size={14} />}>View all</Button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {defaulters.map(inv => {
              const student = DEMO_STUDENTS.find(s => s.id === inv.student_id)
              return (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
                  <Avatar name={student?.full_name || '?'} size={34} color="var(--red)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student?.full_name}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>{student?.grade?.name} · {student?.stream?.name}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>{formatKES(inv.balance)}</p>
                    {statusBadge(inv.status)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
      <RealtimeTicker schoolId="sch-001" />
    </div>
  )
}
