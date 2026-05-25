import { useState } from 'react'
import { Building2, Users, TrendingUp, Plus, CheckCircle, AlertCircle, Settings, Lock, Smartphone } from 'lucide-react'
import { StatCard, Card, Badge, Button, Avatar } from '../../components/ui'
import { useAllSchools } from '../../lib/useSchoolData'
import { formatKES } from '../../lib/mockData'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const tierColor:   Record<string, any> = { starter: 'muted', growth: 'blue', pro: 'green' }
const statusColor: Record<string, any> = { active: 'green', trial: 'amber', suspended: 'red', cancelled: 'muted' }

export default function SuperAdminDashboard() {
  const { schools, loading } = useAllSchools()
  const navigate = useNavigate()

  const totalMRR      = schools.filter(s => s.subscription_status === 'active').reduce((s, sc) => s + (sc as any).mrr || 0, 0)
  const totalStudents = schools.reduce((s, sc) => s + ((sc as any).students || 0), 0)
  const activeSchools = schools.filter(s => s.subscription_status === 'active').length
  const pendingDaraja = schools.filter(s => !s.daraja_configured).length

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Kalimex Admin</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>Platform overview · {schools.length} schools</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => navigate('/super-admin/schools')}>Onboard School</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Schools"   value={schools.length}                    sub={`${activeSchools} active`}           icon={<Building2 size={20} />} />
        <StatCard label="Total Students"  value={totalStudents.toLocaleString()}    sub="Across all schools"                  icon={<Users size={20} />} />
        <StatCard label="Monthly Revenue" value={formatKES(totalMRR || 34500)}      sub="Active subscriptions"                icon={<TrendingUp size={20} />}  color="var(--green)" />
        <StatCard label="Daraja Pending"  value={pendingDaraja}                     sub="M-Pesa not configured"               icon={<Smartphone size={20} />} color={pendingDaraja > 0 ? 'var(--amber)' : 'var(--green)'} />
      </div>

      {/* Schools table */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700 }}>All Schools</p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/super-admin/schools')}>Manage all →</Button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
                {['School','Plan','Status','M-Pesa','MRR','Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : schools.slice(0, 8)).map(sc => (
                <tr key={sc.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  style={{ borderBottom: '1px solid var(--surface)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={sc.name} size={30} color="var(--green)" />
                      <div>
                        <p style={{ fontWeight: 700 }}>{sc.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>{sc.county}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={tierColor[sc.subscription_tier] || 'muted'}>
                      {sc.subscription_tier.charAt(0).toUpperCase() + sc.subscription_tier.slice(1)}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={statusColor[sc.subscription_status] || 'muted'} dot>
                      {sc.subscription_status.charAt(0).toUpperCase() + sc.subscription_status.slice(1)}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {sc.daraja_configured
                      ? <Badge variant="green"><CheckCircle size={10} /> Connected</Badge>
                      : <Badge variant="amber"><AlertCircle size={10} /> Not set</Badge>}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green)' }}>
                    {(sc as any).mrr > 0 ? formatKES((sc as any).mrr) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => navigate('/super-admin/schools')}
                        style={{ padding: '4px 10px', borderRadius: 7, background: 'var(--green-light)', color: 'var(--green)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Smartphone size={11} /> Daraja
                      </button>
                      <button onClick={() => toast.success(`Managing ${sc.name}`)}
                        style={{ padding: '4px 10px', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Settings size={11} /> Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
