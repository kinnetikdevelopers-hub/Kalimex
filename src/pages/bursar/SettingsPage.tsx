import { useState } from 'react'
import { Settings, MessageSquare, Building2, CheckCircle, Smartphone, Bell, Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
import { SectionHeader, Card, Button, Input, Badge } from '../../components/ui'
import { useSchool } from '../../lib/useSchoolData'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

type Tab = 'profile' | 'sms' | 'terms' | 'notifications' | 'password'

export default function SettingsPage() {
  const { user, changePassword, isRole } = useAuth()
  const schoolId = user?.school_id || 'sch-001'
  const { school, updateSchool } = useSchool(schoolId)

  const [tab, setTab] = useState<Tab>('profile')

  // Profile state
  const [schoolName, setSchoolName] = useState(school.name)
  const [phone, setPhone]           = useState(school.phone)
  const [email, setEmail]           = useState(school.email)
  const [address, setAddress]       = useState(school.address)
  const [principal, setPrincipal]   = useState(school.principal_name)
  const [savingProfile, setSavingProfile] = useState(false)

  // SMS state
  const [smsSender, setSmsSender]   = useState(school.sms_sender_id || '')
  const [savingSms, setSavingSms]   = useState(false)

  // Password state
  const [currentPass, setCurrentPass]   = useState('')
  const [newPass, setNewPass]           = useState('')
  const [confirmPass, setConfirmPass]   = useState('')
  const [showCurrent, setShowCurrent]   = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [savingPass, setSavingPass]     = useState(false)
  const [passErrors, setPassErrors]     = useState<Record<string,string>>({})

  const canEditSchool = isRole('school_admin', 'super_admin')

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const { error } = await updateSchool({ name: schoolName, phone, email, address, principal_name: principal })
    setSavingProfile(false)
    if (error) toast.error(error)
    else toast.success('School profile saved')
  }

  const handleSaveSms = async () => {
    setSavingSms(true)
    const { error } = await updateSchool({ sms_sender_id: smsSender })
    setSavingSms(false)
    if (error) toast.error(error)
    else toast.success('SMS settings saved')
  }

  const handleChangePassword = async () => {
    const e: Record<string,string> = {}
    if (!currentPass)          e.current  = 'Enter your current password'
    if (newPass.length < 8)    e.new      = 'Must be at least 8 characters'
    if (newPass !== confirmPass) e.confirm = 'Passwords do not match'
    setPassErrors(e)
    if (Object.keys(e).length > 0) return

    setSavingPass(true)
    const { error } = await changePassword(currentPass, newPass)
    setSavingPass(false)
    if (error) { setPassErrors({ current: error }); return }
    toast.success('Password changed successfully')
    setCurrentPass(''); setNewPass(''); setConfirmPass('')
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: 'profile',       label: 'School Profile',   icon: <Building2 size={15} />,     adminOnly: true  },
    { key: 'sms',           label: 'SMS Settings',     icon: <MessageSquare size={15} />, adminOnly: true  },
    { key: 'terms',         label: 'Terms & Calendar', icon: <Settings size={15} />,      adminOnly: true  },
    { key: 'notifications', label: 'Notifications',    icon: <Bell size={15} />,          adminOnly: false },
    { key: 'password',      label: 'Change Password',  icon: <Lock size={15} />,          adminOnly: false },
  ]

  const visibleTabs = tabs.filter(t => !t.adminOnly || canEditSchool)

  return (
    <div className="animate-in">
      <SectionHeader title="Settings" subtitle={`Account settings · ${user?.full_name}`} />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ padding: 10 }}>
            {visibleTabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                padding: '9px 11px', borderRadius: 8, border: 'none', marginBottom: 2,
                background: tab === t.key ? 'var(--ink)' : 'transparent',
                color: tab === t.key ? 'white' : 'var(--ink-3)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left', transition: 'all 0.12s',
              }}>{t.icon}{t.label}</button>
            ))}
          </Card>

          {/* M-Pesa status — always read-only for school staff */}
          <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Smartphone size={13} style={{ color: 'var(--green)' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>M-Pesa</p>
              <Badge variant="green" dot>Active</Badge>
            </div>
            <p style={{ fontSize: 12, color: 'var(--green)', lineHeight: 1.5 }}>Paybill <strong>{school.daraja_paybill || '400200'}</strong><br />Production mode</p>
            <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 6, opacity: 0.7 }}>Managed by Kalimex. Contact support for any changes.</p>
          </div>

          {/* Role badge */}
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Logged in as</p>
            <p style={{ fontSize: 13, fontWeight: 700 }}>{user?.full_name}</p>
            <Badge variant={user?.role === "school_admin" ? "blue" : "green"}>
              {user?.role?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div>

          {/* ── PROFILE (admin only) ── */}
          {tab === 'profile' && canEditSchool && (
            <Card>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>School Profile</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="School Name" value={schoolName} onChange={setSchoolName} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Phone" value={phone} onChange={setPhone} type="tel" />
                  <Input label="Email" value={email} onChange={setEmail} type="email" />
                </div>
                <Input label="Physical Address" value={address} onChange={setAddress} />
                <Input label="Principal / Head Teacher" value={principal} onChange={setPrincipal} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Subscription Plan</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1.5px solid var(--line)', borderRadius: 9, background: 'var(--surface)' }}>
                      <Badge variant="blue">Growth</Badge>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>KES 7,000 / month</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Account Status</label>
                    <div style={{ padding: '9px 12px', border: '1.5px solid var(--line)', borderRadius: 9, background: 'var(--surface)' }}>
                      <Badge variant="green" dot>Active · Renews 31 Dec 2025</Badge>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid var(--line)' }}>
                  <Button loading={savingProfile} icon={<CheckCircle size={13}/>} onClick={handleSaveProfile}>Save Profile</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── SMS (admin only) ── */}
          {tab === 'sms' && canEditSchool && (
            <Card>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>SMS Configuration</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.6 }}>
                Customise how SMS messages appear to parents. The underlying Africa's Talking account is managed by Kalimex.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Input label="Sender ID" value={smsSender} onChange={setSmsSender} placeholder="e.g. GVALLEY (max 11 chars)" />
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5 }}>What parents see as the SMS sender. Max 11 characters, no spaces. Contact Kalimex support to register a new Sender ID with Safaricom.</p>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Message Previews</p>
                  {[
                    { name: 'Payment Receipt', text: `Dear Parent, KES 27,750 received for Amara Kamau. Receipt: GVA/RCP/2025/0234. M-Pesa: QGH2KL9X0A. — ${smsSender || 'GVALLEY'}` },
                    { name: 'Fee Reminder',    text: `Dear Parent, Amara Kamau's Term 2 balance is KES 15,000. Paybill ${school.daraja_paybill || '400200'}, A/C: GVA/2023/001 — ${smsSender || 'GVALLEY'}` },
                    { name: 'Instalment Due',  text: `Dear Parent, Instalment 2 of KES 10,000 for Amara is due 15 Jun 2025. — ${smsSender || 'GVALLEY'}` },
                  ].map(t => (
                    <div key={t.name} style={{ marginBottom: 8, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', lineHeight: 1.5 }}>{t.text}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={() => toast.success('Test SMS sent to your phone')}>Send Test SMS</Button>
                  <Button loading={savingSms} icon={<CheckCircle size={13}/>} onClick={handleSaveSms}>Save SMS Settings</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── TERMS (admin only) ── */}
          {tab === 'terms' && canEditSchool && (
            <Card>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Academic Year 2025</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { term: 'Term 1', start: '2025-01-06', end: '2025-04-04', due: '2025-01-10', status: 'Ended'    },
                  { term: 'Term 2', start: '2025-05-05', end: '2025-08-01', due: '2025-05-09', status: 'Active'   },
                  { term: 'Term 3', start: '2025-09-01', end: '2025-11-28', due: '2025-09-05', status: 'Upcoming' },
                ].map(t => (
                  <div key={t.term} style={{ padding: 14, border: `1.5px solid ${t.status === 'Active' ? 'var(--green)' : 'var(--line)'}`, borderRadius: 12, background: t.status === 'Active' ? 'var(--green-light)' : 'var(--white)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>{t.term}</p>
                      <Badge variant={t.status === 'Active' ? 'green' : t.status === 'Ended' ? 'muted' : 'amber'} dot>{t.status}</Badge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {[{ l: 'Start Date', v: t.start }, { l: 'End Date', v: t.end }, { l: 'Fee Due', v: t.due }].map(f => (
                        <div key={f.l}>
                          <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 3 }}>{f.l}</label>
                          <input type="date" defaultValue={f.v}
                            style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--line)', borderRadius: 7, fontSize: 13, outline: 'none', background: 'var(--white)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button icon={<CheckCircle size={13}/>} onClick={() => toast.success('Academic calendar saved')}>Save Calendar</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── NOTIFICATIONS (all roles) ── */}
          {tab === 'notifications' && (
            <Card>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Notification Preferences</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { label: 'SMS receipt to parent after every M-Pesa payment',      default: true },
                  { label: 'SMS receipt to parent after manually recorded payment',  default: false },
                  { label: 'SMS alert to my phone when a payment is received',        default: true },
                  { label: 'SMS reminder 2 days before each instalment is due',       default: true },
                  { label: 'SMS reminder 3 days before term fee due date (bulk)',     default: true },
                  { label: 'Weekly collection summary every Friday',                 default: false },
                  { label: 'SMS alert when an expense is submitted for approval',    default: false },
                ].map((item, i, arr) => (
                  <label key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--surface)' : 'none', cursor: 'pointer', gap: 16 }}>
                    <span style={{ fontSize: 14, color: 'var(--ink)', flex: 1 }}>{item.label}</span>
                    <input type="checkbox" defaultChecked={item.default} style={{ width: 17, height: 17, accentColor: 'var(--green)', cursor: 'pointer', flexShrink: 0 }} />
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <Button icon={<CheckCircle size={13}/>} onClick={() => toast.success('Notification preferences saved')}>Save Preferences</Button>
              </div>
            </Card>
          )}

          {/* ── CHANGE PASSWORD (all roles) ── */}
          {tab === 'password' && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={18} style={{ color: 'var(--ink)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>Change Password</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Update the password for {user?.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                {/* Current password */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>Current Password <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCurrent ? 'text' : 'password'} value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="Enter current password"
                      style={{ width: '100%', padding: '10px 40px 10px 13px', border: `1.5px solid ${passErrors.current ? 'var(--red)' : 'var(--line)'}`, borderRadius: 9, fontSize: 13, outline: 'none' }} />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                      {showCurrent ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {passErrors.current && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{passErrors.current}</p>}
                </div>

                {/* New password */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>New Password <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 8 characters"
                      style={{ width: '100%', padding: '10px 40px 10px 13px', border: `1.5px solid ${passErrors.new ? 'var(--red)' : 'var(--line)'}`, borderRadius: 9, fontSize: 13, outline: 'none' }} />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                      {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {passErrors.new && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{passErrors.new}</p>}
                  {/* Strength indicator */}
                  {newPass && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {[1,2,3,4].map(n => (
                        <div key={n} style={{ flex: 1, height: 3, borderRadius: 99, background: newPass.length >= n * 2 ? (newPass.length >= 8 ? 'var(--green)' : 'var(--amber)') : 'var(--line)' }} />
                      ))}
                      <p style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: 6 }}>
                        {newPass.length < 4 ? 'Weak' : newPass.length < 8 ? 'Fair' : newPass.length < 12 ? 'Good' : 'Strong'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>Confirm New Password <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Re-enter new password"
                      style={{ width: '100%', padding: '10px 40px 10px 13px', border: `1.5px solid ${passErrors.confirm ? 'var(--red)' : confirmPass && confirmPass === newPass ? 'var(--green)' : 'var(--line)'}`, borderRadius: 9, fontSize: 13, outline: 'none' }} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                      {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {passErrors.confirm && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{passErrors.confirm}</p>}
                  {confirmPass && confirmPass === newPass && <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 3 }}>✓ Passwords match</p>}
                </div>

                <div style={{ paddingTop: 6 }}>
                  <Button loading={savingPass} icon={<Lock size={13}/>} onClick={handleChangePassword}>Update Password</Button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
