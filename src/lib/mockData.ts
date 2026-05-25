import type {
  School, Grade, Stream, AcademicYear, Term, Votehead,
  FeeStructureItem, Student, Guardian, Invoice, InvoiceItem,
  Payment, Family, TermFinancialSummary, DailyCollection, ExpenseCategory, Expense
} from '../types'

// ─── School ───────────────────────────────────────────────────────────────────
export const DEMO_SCHOOL: School = {
  id: 'sch-001',
  name: 'Green Valley Academy',
  short_name: 'GVA',
  address: 'Off Ngong Road, Karen, Nairobi',
  county: 'Nairobi',
  phone: '0722 123 456',
  email: 'info@greenvalley.sc.ke',
  principal_name: 'Jane Wanjiku',
  subscription_tier: 'growth',
  subscription_status: 'active',
  subscription_start: '2025-01-01',
  subscription_end: '2025-12-31',
  max_students: 500,
  daraja_paybill: '400200',
  daraja_env: 'sandbox',
  daraja_configured: true,
  sms_configured: true,
  sms_sender_id: 'GVALLEY',
  created_at: '2025-01-01',
  is_active: true
}

// ─── Grades ───────────────────────────────────────────────────────────────────
export const DEMO_GRADES: Grade[] = [
  { id: 'g-pp1', school_id: 'sch-001', name: 'PP1', code: 'PP1', sort_order: 1, is_active: true },
  { id: 'g-pp2', school_id: 'sch-001', name: 'PP2', code: 'PP2', sort_order: 2, is_active: true },
  { id: 'g-1', school_id: 'sch-001', name: 'Grade 1', code: 'G1', sort_order: 3, is_active: true },
  { id: 'g-2', school_id: 'sch-001', name: 'Grade 2', code: 'G2', sort_order: 4, is_active: true },
  { id: 'g-3', school_id: 'sch-001', name: 'Grade 3', code: 'G3', sort_order: 5, is_active: true },
  { id: 'g-4', school_id: 'sch-001', name: 'Grade 4', code: 'G4', sort_order: 6, is_active: true },
  { id: 'g-5', school_id: 'sch-001', name: 'Grade 5', code: 'G5', sort_order: 7, is_active: true },
  { id: 'g-6', school_id: 'sch-001', name: 'Grade 6', code: 'G6', sort_order: 8, is_active: true },
  { id: 'g-7', school_id: 'sch-001', name: 'Grade 7', code: 'G7', sort_order: 9, is_active: true },
  { id: 'g-8', school_id: 'sch-001', name: 'Grade 8', code: 'G8', sort_order: 10, is_active: true },
  { id: 'g-9', school_id: 'sch-001', name: 'Grade 9', code: 'G9', sort_order: 11, is_active: true },
]

// ─── Streams ──────────────────────────────────────────────────────────────────
export const DEMO_STREAMS: Stream[] = [
  { id: 'st-1e', school_id: 'sch-001', grade_id: 'g-1', name: 'East', capacity: 35, is_active: true },
  { id: 'st-1w', school_id: 'sch-001', grade_id: 'g-1', name: 'West', capacity: 35, is_active: true },
  { id: 'st-4e', school_id: 'sch-001', grade_id: 'g-4', name: 'East', capacity: 38, is_active: true },
  { id: 'st-4w', school_id: 'sch-001', grade_id: 'g-4', name: 'West', capacity: 38, is_active: true },
  { id: 'st-8e', school_id: 'sch-001', grade_id: 'g-8', name: 'East', capacity: 40, is_active: true },
]

// ─── Academic Year ────────────────────────────────────────────────────────────
export const DEMO_ACADEMIC_YEAR: AcademicYear = {
  id: 'ay-2025', school_id: 'sch-001', name: '2025',
  start_date: '2025-01-06', end_date: '2025-11-28', is_current: true
}

