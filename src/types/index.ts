// ─── Auth & Users ────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'school_admin' | 'bursar' | 'parent' | 'receptionist'

export interface AppUser {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  school_id?: string
  avatar_url?: string
  created_at: string
  is_active: boolean
}

// ─── Schools ──────────────────────────────────────────────────────────────────
export type SubscriptionTier = 'starter' | 'growth' | 'pro'
export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled'

export interface School {
  id: string
  name: string
  short_name: string
  logo_url?: string
  address: string
  county: string
  phone: string
  email: string
  principal_name: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  subscription_start: string
  subscription_end: string
  max_students: number
  daraja_consumer_key?: string
  daraja_consumer_secret?: string
  daraja_paybill?: string
  daraja_passkey?: string
  daraja_env: 'sandbox' | 'production'
  daraja_configured: boolean
  sms_api_key?: string
  sms_sender_id?: string
  sms_configured: boolean
  created_at: string
  is_active: boolean
}

// ─── Academic Structure ───────────────────────────────────────────────────────
export interface Grade {
  id: string
  school_id: string
  name: string          // e.g. "Grade 1", "PP1", "Standard 6"
  code: string          // e.g. "G1", "PP1", "S6"
  sort_order: number
  is_active: boolean
}

export interface Stream {
  id: string
  school_id: string
  grade_id: string
  name: string          // e.g. "East", "West", "Blue"
  class_teacher_id?: string
  capacity: number
  is_active: boolean
}

export interface AcademicYear {
  id: string
  school_id: string
  name: string          // e.g. "2025"
  start_date: string
  end_date: string
  is_current: boolean
}

export interface Term {
  id: string
  school_id: string
  academic_year_id: string
  name: string          // "Term 1", "Term 2", "Term 3"
  term_number: 1 | 2 | 3
  start_date: string
  end_date: string
  fee_due_date: string
  is_current: boolean
  invoices_generated: boolean
}

// ─── Fee Structures ───────────────────────────────────────────────────────────
export interface Votehead {
  id: string
  school_id: string
  name: string          // "Tuition", "Meals", "Transport", "Activity Fee"
  description?: string
  is_mandatory: boolean
  is_active: boolean
  sort_order: number
}

export interface FeeStructureItem {
  id: string
  school_id: string
  term_id: string
  grade_id: string
  votehead_id: string
  votehead?: Votehead
  amount: number
  is_optional: boolean
}

// ─── Students & Guardians ─────────────────────────────────────────────────────
export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'suspended' | 'withdrawn'

export interface Student {
  id: string
  school_id: string
  admission_number: string
  full_name: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  grade_id: string
  stream_id?: string
  grade?: Grade
  stream?: Stream
  admission_date: string
  status: StudentStatus
  photo_url?: string
  family_id?: string    // links siblings
  created_at: string
}

export interface Family {
  id: string
  school_id: string
  name: string          // e.g. "Kamau Family"
  sibling_discount_tier: number  // 0 = no discount, 1 = 1st child, etc.
}

export interface Guardian {
  id: string
  school_id: string
  user_id?: string      // if they have a portal account
  full_name: string
  phone: string
  phone_alt?: string
  email?: string
  id_number?: string
  relationship: string  // "Father", "Mother", "Guardian"
  is_primary: boolean
  is_fee_responsible: boolean
  family_id?: string
}

export interface StudentGuardian {
  student_id: string
  guardian_id: string
  guardian?: Guardian
  is_primary: boolean
}

// ─── Invoices & Ledger ────────────────────────────────────────────────────────
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid' | 'waived'

