import { useState, useMemo } from 'react'
import { Search, FileText, Download, Send, Eye } from 'lucide-react'
import { SectionHeader, Badge, Card, Button, Modal, Avatar, EmptyState, ProgressBar } from '../../components/ui'
import { DEMO_INVOICES, DEMO_STUDENTS, DEMO_GRADES, formatKES, CURRENT_TERM } from '../../lib/mockData'
import type { Invoice } from '../../types'
import toast from 'react-hot-toast'

const statusBadge = (s: Invoice['status']) => {
  const m = { paid: 'green', partial: 'amber', unpaid: 'red', overpaid: 'blue', waived: 'muted' } as const
  return <Badge variant={m[s]} dot>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>
}

function InvoiceDetailModal({ invoice, open, onClose }: { invoice: Invoice | null; open: boolean; onClose: () => void }) {
  if (!invoice) return null
  const student = DEMO_STUDENTS.find(s => s.id === invoice.student_id)

  return (
    <Modal open={open} onClose={onClose} title={`Invoice ${invoice.invoice_number}`} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 0 16px', borderBottom: '1px solid var(--line)' }}>
          <Avatar name={student?.full_name || '?'} size={48} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{student?.full_name}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{student?.admission_number} · {student?.grade?.name} {student?.stream?.name}</p>
          </div>
          {statusBadge(invoice.status)}
        </div>

        {/* Invoice meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Invoice No.', value: invoice.invoice_number, mono: true },
            { label: 'Term', value: invoice.term?.name || CURRENT_TERM.name },
            { label: 'Issue Date', value: new Date(invoice.issued_date).toLocaleDateString('en-KE') },
            { label: 'Due Date', value: new Date(invoice.due_date).toLocaleDateString('en-KE') },
          ].map(row => (
            <div key={row.label} style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{row.label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, fontFamily: row.mono ? 'var(--mono)' : 'var(--font)' }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Line items */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Fee Breakdown</p>
          <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Votehead</th>
                  <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < (invoice.items?.length || 0) - 1 ? '1px solid var(--surface)' : 'none' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--ink-2)' }}>{item.description}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{formatKES(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Subtotal</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{formatKES(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--green)' }}>Discount (sibling)</span>
                <span style={{ fontSize: 13, color: 'var(--green)', fontFamily: 'var(--mono)' }}>− {formatKES(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.bursary_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--blue)' }}>Bursary</span>
                <span style={{ fontSize: 13, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>− {formatKES(invoice.bursary_amount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Net Payable</span>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--mono)' }}>{formatKES(invoice.net_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--green)' }}>Amount Paid</span>
              <span style={{ fontSize: 13, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{formatKES(invoice.paid_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: invoice.balance > 0 ? 'var(--red)' : 'var(--green)' }}>Balance</span>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: invoice.balance > 0 ? 'var(--red)' : 'var(--green)' }}>{formatKES(invoice.balance)}</span>
            </div>
          </div>

          {invoice.net_amount > 0 && (
            <div style={{ marginTop: 12 }}>
              <ProgressBar value={invoice.paid_amount} max={invoice.net_amount} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                {Math.round((invoice.paid_amount / invoice.net_amount) * 100)}% paid
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={<Download size={14} />} onClick={() => toast.success('Invoice PDF downloaded')}>Download PDF</Button>
          <Button variant="secondary" icon={<Send size={14} />} onClick={() => toast.success('Invoice sent via SMS')}>Send to Parent</Button>
          {invoice.balance > 0 && (
            <Button icon={<Send size={14} />} onClick={() => toast.success('STK push sent to parent')}>Send Payment Link</Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function FeesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [selected, setSelected] = useState<Invoice | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return DEMO_INVOICES.filter(inv => {
      const s = DEMO_STUDENTS.find(st => st.id === inv.student_id)
      const name = s?.full_name.toLowerCase() || ''
      const adm = s?.admission_number.toLowerCase() || ''
      const invNo = inv.invoice_number.toLowerCase()
      return (!q || name.includes(q) || adm.includes(q) || invNo.includes(q))
        && (!statusFilter || inv.status === statusFilter)
        && (!gradeFilter || s?.grade_id === gradeFilter)
    })
  }, [search, statusFilter, gradeFilter])

  const totals = {
    expected: DEMO_INVOICES.reduce((s, i) => s + i.net_amount, 0),
    paid: DEMO_INVOICES.reduce((s, i) => s + i.paid_amount, 0),
    outstanding: DEMO_INVOICES.reduce((s, i) => s + i.balance, 0),
  }

  return (
    <div className="animate-in">
      <SectionHeader
        title="Fees & Invoices"
        subtitle={`${CURRENT_TERM.name} · ${DEMO_INVOICES.length} invoices`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<Download size={14} />} onClick={() => toast.success('Exporting all invoices…')}>Export</Button>
            <Button icon={<FileText size={14} />} onClick={() => toast.success('Invoices generated for all students')}>Generate Invoices</Button>
          </div>
        }
      />

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        <Card style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Invoiced</p>
          <p style={{ fontSize: 22, fontWeight: 800 }}>{formatKES(totals.expected)}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{DEMO_INVOICES.length} invoices</p>
        </Card>
        <Card style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Collected</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{formatKES(totals.paid)}</p>
          <p style={{ fontSize: 12, color: 'var(--green)' }}>{DEMO_INVOICES.filter(i => i.status === 'paid').length} fully paid</p>
        </Card>
        <Card style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Outstanding</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>{formatKES(totals.outstanding)}</p>
          <p style={{ fontSize: 12, color: 'var(--red)' }}>{DEMO_INVOICES.filter(i => i.status !== 'paid').length} unpaid/partial</p>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or invoice…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', outline: 'none' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}>
          <option value="">All Grades</option>
          {DEMO_GRADES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Invoice table */}
      <Card style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <EmptyState icon={<FileText size={36} />} title="No invoices found" description="Adjust your filters or generate new invoices" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)' }}>
                  {['Student', 'Invoice No.', 'Grade', 'Invoice', 'Paid', 'Balance', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const student = DEMO_STUDENTS.find(s => s.id === inv.student_id)
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--surface)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={student?.full_name || '?'} size={30} />
                          <div>
                            <p style={{ fontWeight: 600 }}>{student?.full_name}</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{student?.admission_number}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)' }}>{inv.invoice_number}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-3)' }}>{student?.grade?.name}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontWeight: 600 }}>{formatKES(inv.net_amount)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', color: 'var(--green)', fontWeight: 600 }}>{formatKES(inv.paid_amount)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontWeight: 700, color: inv.balance > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {formatKES(inv.balance)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{statusBadge(inv.status)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setSelected(inv)} style={{ color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }} title="View invoice">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => toast.success('Invoice PDF downloaded')} style={{ color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }} title="Download PDF">
                            <Download size={14} />
                          </button>
                          {inv.balance > 0 && (
                            <button onClick={() => toast.success('STK push sent to parent')} style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }} title="Send payment link">
                              <Send size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <InvoiceDetailModal invoice={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
