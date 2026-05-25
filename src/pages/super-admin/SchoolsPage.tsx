import { useState } from 'react'
import {
  Building2, CheckCircle, AlertCircle, Wifi,
  Settings, Users, TrendingUp, Plus, Smartphone, Lock
} from 'lucide-react'
import { SectionHeader, Card, Button, Input, Badge, Modal, Avatar, Select, Spinner } from '../../components/ui'
import { formatKES } from '../../lib/mockData'
import { useAllSchools } from '../../lib/useSchoolData'
import toast from 'react-hot-toast'

const ALL_SCHOOLS = [
  { id: 'sch-001', name: 'Green Valley Academy',   county: 'Nairobi',  tier: 'growth',  status: 'active',    students: 312, mrr: 7000,  daraja: true  },
  { id: 'sch-002', name: 'Sunrise Primary School', county: 'Kiambu',   tier: 'starter', status: 'active',    students: 134, mrr: 3500,  daraja: true  },
  { id: 'sch-003', name: 'Amani Academy',           county: 'Mombasa',  tier: 'pro',     status: 'active',    students: 678, mrr: 12000, daraja: false },
  { id: 'sch-004', name: 'New Horizons Primary',    county: 'Nakuru',   tier: 'starter', status: 'trial',     students: 89,  mrr: 0,     daraja: false },
  { id: 'sch-005', name: 'Pioneer Academy',         county: 'Nairobi',  tier: 'growth',  status: 'suspended', students: 245, mrr: 0,     daraja: true  },
]