// ─── Terms ────────────────────────────────────────────────────────────────────
export const DEMO_TERMS: Term[] = [
  {
    id: 'term-1', school_id: 'sch-001', academic_year_id: 'ay-2025',
    name: 'Term 1 2025', term_number: 1,
    start_date: '2025-01-06', end_date: '2025-04-04',
    fee_due_date: '2025-01-10', is_current: false, invoices_generated: true
  },
  {
    id: 'term-2', school_id: 'sch-001', academic_year_id: 'ay-2025',
    name: 'Term 2 2025', term_number: 2,
    start_date: '2025-05-05', end_date: '2025-08-01',
    fee_due_date: '2025-05-09', is_current: true, invoices_generated: true
  },
  {
    id: 'term-3', school_id: 'sch-001', academic_year_id: 'ay-2025',
    name: 'Term 3 2025', term_number: 3,
    start_date: '2025-09-01', end_date: '2025-11-28',
    fee_due_date: '2025-09-05', is_current: false, invoices_generated: false
  },
]

export const CURRENT_TERM = DEMO_TERMS[1]

// ─── Voteheads ────────────────────────────────────────────────────────────────
export const DEMO_VOTEHEADS: Votehead[] = [
  { id: 'vh-tuition', school_id: 'sch-001', name: 'Tuition', is_mandatory: true, is_active: true, sort_order: 1 },
  { id: 'vh-meals', school_id: 'sch-001', name: 'Meals', is_mandatory: true, is_active: true, sort_order: 2 },
  { id: 'vh-transport', school_id: 'sch-001', name: 'Transport', is_mandatory: false, is_active: true, sort_order: 3 },
  { id: 'vh-activity', school_id: 'sch-001', name: 'Activity Fee', is_mandatory: true, is_active: true, sort_order: 4 },
  { id: 'vh-comp', school_id: 'sch-001', name: 'Computer Fee', is_mandatory: true, is_active: true, sort_order: 5 },
  { id: 'vh-uniform', school_id: 'sch-001', name: 'Uniform (new students)', is_mandatory: false, is_active: true, sort_order: 6 },
]

