import { useState, useMemo } from 'react'
import { Search, UserPlus, Filter, Phone, Mail, Download, Send, X } from 'lucide-react'
import { SectionHeader, Badge, Card, Button, Avatar, Modal, Input, Select, EmptyState, Spinner } from '../../components/ui'
import { useStudents, useGrades } from '../../lib/useSchoolData'
import { DEMO_INVOICES, DEMO_PAYMENTS, formatKES, getStudentGuardians } from '../../lib/mockData'
import { generateReceiptPDF, downloadPDF } from '../../lib/pdfReceipt'
import { DEMO_SCHOOL } from '../../lib/mockData'
import { useAuth } from '../../context/AuthContext'
import type { Student } from '../../types'
import toast from 'react-hot-toast'

const statusBadge = (s: Student['status']) => {
  const m = { active: 'green', graduated: 'blue', transferred: 'amber', suspended: 'red', withdrawn: 'muted' } as const
  return <Badge variant={m[s]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>
}

// ─── Add Student Modal ────────────────────────────────────────────────────────
function AddStudentModal({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (data: any) => Promise<{ data: any; error: string | null }>
}) {
  const { grades } = useGrades('sch-001')
  const [fullName, setFullName]       = useState('')
  const [admissionNo, setAdmissionNo] = useState('')
  const [gradeId, setGradeId]         = useState('')
  const [gender, setGender]           = useState('')
  const [dob, setDob]                 = useState('')
  const [guardianName, setGuardianName]   = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [relationship, setRelationship]   = useState('Mother')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fullName.trim())   e.fullName    = 'Required'
    if (!admissionNo.trim()) e.admissionNo = 'Required'
    if (!gradeId)           e.gradeId     = 'Required'
    if (!guardianPhone.trim()) e.guardianPhone = 'Required'
    if (guardianPhone && !/^(07|01|\+2547|\+2541|2547|2541)/.test(guardianPhone))
      e.guardianPhone = 'Invalid Kenyan phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const { data, error } = await onSave({
      full_name: fullName.trim(),
      admission_number: admissionNo.trim(),
      grade_id: gradeId,
      gender: gender || undefined,
      date_of_birth: dob || undefined,
      guardian_name: guardianName.trim() || undefined,
      guardian_phone: guardianPhone.trim(),
      guardian_email: guardianEmail.trim() || undefined,
      guardian_relationship: relationship,
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success(`${fullName} added successfully`)
    // Reset
    setFullName(''); setAdmissionNo(''); setGradeId(''); setGender('')
    setDob(''); setGuardianName(''); setGuardianPhone(''); setGuardianEmail('')
    setRelationship('Mother'); setErrors({})
    onClose()
  }

  const field = (label: string, value: string, set: (v: string) => void, opts?: { type?: string; placeholder?: string; required?: boolean; error?: string }) => (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>
        {label}{opts?.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={opts?.type || 'text'} value={value} onChange={e => set(e.target.value)}
        placeholder={opts?.placeholder}
        style={{
          width: '100%', padding: '9px 13px',
          border: `1.5px solid ${opts?.error ? 'var(--red)' : 'var(--line)'}`,
          borderRadius: 9, fontSize: 13, outline: 'none',
        }}
      />
      {opts?.error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{opts.error}</p>}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Add New Student" width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Full Name', fullName, setFullName, { placeholder: 'e.g. Amara Wanjiku', required: true, error: errors.fullName })}
          {field('Admission Number', admissionNo, setAdmissionNo, { placeholder: 'e.g. GVA/2025/045', required: true, error: errors.admissionNo })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>Grade <span style={{ color: 'var(--red)' }}>*</span></label>
            <select value={gradeId} onChange={e => setGradeId(e.target.value)}
              style={{ width: '100%', padding: '9px 13px', border: `1.5px solid ${errors.gradeId ? 'var(--red)' : 'var(--line)'}`, borderRadius: 9, fontSize: 13, outline: 'none', background: 'white' }}>
              <option value="">Select grade…</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {errors.gradeId && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.gradeId}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)}
              style={{ width: '100%', padding: '9px 13px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 13, outline: 'none', background: 'white' }}>
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        {field('Date of Birth', dob, setDob, { type: 'date' })}

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--ink)' }}>Guardian / Parent</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {field('Full Name', guardianName, setGuardianName, { placeholder: 'e.g. Grace Wanjiku' })}
              {field('M-Pesa Phone', guardianPhone, setGuardianPhone, { placeholder: '07XXXXXXXX', required: true, error: errors.guardianPhone })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {field('Email (optional)', guardianEmail, setGuardianEmail, { type: 'email', placeholder: 'parent@email.com' })}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>Relationship</label>
                <select value={relationship} onChange={e => setRelationship(e.target.value)}
                  style={{ width: '100%', padding: '9px 13px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 13, outline: 'none', background: 'white' }}>
                  {['Mother','Father','Guardian','Aunt','Uncle','Grandparent','Sibling'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSave} icon={<UserPlus size={14} />}>Add Student</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Student Detail Modal ─────────────────────────────────────────────────────
function StudentDetailModal({ student, open, onClose }: { student: Student | null; open: boolean; onClose: () => void }) {
  if (!student) return null

  const invoice  = DEMO_INVOICES.find(i => i.student_id === student.id && i.term_id === 'term-2')
  const payments = DEMO_PAYMENTS.filter(p => p.student_id === student.id)
  const guardians = getStudentGuardians(student.id)

  const handleDownloadStatement = async () => {
    if (!invoice) { toast.error('No invoice found for this term'); return }
    const paymentToUse = payments[0]
    if (!paymentToUse) { toast.error('No payments to generate receipt for'); return }
    toast.loading('Generating PDF…', { id: 'pdf' })
    try {
      const bytes = await generateReceiptPDF({ payment: paymentToUse, invoice, student, school: DEMO_SCHOOL })
      downloadPDF(bytes, `${student.admission_number.replace(/\//g, '-')}-statement.pdf`)
      toast.success('Statement downloaded', { id: 'pdf' })
    } catch { toast.error('Failed to generate PDF', { id: 'pdf' }) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Student Profile" width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
          <Avatar name={student.full_name} size={52} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>{student.full_name}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
              {student.admission_number} · {student.grade?.name} {student.stream?.name}
            </p>
            {statusBadge(student.status)}
          </div>
        </div>

        {/* Fee summary */}
        {invoice && (
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Term 2 2025 — Fees</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { l: 'Invoice', v: formatKES(invoice.net_amount), c: 'var(--ink)' },
                { l: 'Paid',    v: formatKES(invoice.paid_amount), c: 'var(--green)' },
                { l: 'Balance', v: formatKES(invoice.balance),    c: invoice.balance > 0 ? 'var(--red)' : 'var(--green)' },
              ].map(s => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{s.l}</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</p>
                </div>
              ))}
            </div>
            {invoice.discount_amount > 0 && (
              <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 8, textAlign: 'center' }}>
                ✓ Discount applied: {formatKES(invoice.discount_amount)}
              </p>
            )}
          </div>
        )}

        {/* Invoice breakdown */}
        {invoice?.items && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Invoice Breakdown</p>
            {invoice.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--surface)', borderRadius: 7, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{item.description}</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>{formatKES(item.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Payment History</p>
            {payments.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 6 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>{p.receipt_number}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {p.mpesa_code ? `M-Pesa · ${p.mpesa_code}` : p.payment_method.replace('_', ' ')} · {new Date(p.payment_date).toLocaleDateString('en-KE')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatKES(p.amount)}</span>
                  <button
                    onClick={async () => {
                      if (!invoice) return
                      toast.loading('Generating…', { id: 'pdf' })
                      try {
                        const bytes = await generateReceiptPDF({ payment: p, invoice, student, school: DEMO_SCHOOL })
                        downloadPDF(bytes, `${p.receipt_number.replace(/\//g, '-')}.pdf`)
                        toast.success('Receipt downloaded', { id: 'pdf' })
                      } catch { toast.error('Failed', { id: 'pdf' }) }
                    }}
                    style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <Download size={12} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guardians */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Guardians</p>
          {guardians.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 6 }}>
              <Avatar name={g.full_name} size={34} color="var(--blue)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{g.full_name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{g.relationship}{g.is_primary ? ' · Primary' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href={`tel:${g.phone}`} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={13} />
                </a>
                {g.email && (
                  <a href={`mailto:${g.email}`} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--blue-light)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={13} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--line)' }}>
          <Button variant="secondary" icon={<Download size={13} />} style={{ flex: 1 }} onClick={handleDownloadStatement}>
            Statement PDF
          </Button>
          {invoice && invoice.balance > 0 && (
            <Button icon={<Send size={13} />} style={{ flex: 1 }} onClick={() => { toast.success('STK push sent to guardian'); onClose() }}>
              Send Payment Link
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { user }   = useAuth()
  const schoolId   = user?.school_id || 'sch-001'
  const { students, loading, addStudent } = useStudents(schoolId)
  const { grades } = useGrades(schoolId)

  const [search, setSearch]         = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected]     = useState<Student | null>(null)
  const [showAdd, setShowAdd]       = useState(false)

  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = search.toLowerCase()
      const matchQ = !q || s.full_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q)
      const matchG = !gradeFilter || s.grade_id === gradeFilter
      const matchS = !statusFilter || s.status === statusFilter
      return matchQ && matchG && matchS
    })
  }, [students, search, gradeFilter, statusFilter])

  return (
    <div className="animate-in">
      <SectionHeader
        title="Students"
        subtitle={`${students.length} students enrolled`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => window.location.href = '/students/import'} icon={<Download size={14} />}>Import CSV</Button>
            <Button icon={<UserPlus size={14} />} onClick={() => setShowAdd(true)}>Add Student</Button>
          </div>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or admission number…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--muted)' }} />
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
            style={{ padding: '9px 13px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
            <option value="">All Grades</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 13px', border: '1.5px solid var(--line)', borderRadius: 9, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={null} title="No students found" description="Try adjusting your search or add a new student" action={<Button onClick={() => setShowAdd(true)} icon={<UserPlus size={14} />}>Add First Student</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
          {filtered.map(s => {
            const invoice = DEMO_INVOICES.find(i => i.student_id === s.id && i.term_id === 'term-2')
            const balColor = !invoice ? 'var(--muted)' : invoice.balance === 0 ? 'var(--green)' : invoice.balance < invoice.net_amount ? 'var(--amber)' : 'var(--red)'
            return (
              <Card key={s.id} onClick={() => setSelected(s)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Avatar name={s.full_name} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{s.admission_number}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Badge variant="muted">{s.grade?.name}{s.stream?.name ? ` · ${s.stream.name}` : ''}</Badge>
                      {invoice && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: balColor }}>
                          {invoice.balance === 0 ? '✓ Paid' : `Bal: ${formatKES(invoice.balance)}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AddStudentModal open={showAdd} onClose={() => setShowAdd(false)} onSave={addStudent} />
      <StudentDetailModal student={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