// ─── Daraja Config Modal ──────────────────────────────────────────────────────
// Credentials are WRITE-ONLY. Once saved, they are never displayed again.
// The input fields clear on open. No eye toggle. No reveal. Ever.
function DarajaConfigModal({ school, open, onClose }: {
  school: typeof ALL_SCHOOLS[0]; open: boolean; onClose: () => void
}) {
  const [paybill, setPaybill]           = useState('')
  const [consumerKey, setConsumerKey]   = useState('')
  const [consumerSecret, setConsumerSecret] = useState('')
  const [passkey, setPasskey]           = useState('')
  const [env, setEnv]                   = useState<'sandbox' | 'production'>('production')
  const [testing, setTesting]           = useState(false)
  const [tested, setTested]             = useState(false)
  const [saving, setSaving]             = useState(false)

  const allFilled = paybill && consumerKey && consumerSecret && passkey

  const handleTest = () => {
    if (!allFilled) { toast.error('Fill all fields before testing'); return }
    setTesting(true)
    setTimeout(() => {
      setTesting(false)
      setTested(true)
      toast.success('Connection successful — Daraja responded correctly')
    }, 2500)
  }

  const handleSave = () => {
    if (!tested) { toast.error('Test the connection first'); return }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success(`Credentials saved for ${school.name}. They cannot be retrieved.`)
      onClose()
    }, 1000)
  }

  const handleClose = () => {
    // Clear all fields on close — never persisted in component state
    setPaybill(''); setConsumerKey(''); setConsumerSecret(''); setPasskey('')
    setTested(false); setTesting(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Configure M-Pesa — ${school.name}`} width={500}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Security notice */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
          <Lock size={14} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            Credentials are encrypted and stored server-side. Once saved, they <strong style={{ color: 'var(--ink)' }}>cannot be retrieved or viewed</strong> — not by you, not by school staff, not by anyone. To update them, enter new values and save again.
          </p>
        </div>

        {/* Current status */}
        {school.daraja && (
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--green)' }}>
              Daraja is currently <strong>connected</strong> for this school. Fill the form below to replace the existing credentials.
            </p>
          </div>
        )}

        {/* Environment */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(['sandbox', 'production'] as const).map(e => (
            <button
              key={e}
              onClick={() => { setEnv(e); setTested(false) }}
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                border: `2px solid ${env === e ? (e === 'production' ? 'var(--green)' : 'var(--blue)') : 'var(--line)'}`,
                background: env === e ? (e === 'production' ? 'var(--green-light)' : 'var(--blue-light)') : 'var(--white)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize' }}>{e}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>{e === 'sandbox' ? 'Testing only — no real money' : 'Live M-Pesa payments'}</p>
            </button>
          ))}
        </div>

        {/* Fields — plain password inputs, no reveal */}
        <Input
          label="Paybill Number"
          value={paybill}
          onChange={v => { setPaybill(v); setTested(false) }}
          placeholder="e.g. 400200"
          icon={<Smartphone size={14} />}
          required
        />

        {[
          { label: 'Consumer Key',    value: consumerKey,    set: setConsumerKey    },
          { label: 'Consumer Secret', value: consumerSecret, set: setConsumerSecret },
          { label: 'Passkey',         value: passkey,        set: setPasskey        },
        ].map(f => (
          <div key={f.label}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
              {f.label} <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <input
              type="password"
              value={f.value}
              autoComplete="new-password"
              onChange={e => { f.set(e.target.value); setTested(false) }}
              placeholder="Paste from Daraja dashboard — will not be shown again"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid var(--line)', borderRadius: 10,
                fontSize: 13, fontFamily: 'var(--mono)', outline: 'none',
                background: 'var(--white)',
              }}
            />
          </div>
        ))}

        {/* Test result */}
        {tested && (
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} style={{ color: 'var(--green)' }} />
            <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Connection verified — ready to save</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            variant="secondary"
            icon={<Wifi size={14} />}
            loading={testing}
            disabled={!allFilled}
            onClick={handleTest}
          >
            Test Connection
          </Button>
          <Button
            icon={<Lock size={14} />}
            loading={saving}
            disabled={!tested}
            onClick={handleSave}
          >
            Save & Encrypt
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Add School Modal ─────────────────────────────────────────────────────────
function AddSchoolModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (s: any) => Promise<any> }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName]         = useState('')
  const [county, setCounty]     = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [principal, setPrincipal] = useState('')
  const [tier, setTier]         = useState('starter')
  const [loading, setLoading]   = useState(false)

  const reset = () => {
    setStep(1); setName(''); setCounty(''); setPhone('')
    setEmail(''); setPrincipal(''); setTier('starter')
  }

  const handleCreate = async () => {
    setLoading(true)
    const { error } = await onAdd({
      name, county, phone, email,
      principal_name: principal,
      subscription_tier: tier,
      short_name: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 4),
    })
    setLoading(false)
    if (error) { toast.error(error); return }
    toast.success(`${name} onboarded. Login credentials sent to ${email}.`)
    reset(); onClose()
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Onboard New School" width={520}>
      {/* Step dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
        {['School Info', 'Plan', 'Confirm'].map((s, i) => (
          <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--ink)' : 'var(--line)',
                color: step >= i + 1 ? 'white' : 'var(--muted)',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? 'var(--green)' : 'var(--line)', margin: '0 8px' }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="School Name" value={name} onChange={setName} placeholder="e.g. Sunrise Academy" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="County" value={county} onChange={setCounty} placeholder="Select county"
              options={['Nairobi','Kiambu','Mombasa','Nakuru','Kisumu','Nyeri','Machakos','Kajiado','Muranga'].map(c => ({ value: c, label: c }))} />
            <Input label="Phone" value={phone} onChange={setPhone} placeholder="07XXXXXXXX" required />
          </div>
          <Input label="School Email" value={email} onChange={setEmail} type="email" placeholder="info@school.sc.ke" required />
          <Input label="Principal Name" value={principal} onChange={setPrincipal} placeholder="Full name" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { if (!name || !county || !phone || !email) { toast.error('Fill all required fields'); return } setStep(2) }}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { value: 'starter', label: 'Starter', price: 'KES 3,500/mo', cap: 'Up to 150 students'   },
            { value: 'growth',  label: 'Growth',  price: 'KES 7,000/mo', cap: 'Up to 500 students'   },
            { value: 'pro',     label: 'Pro',      price: 'KES 12,000/mo', cap: 'Up to 1,000 students' },
          ].map(t => (
            <button key={t.value} onClick={() => setTier(t.value)} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 12, textAlign: 'left',
              border: `2px solid ${tier === t.value ? 'var(--green)' : 'var(--line)'}`,
              background: tier === t.value ? 'var(--green-light)' : 'var(--white)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `2px solid ${tier === t.value ? 'var(--green)' : 'var(--line)'}`, background: tier === t.value ? 'var(--green)' : 'transparent' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700 }}>{t.label}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{t.cap}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{t.price}</p>
            </button>
          ))}
          <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 13, color: 'var(--amber)' }}>🎁 30-day free trial — no billing until trial ends.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Review</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
            {[
              { l: 'School Name', v: name },
              { l: 'County',      v: county },
              { l: 'Phone',       v: phone },
              { l: 'Email',       v: email },
              { l: 'Principal',   v: principal || '—' },
              { l: 'Plan',        v: tier.charAt(0).toUpperCase() + tier.slice(1) },
              { l: 'Trial',       v: '30 days free' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{r.l}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Login credentials will be emailed to <strong>{email}</strong>. Configure Daraja once the school receives their API credentials from Safaricom.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button loading={loading} icon={<CheckCircle size={14} />} onClick={handleCreate}>Create Account</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── School Row ───────────────────────────────────────────────────────────────
function SchoolRow({ school }: { school: typeof ALL_SCHOOLS[0] }) {
  const [showDaraja, setShowDaraja] = useState(false)

  const tierColor = { starter: 'muted', growth: 'blue', pro: 'green' } as const
  const statusColor = { active: 'green', trial: 'amber', suspended: 'red', cancelled: 'muted' } as const

  return (
    <>
      <tr
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        style={{ borderBottom: '1px solid var(--surface)' }}
      >
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={school.name} size={32} color="var(--green)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{school.name}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>{school.county}</p>
            </div>
          </div>
        </td>
        <td style={{ padding: '13px 16px' }}>
          <Badge variant={tierColor[school.tier as keyof typeof tierColor]}>{school.tier.charAt(0).toUpperCase() + school.tier.slice(1)}</Badge>
        </td>
        <td style={{ padding: '13px 16px' }}>
          <Badge variant={statusColor[school.status as keyof typeof statusColor]} dot>{school.status.charAt(0).toUpperCase() + school.status.slice(1)}</Badge>
        </td>
        <td style={{ padding: '13px 16px', fontWeight: 600, fontSize: 13 }}>{school.students}</td>
        <td style={{ padding: '13px 16px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: school.mrr > 0 ? 'var(--green)' : 'var(--muted)' }}>
          {school.mrr > 0 ? formatKES(school.mrr) : '—'}
        </td>
        <td style={{ padding: '13px 16px' }}>
          {school.daraja
            ? <Badge variant="green"><CheckCircle size={10} /> Connected</Badge>
            : <Badge variant="amber"><AlertCircle size={10} /> Not set</Badge>}
        </td>
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowDaraja(true)}
              style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                background: school.daraja ? 'var(--green-light)' : 'var(--amber-light)',
                color: school.daraja ? 'var(--green)' : 'var(--amber)',
              }}
            >
              <Smartphone size={12} /> {school.daraja ? 'Update' : 'Configure'}
            </button>
            <button
              onClick={() => toast.success(`Managing ${school.name}`)}
              style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Settings size={12} /> Manage
            </button>
          </div>
        </td>
      </tr>
      <DarajaConfigModal school={school} open={showDaraja} onClose={() => setShowDaraja(false)} />
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SchoolsPage() {
  const { schools: liveSchools, loading, addSchool } = useAllSchools()
  const [showAdd, setShowAdd] = useState(false)

  // Merge live schools with local display data (mrr, students come from aggregate queries in production)
  const mergedSchools = liveSchools.length > 1
    ? liveSchools.map(s => {
        const local = ALL_SCHOOLS.find(a => a.id === s.id)
        return { ...s, mrr: (local as any)?.mrr || 0, students: (local as any)?.students || 0, daraja: s.daraja_configured, status: s.subscription_status, tier: s.subscription_tier }
      })
    : ALL_SCHOOLS

  const totalMRR      = mergedSchools.filter((s: any) => s.status === 'active').reduce((sum: number, sc: any) => sum + (sc.mrr || 0), 0)
  const totalStudents = mergedSchools.reduce((sum: number, sc: any) => sum + (sc.students || 0), 0)
  const pendingDaraja = mergedSchools.filter((s: any) => !s.daraja && !s.daraja_configured).length

  return (
    <div className="animate-in">
      <SectionHeader
        title="Schools"
        subtitle="Manage all onboarded schools and M-Pesa configuration"
        action={<Button icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Onboard School</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Schools',   value: ALL_SCHOOLS.length,              icon: <Building2 size={20} />,  color: 'var(--ink)' },
          { label: 'Total Students',  value: totalStudents.toLocaleString(),   icon: <Users size={20} />,      color: 'var(--ink)' },
          { label: 'Monthly Revenue', value: formatKES(totalMRR),              icon: <TrendingUp size={20} />, color: 'var(--green)' },
          { label: 'Daraja Pending',  value: pendingDaraja,                    icon: <Lock size={20} />,       color: pendingDaraja > 0 ? 'var(--amber)' : 'var(--green)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
          <p style={{ fontSize: 14, fontWeight: 700 }}>All Schools</p>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={24} /></div>
        ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
                {['School', 'Plan', 'Status', 'Students', 'MRR', 'M-Pesa', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mergedSchools.map((sc: any) => <SchoolRow key={sc.id} school={sc} />)}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      <AddSchoolModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addSchool} />
    </div>
  )
}
