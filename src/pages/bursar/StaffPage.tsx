import { useState } from 'react'
import { UserPlus, Shield, Mail, Phone, MoreVertical, KeyRound, UserX } from 'lucide-react'
import { SectionHeader, Card, Button, Modal, Input, Select, Avatar, Badge, EmptyState } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { can, roleLabel, roleDescription } from '../../lib/permissions'
import toast from 'react-hot-toast'

interface StaffMember {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'school_admin' | 'bursar' | 'receptionist'
  is_active: boolean
  joined: string
  last_login?: string
}

// Demo staff — in production loaded from users table filtered by school_id
const DEMO_STAFF: StaffMember[] = [
  { id: 'a-001', full_name: 'Jane Wanjiku',   email: 'admin@greenvalley.sc.ke',  phone: '0722 111 222', role: 'school_admin', is_active: true,  joined: '2025-01-01', last_login: '2025-05-19T08:00:00' },
  { id: 'b-001', full_name: 'Peter Mwangi',   email: 'bursar@greenvalley.sc.ke', phone: '0733 222 333', role: 'bursar',       is_active: true,  joined: '2025-01-01', last_login: '2025-05-19T09:14:00' },
  { id: 'r-001', full_name: 'Alice Omondi',   email: 'alice@greenvalley.sc.ke',  phone: '0744 333 444', role: 'receptionist', is_active: true,  joined: '2025-02-01', last_login: '2025-05-18T11:00:00' },
  { id: 'r-002', full_name: 'James Kariuki',  email: 'james@greenvalley.sc.ke',  phone: '0755 444 555', role: 'receptionist', is_active: false, joined: '2025-01-15', last_login: '2025-04-01T08:00:00' },
]

const roleVariant: Record<string, any> = {
  school_admin: 'blue',
  bursar:       'green',
  receptionist: 'muted',
}

