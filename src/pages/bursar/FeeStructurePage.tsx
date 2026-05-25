import { useState } from 'react'
import { Plus, Edit2, Trash2, BookOpen, CheckCircle } from 'lucide-react'
import { SectionHeader, Card, Button, Modal, Input, Badge } from '../../components/ui'
import { DEMO_GRADES, DEMO_VOTEHEADS, DEMO_FEE_STRUCTURES, formatKES, CURRENT_TERM } from '../../lib/mockData'
import toast from 'react-hot-toast'

export default function FeeStructurePage() {
  const [selectedGrade, setSelectedGrade] = useState(DEMO_GRADES[5].id) // Grade 4
  const [showVoteheadModal, setShowVoteheadModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [newVotehead, setNewVotehead] = useState('')
  const [editingFee, setEditingFee] = useState<Record<string, string>>({})

  const gradeStructure = DEMO_FEE_STRUCTURES.filter(f => f.grade_id === selectedGrade && f.term_id === 'term-2')
  const gradeTotal = gradeStructure.reduce((s, f) => s + f.amount, 0)

  const handleSaveFees = () => {
    toast.success(`Fee structure for ${DEMO_GRADES.find(g => g.id === selectedGrade)?.name} saved`)
  }

  return (
    <div className="animate-in">
      <SectionHeader
        title="Fee Structure"
        subtitle={`${CURRENT_TERM.name} · Configure fees per grade`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<Plus size={14} />} onClick={() => setShowVoteheadModal(true)}>Add Votehead</Button>
            <Button icon={<CheckCircle size={14} />} onClick={() => toast.success('Invoices generated for all students!')}>Generate All Invoices</Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Grade selector */}
        <div>
          <Card style={{ padding: '12px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px', marginBottom: 8 }}>Select Grade</p>
            {DEMO_GRADES.map(g => {
              const items = DEMO_FEE_STRUCTURES.filter(f => f.grade_id === g.id && f.term_id === 'term-2')
              const total = items.reduce((s, f) => s + f.amount, 0)
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGrade(g.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: selectedGrade === g.id ? 'var(--ink)' : 'transparent',
                    color: selectedGrade === g.id ? 'white' : 'var(--ink-3)',
                    cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                  {total > 0 && (
                    <span style={{ fontSize: 11, opacity: 0.8, fontFamily: 'var(--mono)' }}>
                      {(total / 1000).toFixed(0)}K
                    </span>
                  )}
                </button>
              )
            })}
          </Card>
        </div>

        {/* Fee structure editor */}
        <div>
          {/* Header */}
          <Card style={{ marginBottom: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800 }}>{DEMO_GRADES.find(g => g.id === selectedGrade)?.name}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{CURRENT_TERM.name} · Fee due: {new Date(CURRENT_TERM.fee_due_date).toLocaleDateString('en-KE')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Term Total</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em' }}>{formatKES(gradeTotal)}</p>
            </div>
          </Card>

          {/* Voteheads */}
          <Card style={{ marginBottom: 16, padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>Voteheads & Amounts</p>
              <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={() => setShowFeeModal(true)}>Add Item</Button>
            </div>

            {DEMO_VOTEHEADS.map(vh => {
              const item = gradeStructure.find(f => f.votehead_id === vh.id)
              const key = `${selectedGrade}-${vh.id}`
              const val = editingFee[key] !== undefined ? editingFee[key] : String(item?.amount || '')

              return (
                <div key={vh.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--surface)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{vh.name}</p>
                      {vh.is_mandatory
                        ? <Badge variant="green">Mandatory</Badge>
                        : <Badge variant="muted">Optional</Badge>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>KES</span>
                    <input
                      type="number"
                      value={val}
                      onChange={e => setEditingFee(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="0"
                      style={{
                        width: 110, padding: '8px 12px', border: '1.5px solid var(--line)',
                        borderRadius: 8, fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 600,
                        textAlign: 'right', outline: 'none',
                        background: editingFee[key] !== undefined ? 'var(--amber-light)' : 'var(--white)',
                      }}
                    />
                  </div>
                  <button style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}

            {/* Total row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--ink)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Term Total</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'white', fontFamily: 'var(--mono)' }}>{formatKES(gradeTotal)}</p>
            </div>
          </Card>

          {Object.keys(editingFee).length > 0 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setEditingFee({})}>Discard Changes</Button>
              <Button icon={<CheckCircle size={14} />} onClick={handleSaveFees}>Save Fee Structure</Button>
            </div>
          )}

          {/* All grades overview */}
          <Card style={{ marginTop: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>All Grades — Term 2 2025 Summary</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {DEMO_GRADES.map(g => {
                const items = DEMO_FEE_STRUCTURES.filter(f => f.grade_id === g.id && f.term_id === 'term-2')
                const total = items.reduce((s, f) => s + f.amount, 0)
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGrade(g.id)}
                    style={{
                      padding: '12px 14px', borderRadius: 10,
                      border: `1.5px solid ${selectedGrade === g.id ? 'var(--green)' : 'var(--line)'}`,
                      background: selectedGrade === g.id ? 'var(--green-light)' : 'var(--white)',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: selectedGrade === g.id ? 'var(--green)' : 'var(--ink)', marginBottom: 4 }}>{g.name}</p>
                    <p style={{ fontSize: 12, fontFamily: 'var(--mono)', color: total > 0 ? 'var(--ink-2)' : 'var(--muted)', fontWeight: 600 }}>
                      {total > 0 ? formatKES(total) : '—'}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Votehead Modal */}
      <Modal open={showVoteheadModal} onClose={() => setShowVoteheadModal(false)} title="Add New Votehead" width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Votehead Name" value={newVotehead} onChange={setNewVotehead} placeholder="e.g. Library Fee" required />
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" name="mandatory" defaultChecked /> Mandatory
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" name="mandatory" /> Optional
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowVoteheadModal(false)}>Cancel</Button>
            <Button onClick={() => { toast.success('Votehead added'); setShowVoteheadModal(false) }}>Add Votehead</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
