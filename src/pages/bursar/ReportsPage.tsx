import { FileText, Download, TrendingUp, TrendingDown, BarChart2, Users, CheckCircle } from 'lucide-react'
import { SectionHeader, Card, Button, Badge, ProgressBar } from '../../components/ui'
import { DEMO_TERM_SUMMARY, DEMO_INVOICES, DEMO_EXPENSES, DEMO_PAYMENTS, formatKES, DEMO_GRADES, DEMO_STUDENTS } from '../../lib/mockData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#1A7A4A', '#2EAD6A', '#D97706', '#DC2626', '#2563EB']

export default function ReportsPage() {
  const summary = DEMO_TERM_SUMMARY
  const totalExpenses = DEMO_EXPENSES.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)
  const netSurplus = summary.total_collected - totalExpenses

  // Collection by grade
  const gradeData = DEMO_GRADES.slice(0, 6).map(g => {
    const students = DEMO_STUDENTS.filter(s => s.grade_id === g.id)
    const invoices = DEMO_INVOICES.filter(i => students.some(s => s.id === i.student_id))
    const collected = invoices.reduce((s, i) => s + i.paid_amount, 0)
    const expected = invoices.reduce((s, i) => s + i.net_amount, 0)
    return { grade: g.name, collected: collected / 1000, expected: expected / 1000 }
  }).filter(g => g.expected > 0)

  // Payment method breakdown
  const methodData = [
    { name: 'M-Pesa STK', value: DEMO_PAYMENTS.filter(p => p.payment_method === 'mpesa_stk').reduce((s, p) => s + p.amount, 0) },
    { name: 'M-Pesa Paybill', value: DEMO_PAYMENTS.filter(p => p.payment_method === 'mpesa_paybill').reduce((s, p) => s + p.amount, 0) },
    { name: 'Cash', value: DEMO_PAYMENTS.filter(p => p.payment_method === 'cash').reduce((s, p) => s + p.amount, 0) },
    { name: 'Bank Transfer', value: DEMO_PAYMENTS.filter(p => p.payment_method === 'bank_transfer').reduce((s, p) => s + p.amount, 0) },
  ].filter(m => m.value > 0)

  const reportCards = [
    {
      title: 'Term Financial Summary',
      description: 'Full income, expenses, and surplus for Term 2 2025',
      icon: <FileText size={20} />, color: 'var(--green)',
      tags: ['Income', 'Expenses', 'Board-ready'],
    },
    {
      title: 'Defaulters Report',
      description: 'All students with outstanding balances and contact info',
      icon: <Users size={20} />, color: 'var(--red)',
      tags: ['Student list', 'Balances', 'Guardians'],
    },
    {
      title: 'Payment Method Analysis',
      description: 'Breakdown of M-Pesa, cash, cheque and bank payments',
      icon: <BarChart2 size={20} />, color: 'var(--blue)',
      tags: ['M-Pesa', 'Cash', 'Trends'],
    },
    {
      title: 'Grade-wise Collection',
      description: 'Fee collection rate per grade and stream',
      icon: <TrendingUp size={20} />, color: 'var(--amber)',
      tags: ['By grade', 'Collection %'],
    },
    {
      title: 'Expense Voucher Report',
      description: 'All approved expenses with vendor details',
      icon: <TrendingDown size={20} />, color: 'var(--red)',
      tags: ['Vouchers', 'Categories', 'Approvals'],
    },
    {
      title: 'Annual Financial Statement',
      description: 'Full year income and expenditure for board of management',
      icon: <CheckCircle size={20} />, color: 'var(--ink)',
      tags: ['Annual', 'BoM', 'Audit'],
    },
  ]

  return (
    <div className="animate-in">
      <SectionHeader
        title="Reports"
        subtitle="Financial reports and analytics for Term 2 2025"
        action={<Button icon={<Download size={14} />} onClick={() => toast.success('Generating full term report PDF…')}>Export All</Button>}
      />

      {/* Financial snapshot */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Term 2 2025 — Financial Snapshot</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Green Valley Academy</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={() => toast.success('Downloading PDF report…')}>Download PDF</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[
            { label: 'Expected Revenue', value: formatKES(summary.total_expected), color: 'var(--ink)', icon: <TrendingUp size={16} /> },
            { label: 'Collected', value: formatKES(summary.total_collected), color: 'var(--green)', icon: <CheckCircle size={16} /> },
            { label: 'Outstanding', value: formatKES(summary.total_outstanding), color: 'var(--red)', icon: <TrendingDown size={16} /> },
            { label: 'Total Expenses', value: formatKES(totalExpenses), color: 'var(--red)', icon: <TrendingDown size={16} /> },
            { label: 'Net Surplus', value: formatKES(netSurplus), color: netSurplus >= 0 ? 'var(--green)' : 'var(--red)', icon: <BarChart2 size={16} /> },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--surface)', borderRadius: 10 }}>
              <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
              <p style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--mono)', marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Overall collection rate</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{summary.collection_rate}%</span>
          </div>
          <ProgressBar value={summary.total_collected} max={summary.total_expected} />
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          {[
            { label: 'Paid in Full', value: summary.paid_in_full, color: 'var(--green)' },
            { label: 'Partial Payment', value: summary.partial_payers, color: 'var(--amber)' },
            { label: 'No Payment', value: summary.defaulters, color: 'var(--red)' },
            { label: 'Total Students', value: summary.total_students, color: 'var(--ink)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{s.value} {s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Collection by Grade (KES '000s)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="grade" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip formatter={(v) => [`KES ${Number(v).toFixed(1)}K`]} contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="expected" name="Expected" fill="var(--line)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="var(--green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Payment Methods</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {methodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatKES(Number(v))} contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Report cards */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Available Reports</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {reportCards.map(r => (
            <Card key={r.title} style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: r.color + '15', color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{r.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{r.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {r.tags.map(t => <Badge key={t} variant="muted">{t}</Badge>)}
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={13} />} style={{ width: '100%' }} onClick={() => toast.success(`Generating ${r.title}…`)}>
                Download PDF
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