export interface Invoice {
  id: string
  school_id: string
  student_id: string
  term_id: string
  student?: Student
  term?: Term
  invoice_number: string
  issued_date: string
  due_date: string
  subtotal: number
  discount_amount: number
  bursary_amount: number
  net_amount: number
  paid_amount: number
  balance: number
  status: InvoiceStatus
  notes?: string
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  votehead_id: string
  votehead?: Votehead
  description: string
  amount: number
  discount: number
  net_amount: number
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export type PaymentMethod = 'mpesa_stk' | 'mpesa_paybill' | 'cash' | 'cheque' | 'bank_transfer' | 'bursary' | 'scholarship'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'reversed'

export interface Payment {
  id: string
  school_id: string
  student_id: string
  invoice_id?: string
  student?: Student
  receipt_number: string
  payment_method: PaymentMethod
  amount: number
  mpesa_code?: string         // e.g. QGH2KL9X0A
  mpesa_phone?: string
  mpesa_checkout_id?: string  // STK push checkout request ID
  cheque_number?: string
  bank_ref?: string
  payment_date: string
  status: PaymentStatus
  received_by?: string        // staff user id
  notes?: string
  receipt_sent: boolean
  receipt_pdf_url?: string
  created_at: string
  allocations?: PaymentAllocation[]
}

export interface PaymentAllocation {
  id: string
  payment_id: string
  invoice_id: string
  votehead_id: string
  votehead?: Votehead
  amount: number
}

// ─── Payment Links ────────────────────────────────────────────────────────────
export interface PaymentLink {
  id: string
  school_id: string
  student_id: string
  token: string           // unique URL token
  student?: Student
  expires_at: string
  is_active: boolean
  amount_suggested?: number
  created_by: string
  created_at: string
  last_used?: string
  use_count: number
}

// ─── Discounts ────────────────────────────────────────────────────────────────
export type DiscountType = 'sibling' | 'early_payment' | 'bursary' | 'scholarship' | 'staff_child' | 'custom'

export interface Discount {
  id: string
  school_id: string
  student_id: string
  invoice_id?: string
  type: DiscountType
  name: string
  percentage?: number
  fixed_amount?: number
  applied_amount: number
  approved_by?: string
  notes?: string
  created_at: string
}

// ─── Instalment Plans ─────────────────────────────────────────────────────────
export type InstalmentStatus = 'active' | 'completed' | 'defaulted' | 'cancelled'

export interface InstalmentPlan {
  id: string
  school_id: string
  student_id: string
  invoice_id: string
  student?: Student
  invoice?: Invoice
  total_amount: number
  paid_amount: number
  status: InstalmentStatus
  approved_by: string
  notes?: string
  created_at: string
  schedule?: InstalmentSchedule[]
}

export interface InstalmentSchedule {
  id: string
  plan_id: string
  due_date: string
  amount: number
  paid_amount: number
  is_paid: boolean
  payment_id?: string
  reminder_sent: boolean
}

// ─── Expenses ────────────────────────────────────────────────────────────────
export type ExpenseStatus = 'pending_approval' | 'approved' | 'paid' | 'rejected'

export interface ExpenseCategory {
  id: string
  school_id: string
  name: string          // "Salaries", "Utilities", "Maintenance", "Supplies"
  budget_per_term?: number
  is_active: boolean
}

export interface Expense {
  id: string
  school_id: string
  term_id: string
  category_id: string
  category?: ExpenseCategory
  description: string
  amount: number
  vendor?: string
  payment_method: 'cash' | 'cheque' | 'bank_transfer' | 'mpesa'
  payment_ref?: string
  payment_date: string
  status: ExpenseStatus
  approved_by?: string
  voucher_number: string
  receipt_url?: string
  created_by: string
  created_at: string
}

export interface PettyCash {
  id: string
  school_id: string
  imprest_holder: string
  amount_given: number
  amount_accounted: number
  balance: number
  given_date: string
  accounted_date?: string
  status: 'open' | 'accounted' | 'overdue'
  notes?: string
}

// ─── SMS & Notifications ──────────────────────────────────────────────────────
export interface SmsLog {
  id: string
  school_id: string
  recipient_phone: string
  recipient_name?: string
  message: string
  type: 'receipt' | 'reminder' | 'balance' | 'general' | 'instalment_due'
  status: 'sent' | 'failed' | 'pending'
  cost?: number
  sent_at: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string
  school_id: string
  user_id: string
  user_name: string
  action: string
  entity_type: string
  entity_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface TermFinancialSummary {
  term_id: string
  term_name: string
  total_expected: number
  total_collected: number
  total_outstanding: number
  total_students: number
  paid_in_full: number
  partial_payers: number
  defaulters: number
  collection_rate: number
}

export interface DailyCollection {
  date: string
  amount: number
  transaction_count: number
}