// ─── Fee Structures ───────────────────────────────────────────────────────────
export const DEMO_FEE_STRUCTURES: FeeStructureItem[] = [
  // Grade 1 Term 2
  { id: 'fs-1', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-1', votehead_id: 'vh-tuition', votehead: DEMO_VOTEHEADS[0], amount: 18000, is_optional: false },
  { id: 'fs-2', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-1', votehead_id: 'vh-meals', votehead: DEMO_VOTEHEADS[1], amount: 5000, is_optional: false },
  { id: 'fs-3', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-1', votehead_id: 'vh-activity', votehead: DEMO_VOTEHEADS[3], amount: 1500, is_optional: false },
  { id: 'fs-4', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-1', votehead_id: 'vh-comp', votehead: DEMO_VOTEHEADS[4], amount: 1000, is_optional: false },
  // Grade 4
  { id: 'fs-5', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-4', votehead_id: 'vh-tuition', votehead: DEMO_VOTEHEADS[0], amount: 22000, is_optional: false },
  { id: 'fs-6', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-4', votehead_id: 'vh-meals', votehead: DEMO_VOTEHEADS[1], amount: 5500, is_optional: false },
  { id: 'fs-7', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-4', votehead_id: 'vh-activity', votehead: DEMO_VOTEHEADS[3], amount: 1500, is_optional: false },
  { id: 'fs-8', school_id: 'sch-001', term_id: 'term-2', grade_id: 'g-4', votehead_id: 'vh-comp', votehead: DEMO_VOTEHEADS[4], amount: 1000, is_optional: false },
]

// ─── Families ─────────────────────────────────────────────────────────────────
export const DEMO_FAMILIES: Family[] = [
  { id: 'fam-001', school_id: 'sch-001', name: 'Kamau Family', sibling_discount_tier: 2 },
  { id: 'fam-002', school_id: 'sch-001', name: 'Otieno Family', sibling_discount_tier: 1 },
]

// ─── Guardians ────────────────────────────────────────────────────────────────
export const DEMO_GUARDIANS: Guardian[] = [
  { id: 'grd-001', school_id: 'sch-001', full_name: 'Grace Kamau', phone: '0712345678', email: 'grace@test.com', relationship: 'Mother', is_primary: true, is_fee_responsible: true, family_id: 'fam-001' },
  { id: 'grd-002', school_id: 'sch-001', full_name: 'John Kamau', phone: '0723456789', relationship: 'Father', is_primary: false, is_fee_responsible: true, family_id: 'fam-001' },
  { id: 'grd-003', school_id: 'sch-001', full_name: 'Alice Otieno', phone: '0734567890', email: 'alice@test.com', relationship: 'Mother', is_primary: true, is_fee_responsible: true, family_id: 'fam-002' },
  { id: 'grd-004', school_id: 'sch-001', full_name: 'David Mwangi', phone: '0745678901', relationship: 'Father', is_primary: true, is_fee_responsible: true },
  { id: 'grd-005', school_id: 'sch-001', full_name: 'Susan Njeri', phone: '0756789012', relationship: 'Mother', is_primary: true, is_fee_responsible: true },
  { id: 'grd-006', school_id: 'sch-001', full_name: 'James Odhiambo', phone: '0767890123', relationship: 'Father', is_primary: true, is_fee_responsible: true },
]

// ─── Students ─────────────────────────────────────────────────────────────────
export const DEMO_STUDENTS: Student[] = [
  { id: 'std-001', school_id: 'sch-001', admission_number: 'GVA/2023/001', full_name: 'Amara Kamau', gender: 'female', grade_id: 'g-4', stream_id: 'st-4e', grade: DEMO_GRADES[5], stream: DEMO_STREAMS[2], admission_date: '2023-01-09', status: 'active', family_id: 'fam-001', created_at: '2023-01-09' },
  { id: 'std-002', school_id: 'sch-001', admission_number: 'GVA/2023/002', full_name: 'Brian Kamau', gender: 'male', grade_id: 'g-1', stream_id: 'st-1e', grade: DEMO_GRADES[2], stream: DEMO_STREAMS[0], admission_date: '2023-01-09', status: 'active', family_id: 'fam-001', created_at: '2023-01-09' },
  { id: 'std-003', school_id: 'sch-001', admission_number: 'GVA/2022/015', full_name: 'Chloe Otieno', gender: 'female', grade_id: 'g-4', stream_id: 'st-4w', grade: DEMO_GRADES[5], stream: DEMO_STREAMS[3], admission_date: '2022-01-10', status: 'active', family_id: 'fam-002', created_at: '2022-01-10' },
  { id: 'std-004', school_id: 'sch-001', admission_number: 'GVA/2021/008', full_name: 'Daniel Mwangi', gender: 'male', grade_id: 'g-8', stream_id: 'st-8e', grade: DEMO_GRADES[9], stream: DEMO_STREAMS[4], admission_date: '2021-01-11', status: 'active', created_at: '2021-01-11' },
  { id: 'std-005', school_id: 'sch-001', admission_number: 'GVA/2024/031', full_name: 'Esther Njeri', gender: 'female', grade_id: 'g-1', stream_id: 'st-1w', grade: DEMO_GRADES[2], stream: DEMO_STREAMS[1], admission_date: '2024-01-08', status: 'active', created_at: '2024-01-08' },
  { id: 'std-006', school_id: 'sch-001', admission_number: 'GVA/2020/003', full_name: 'Felix Odhiambo', gender: 'male', grade_id: 'g-8', stream_id: 'st-8e', grade: DEMO_GRADES[9], stream: DEMO_STREAMS[4], admission_date: '2020-01-13', status: 'active', created_at: '2020-01-13' },
  { id: 'std-007', school_id: 'sch-001', admission_number: 'GVA/2023/044', full_name: 'Gloria Waweru', gender: 'female', grade_id: 'g-4', stream_id: 'st-4e', grade: DEMO_GRADES[5], stream: DEMO_STREAMS[2], admission_date: '2023-01-09', status: 'active', created_at: '2023-01-09' },
  { id: 'std-008', school_id: 'sch-001', admission_number: 'GVA/2022/019', full_name: 'Hassan Abdi', gender: 'male', grade_id: 'g-4', stream_id: 'st-4w', grade: DEMO_GRADES[5], stream: DEMO_STREAMS[3], admission_date: '2022-01-10', status: 'active', created_at: '2022-01-10' },
]

// ─── Invoices ─────────────────────────────────────────────────────────────────
const makeInvoiceItems = (invoiceId: string, gradeId: string): InvoiceItem[] => {
  const items = DEMO_FEE_STRUCTURES.filter(f => f.grade_id === gradeId && f.term_id === 'term-2')
  return items.map((f, i) => ({
    id: `${invoiceId}-item-${i}`,
    invoice_id: invoiceId,
    votehead_id: f.votehead_id,
    votehead: f.votehead,
    description: f.votehead?.name || '',
    amount: f.amount,
    discount: 0,
    net_amount: f.amount,
  }))
}

export const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv-001', school_id: 'sch-001', student_id: 'std-001', term_id: 'term-2',
    student: DEMO_STUDENTS[0], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/001', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 30000, discount_amount: 2250, bursary_amount: 0, net_amount: 27750,
    paid_amount: 27750, balance: 0, status: 'paid',
    items: makeInvoiceItems('inv-001', 'g-4')
  },
  {
    id: 'inv-002', school_id: 'sch-001', student_id: 'std-002', term_id: 'term-2',
    student: DEMO_STUDENTS[1], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/002', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 25500, discount_amount: 4462, bursary_amount: 0, net_amount: 21038,
    paid_amount: 21038, balance: 0, status: 'paid',
    items: makeInvoiceItems('inv-002', 'g-1')
  },
  {
    id: 'inv-003', school_id: 'sch-001', student_id: 'std-003', term_id: 'term-2',
    student: DEMO_STUDENTS[2], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/003', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 30000, discount_amount: 0, bursary_amount: 0, net_amount: 30000,
    paid_amount: 15000, balance: 15000, status: 'partial',
    items: makeInvoiceItems('inv-003', 'g-4')
  },
  {
    id: 'inv-004', school_id: 'sch-001', student_id: 'std-004', term_id: 'term-2',
    student: DEMO_STUDENTS[3], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/004', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 30000, discount_amount: 0, bursary_amount: 5000, net_amount: 25000,
    paid_amount: 25000, balance: 0, status: 'paid',
    items: makeInvoiceItems('inv-004', 'g-4')
  },
  {
    id: 'inv-005', school_id: 'sch-001', student_id: 'std-005', term_id: 'term-2',
    student: DEMO_STUDENTS[4], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/005', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 25500, discount_amount: 0, bursary_amount: 0, net_amount: 25500,
    paid_amount: 0, balance: 25500, status: 'unpaid',
    items: makeInvoiceItems('inv-005', 'g-1')
  },
  {
    id: 'inv-006', school_id: 'sch-001', student_id: 'std-006', term_id: 'term-2',
    student: DEMO_STUDENTS[5], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/006', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 30000, discount_amount: 0, bursary_amount: 0, net_amount: 30000,
    paid_amount: 10000, balance: 20000, status: 'partial',
    items: makeInvoiceItems('inv-006', 'g-4')
  },
  {
    id: 'inv-007', school_id: 'sch-001', student_id: 'std-007', term_id: 'term-2',
    student: DEMO_STUDENTS[6], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/007', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 30000, discount_amount: 0, bursary_amount: 0, net_amount: 30000,
    paid_amount: 0, balance: 30000, status: 'unpaid',
    items: makeInvoiceItems('inv-007', 'g-4')
  },
  {
    id: 'inv-008', school_id: 'sch-001', student_id: 'std-008', term_id: 'term-2',
    student: DEMO_STUDENTS[7], term: DEMO_TERMS[1],
    invoice_number: 'GVA/2025/T2/008', issued_date: '2025-05-05', due_date: '2025-05-09',
    subtotal: 30000, discount_amount: 0, bursary_amount: 0, net_amount: 30000,
    paid_amount: 30000, balance: 0, status: 'paid',
    items: makeInvoiceItems('inv-008', 'g-4')
  },
]

// ─── Payments ─────────────────────────────────────────────────────────────────
export const DEMO_PAYMENTS: Payment[] = [
  { id: 'pay-001', school_id: 'sch-001', student_id: 'std-001', invoice_id: 'inv-001', student: DEMO_STUDENTS[0], receipt_number: 'GVA/RCP/2025/0234', payment_method: 'mpesa_stk', amount: 27750, mpesa_code: 'QGH2KL9X0A', mpesa_phone: '0712345678', payment_date: '2025-05-06T09:14:22', status: 'completed', receipt_sent: true, created_at: '2025-05-06T09:14:22' },
  { id: 'pay-002', school_id: 'sch-001', student_id: 'std-002', invoice_id: 'inv-002', student: DEMO_STUDENTS[1], receipt_number: 'GVA/RCP/2025/0235', payment_method: 'mpesa_stk', amount: 21038, mpesa_code: 'QGH3ML0Y1B', mpesa_phone: '0712345678', payment_date: '2025-05-06T10:02:11', status: 'completed', receipt_sent: true, created_at: '2025-05-06T10:02:11' },
  { id: 'pay-003', school_id: 'sch-001', student_id: 'std-003', invoice_id: 'inv-003', student: DEMO_STUDENTS[2], receipt_number: 'GVA/RCP/2025/0241', payment_method: 'mpesa_paybill', amount: 15000, mpesa_code: 'QRT4NO2Z2C', mpesa_phone: '0734567890', payment_date: '2025-05-08T14:33:00', status: 'completed', receipt_sent: true, created_at: '2025-05-08T14:33:00' },
  { id: 'pay-004', school_id: 'sch-001', student_id: 'std-004', invoice_id: 'inv-004', student: DEMO_STUDENTS[3], receipt_number: 'GVA/RCP/2025/0244', payment_method: 'bank_transfer', amount: 25000, bank_ref: 'EQUITY/20250507/8834', payment_date: '2025-05-07T11:00:00', status: 'completed', receipt_sent: true, created_at: '2025-05-07T11:00:00' },
  { id: 'pay-005', school_id: 'sch-001', student_id: 'std-006', invoice_id: 'inv-006', student: DEMO_STUDENTS[5], receipt_number: 'GVA/RCP/2025/0248', payment_method: 'cash', amount: 10000, payment_date: '2025-05-09T08:20:00', status: 'completed', receipt_sent: false, received_by: 'b-001', created_at: '2025-05-09T08:20:00' },
  { id: 'pay-006', school_id: 'sch-001', student_id: 'std-008', invoice_id: 'inv-008', student: DEMO_STUDENTS[7], receipt_number: 'GVA/RCP/2025/0252', payment_method: 'mpesa_stk', amount: 30000, mpesa_code: 'QXY9PQ3A3D', mpesa_phone: '0767890123', payment_date: '2025-05-10T16:45:00', status: 'completed', receipt_sent: true, created_at: '2025-05-10T16:45:00' },
]

// ─── Term Summary ─────────────────────────────────────────────────────────────
export const DEMO_TERM_SUMMARY: TermFinancialSummary = {
  term_id: 'term-2',
  term_name: 'Term 2 2025',
  total_expected: 218788,
  total_collected: 128788,
  total_outstanding: 90000,
  total_students: 8,
  paid_in_full: 4,
  partial_payers: 2,
  defaulters: 2,
  collection_rate: 58.9,
}

// ─── Daily Collections (last 14 days) ────────────────────────────────────────
export const DEMO_DAILY_COLLECTIONS: DailyCollection[] = [
  { date: '2025-05-03', amount: 0, transaction_count: 0 },
  { date: '2025-05-04', amount: 0, transaction_count: 0 },
  { date: '2025-05-05', amount: 0, transaction_count: 0 },
  { date: '2025-05-06', amount: 48788, transaction_count: 2 },
  { date: '2025-05-07', amount: 25000, transaction_count: 1 },
  { date: '2025-05-08', amount: 15000, transaction_count: 1 },
  { date: '2025-05-09', amount: 10000, transaction_count: 1 },
  { date: '2025-05-10', amount: 30000, transaction_count: 1 },
  { date: '2025-05-11', amount: 0, transaction_count: 0 },
  { date: '2025-05-12', amount: 0, transaction_count: 0 },
  { date: '2025-05-13', amount: 0, transaction_count: 0 },
  { date: '2025-05-14', amount: 0, transaction_count: 0 },
  { date: '2025-05-15', amount: 0, transaction_count: 0 },
  { date: '2025-05-16', amount: 0, transaction_count: 0 },
]

// ─── Expense Categories ───────────────────────────────────────────────────────
export const DEMO_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'ec-001', school_id: 'sch-001', name: 'Staff Salaries', budget_per_term: 480000, is_active: true },
  { id: 'ec-002', school_id: 'sch-001', name: 'Utilities', budget_per_term: 45000, is_active: true },
  { id: 'ec-003', school_id: 'sch-001', name: 'Maintenance & Repairs', budget_per_term: 30000, is_active: true },
  { id: 'ec-004', school_id: 'sch-001', name: 'Teaching Materials', budget_per_term: 25000, is_active: true },
  { id: 'ec-005', school_id: 'sch-001', name: 'Meals / Catering', budget_per_term: 120000, is_active: true },
  { id: 'ec-006', school_id: 'sch-001', name: 'Transport', budget_per_term: 60000, is_active: true },
]

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const DEMO_EXPENSES: Expense[] = [
  { id: 'exp-001', school_id: 'sch-001', term_id: 'term-2', category_id: 'ec-002', category: DEMO_EXPENSE_CATEGORIES[1], description: 'Electricity bill - May', amount: 14500, vendor: 'KPLC', payment_method: 'bank_transfer', payment_ref: 'KPLC/0599/MAY', payment_date: '2025-05-03', status: 'paid', voucher_number: 'GVA/VCH/2025/042', created_by: 'b-001', created_at: '2025-05-03' },
  { id: 'exp-002', school_id: 'sch-001', term_id: 'term-2', category_id: 'ec-004', category: DEMO_EXPENSE_CATEGORIES[3], description: 'CBC workbooks - Grade 1-3', amount: 18200, vendor: 'Longhorn Publishers', payment_method: 'cheque', payment_ref: 'CHQ/00234', payment_date: '2025-05-05', status: 'paid', voucher_number: 'GVA/VCH/2025/043', created_by: 'b-001', created_at: '2025-05-05' },
  { id: 'exp-003', school_id: 'sch-001', term_id: 'term-2', category_id: 'ec-003', category: DEMO_EXPENSE_CATEGORIES[2], description: 'Plumbing repairs - Block B toilets', amount: 8500, vendor: 'Mwangi Plumbers', payment_method: 'cash', payment_date: '2025-05-07', status: 'paid', voucher_number: 'GVA/VCH/2025/044', created_by: 'b-001', created_at: '2025-05-07' },
  { id: 'exp-004', school_id: 'sch-001', term_id: 'term-2', category_id: 'ec-002', category: DEMO_EXPENSE_CATEGORIES[1], description: 'Water bill - May', amount: 6200, vendor: 'Nairobi Water', payment_method: 'mpesa', payment_ref: 'QXY9PQ3A3E', payment_date: '2025-05-08', status: 'paid', voucher_number: 'GVA/VCH/2025/045', created_by: 'b-001', created_at: '2025-05-08' },
  { id: 'exp-005', school_id: 'sch-001', term_id: 'term-2', category_id: 'ec-005', category: DEMO_EXPENSE_CATEGORIES[4], description: 'Catering supplies - Week 2', amount: 38000, vendor: 'Fresh Foods Ltd', payment_method: 'cheque', payment_ref: 'CHQ/00235', payment_date: '2025-05-09', status: 'approved', voucher_number: 'GVA/VCH/2025/046', created_by: 'b-001', created_at: '2025-05-09' },
  { id: 'exp-006', school_id: 'sch-001', term_id: 'term-2', category_id: 'ec-003', category: DEMO_EXPENSE_CATEGORIES[2], description: 'Classroom painting - Block A', amount: 22000, vendor: 'Colour Masters', payment_method: 'bank_transfer', payment_date: '2025-05-12', status: 'pending_approval', voucher_number: 'GVA/VCH/2025/047', created_by: 'b-001', created_at: '2025-05-12' },
]

// ─── Helper: format KES ───────────────────────────────────────────────────────
export const formatKES = (amount: number) =>
  `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`

// ─── Helper: get student guardians ────────────────────────────────────────────
export const getStudentGuardians = (studentId: string): Guardian[] => {
  const student = DEMO_STUDENTS.find(s => s.id === studentId)
  if (!student) return []
  if (student.family_id) {
    return DEMO_GUARDIANS.filter(g => g.family_id === student.family_id)
  }
  // fallback
  const map: Record<string, string> = {
    'std-004': 'grd-004', 'std-005': 'grd-005', 'std-006': 'grd-006',
    'std-007': 'grd-005', 'std-008': 'grd-006',
  }
  const grdId = map[studentId]
  return grdId ? DEMO_GUARDIANS.filter(g => g.id === grdId) : []
}

export const getStudentInvoice = (studentId: string, termId = 'term-2') =>
  DEMO_INVOICES.find(i => i.student_id === studentId && i.term_id === termId)

export const getStudentPayments = (studentId: string) =>
  DEMO_PAYMENTS.filter(p => p.student_id === studentId)