// ─── Add Staff Modal ──────────────────────────────────────────────────────────
function AddStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [role, setRole]             = useState<string>('bursar')
  const [tempPass, setTempPass]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fullName.trim())             e.fullName = 'Required'
    if (!email.trim())                e.email    = 'Required'
    if (!/\S+@\S+\.\S+/.test(email)) e.email    = 'Invalid email'
    if (!tempPass || tempPass.length < 8) e.tempPass = 'Minimum 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success(`${fullName} added as ${roleLabel[role as keyof typeof roleLabel]}. Login details sent to ${email}.`)
      setFullName(''); setEmail(''); setPhone(''); setTempPass(''); setErrors({})
      onClose()
    }, 1200)
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Staff Member" width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Role selector first — determines what they can do */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>Role <span style={{ color: 'var(--red)' }}>*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['school_admin', 'bursar', 'receptionist'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                  borderRadius: 10, border: `1.5px solid ${role === r ? 'var(--green)' : 'var(--line)'}`,
                  background: role === r ? 'var(--green-light)' : 'var(--white)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  border: `2px solid ${role === r ? 'var(--green)' : 'var(--line)'}`,
                  background: role === r ? 'var(--green)' : 'transparent' }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>{roleLabel[r]}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{roleDescription[r]}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="e.g. Mary Njeri" required error={errors.fullName} />
            <Input label="Phone (optional)" value={phone} onChange={setPhone} placeholder="07XXXXXXXX" type="tel" />
          </div>
          <Input label="Email Address" value={email} onChange={setEmail} placeholder="staff@school.co.ke" type="email" required error={errors.email} />
          <div>
            <Input label="Temporary Password" value={tempPass} onChange={setTempPass} placeholder="Min. 8 characters" type="password" required error={errors.tempPass} />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Staff will be prompted to change this on first login.</p>
          </div>
        </div>

        <div style={{ background: 'var(--amber-light)', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.5 }}>
            A welcome email with login instructions will be sent to {email || 'their email'}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} icon={<UserPlus size={13} />} onClick={handleSave}>Add Staff Member</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({ member, canManage }: { member: StaffMember; canManage: boolean }) {
  const [showMenu, setShowMenu] = useState(false)

  const lastLogin = member.last_login
    ? new Date(member.last_login).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Never'

  return (
    <Card style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={member.full_name} size={44} color={member.is_active ? 'var(--green)' : 'var(--muted)'} />
          {!member.is_active && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--red)', border: '2px solid white' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: member.is_active ? 'var(--ink)' : 'var(--muted)' }}>{member.full_name}</p>
            <Badge variant={roleVariant[member.role]}>{roleLabel[member.role]}</Badge>
            {!member.is_active && <Badge variant="red">Inactive</Badge>}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a href={`mailto:${member.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
              <Mail size={12} /> {member.email}
            </a>
            {member.phone && (
              <a href={`tel:${member.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
                <Phone size={12} /> {member.phone}
              </a>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            Joined {new Date(member.joined).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })} · Last login: {lastLogin}
          </p>
        </div>

        {/* Actions */}
        {canManage && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
            >
              <MoreVertical size={15} />
            </button>
            {showMenu && (
              <div
                style={{ position: 'absolute', right: 0, top: 36, background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: 'var(--shadow)', zIndex: 10, minWidth: 180, overflow: 'hidden' }}
                onMouseLeave={() => setShowMenu(false)}
              >
                {[
                  { label: 'Reset Password',     icon: <KeyRound size={13} />, action: () => { toast.success(`Password reset link sent to ${member.email}`); setShowMenu(false) }, color: 'var(--ink)' },
                  { label: member.is_active ? 'Deactivate Account' : 'Reactivate Account', icon: <UserX size={13} />, action: () => { toast.success(`${member.full_name} ${member.is_active ? 'deactivated' : 'reactivated'}`); setShowMenu(false) }, color: member.is_active ? 'var(--red)' : 'var(--green)' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: item.color, textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { user } = useAuth()
  const perms    = can(user?.role as any)
  const [showAdd, setShowAdd]   = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>('')

  if (!perms.addStaff) {
    return (
      <div className="animate-in">
        <SectionHeader title="Staff Management" subtitle="Manage school staff accounts" />
        <Card>
          <EmptyState
            icon={<Shield size={36} />}
            title="Access Restricted"
            description="Only School Admins and Principals can manage staff accounts. Contact your school admin if you need changes made."
          />
        </Card>
      </div>
    )
  }

  const filtered = roleFilter
    ? DEMO_STAFF.filter(s => s.role === roleFilter)
    : DEMO_STAFF

  const activeCount   = DEMO_STAFF.filter(s => s.is_active).length
  const inactiveCount = DEMO_STAFF.filter(s => !s.is_active).length

  return (
    <div className="animate-in">
      <SectionHeader
        title="Staff Management"
        subtitle={`${activeCount} active staff · ${inactiveCount} inactive`}
        action={<Button icon={<UserPlus size={14} />} onClick={() => setShowAdd(true)}>Add Staff</Button>}
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'School Admin / Principal', count: DEMO_STAFF.filter(s => s.role === 'school_admin').length, variant: 'blue'  },
          { label: 'Bursars',                  count: DEMO_STAFF.filter(s => s.role === 'bursar').length,       variant: 'green' },
          { label: 'Receptionists',            count: DEMO_STAFF.filter(s => s.role === 'receptionist').length, variant: 'muted' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 18px', cursor: 'pointer' }}
            onClick={() => setRoleFilter(roleFilter === s.label.toLowerCase() ? '' : (s.label === 'Bursars' ? 'bursar' : s.label === 'Receptionists' ? 'receptionist' : 'school_admin'))}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800 }}>{s.count}</p>
          </Card>
        ))}
      </div>

      {/* Role filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'All', value: '' },
          { label: 'Admin',        value: 'school_admin' },
          { label: 'Bursar',       value: 'bursar'       },
          { label: 'Receptionist', value: 'receptionist' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setRoleFilter(f.value)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${roleFilter === f.value ? 'var(--ink)' : 'var(--line)'}`,
              background: roleFilter === f.value ? 'var(--ink)' : 'var(--white)',
              color: roleFilter === f.value ? 'white' : 'var(--ink-3)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Role permission summary */}
      <Card style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--surface)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Role Permissions Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {(['school_admin', 'bursar', 'receptionist'] as const).map(r => (
            <div key={r} style={{ background: 'var(--white)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--line)' }}>
              <div style={{ marginBottom: 8 }}>
                <Badge variant={roleVariant[r]}>{roleLabel[r]}</Badge>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{roleDescription[r]}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Staff list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <Card>
            <EmptyState icon={null} title="No staff in this category" description="Add staff members using the button above" />
          </Card>
        ) : (
          filtered.map(m => <StaffCard key={m.id} member={m} canManage={perms.addStaff} />)
        )}
      </div>

      <AddStaffModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
