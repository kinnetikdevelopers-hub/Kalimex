import { supabase } from './supabase'

// ─── Helper ───────────────────────────────────────────────────────────────────
function handleError(error: any, fallback?: any) {
  if (error) {
    console.error('[Kalimex DB]', error.message)
    return { data: fallback ?? null, error: error.message }
  }
  return null
}

// ─── SCHOOLS ─────────────────────────────────────────────────────────────────
export const schoolsApi = {
  async list() {
    const { data, error } = await supabase.from('schools').select('*').order('name')
    return { data, error: error?.message }
  },

  async get(id: string) {
    const { data, error } = await supabase.from('schools').select('*').eq('id', id).single()
    return { data, error: error?.message }
  },

  async create(school: {
    name: string; short_name?: string; address?: string; county: string
    phone: string; email: string; principal_name?: string
    subscription_tier: string
  }) {
    const { data, error } = await supabase.from('schools').insert(school).select().single()
    return { data, error: error?.message }
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('schools').update(updates).eq('id', id).select().single()
    return { data, error: error?.message }
  },
}

// ─── USERS / AUTH ─────────────────────────────────────────────────────────────
export const authApi = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { user: null, error: error.message }
    // Fetch profile
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
    return { user: profile, error: null }
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message }
  },

  async createStaffUser(userData: {
    email: string; password: string; full_name: string
    role: string; school_id: string; phone?: string
  }) {
    // In production use admin API via edge function
    // Here we use signUp then insert profile
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })
    if (error || !data.user) return { data: null, error: error?.message }

    const { data: profile } = await supabase.from('users').insert({
      id: data.user.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      school_id: userData.school_id,
      phone: userData.phone,
    }).select().single()

    return { data: profile, error: null }
  },

  async listStaff(schoolId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('school_id', schoolId)
      .neq('role', 'parent')
      .order('full_name')
    return { data, error: error?.message }
  },
}

// ─── GRADES ───────────────────────────────────────────────────────────────────
export const gradesApi = {
  async list(schoolId: string) {
    const { data, error } = await supabase
      .from('grades').select('*')
      .eq('school_id', schoolId).order('sort_order')
    return { data, error: error?.message }
  },

  async create(schoolId: string, name: string, code: string, sortOrder: number) {
    const { data, error } = await supabase
      .from('grades').insert({ school_id: schoolId, name, code, sort_order: sortOrder })
      .select().single()
    return { data, error: error?.message }
  },
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
export const studentsApi = {
  async list(schoolId: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`*, grade:grades(id,name,code), stream:streams(id,name)`)
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .order('full_name')
    return { data, error: error?.message }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`*, grade:grades(*), stream:streams(*), student_guardians(*, guardian:guardians(*))`)
      .eq('id', id).single()
    return { data, error: error?.message }
  },

  async create(student: {
    school_id: string; admission_number: string; full_name: string
    grade_id: string; stream_id?: string; gender?: string
    date_of_birth?: string; admission_date: string; family_id?: string
  }) {
    const { data, error } = await supabase.from('students').insert(student).select().single()
    return { data, error: error?.message }
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single()
    return { data, error: error?.message }
  },

  async bulkCreate(students: any[]) {
    const { data, error } = await supabase.from('students').insert(students).select()
    return { data, error: error?.message }
  },

  async search(schoolId: string, query: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`*, grade:grades(id,name), stream:streams(id,name)`)
      .eq('school_id', schoolId)
      .or(`full_name.ilike.%${query}%,admission_number.ilike.%${query}%`)
      .limit(20)
    return { data, error: error?.message }
  },
}

// ─── GUARDIANS ────────────────────────────────────────────────────────────────
export const guardiansApi = {
  async createWithStudent(guardian: {
    school_id: string; full_name: string; phone: string
    email?: string; relationship: string; is_primary: boolean
    is_fee_responsible: boolean; family_id?: string
  }, studentId: string) {
    const { data, error } = await supabase.from('guardians').insert(guardian).select().single()
    if (error || !data) return { data: null, error: error?.message }

    await supabase.from('student_guardians').insert({
      student_id: studentId, guardian_id: data.id, is_primary: guardian.is_primary
    })
    return { data, error: null }
  },

  async listForStudent(studentId: string) {
    const { data, error } = await supabase
      .from('student_guardians')
      .select('*, guardian:guardians(*)')
      .eq('student_id', studentId)
    return { data, error: error?.message }
  },
}

// ─── TERMS ────────────────────────────────────────────────────────────────────
export const termsApi = {
  async list(schoolId: string) {
    const { data, error } = await supabase
      .from('terms').select('*, academic_year:academic_years(*)')
      .eq('school_id', schoolId).order('term_number')
    return { data, error: error?.message }
  },

  async getCurrent(schoolId: string) {
    const { data, error } = await supabase
      .from('terms').select('*')
      .eq('school_id', schoolId).eq('is_current', true).single()
    return { data, error: error?.message }
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('terms').update(updates).eq('id', id).select().single()
    return { data, error: error?.message }
  },
}

// ─── VOTEHEADS ────────────────────────────────────────────────────────────────
export const voteheadsApi = {
  async list(schoolId: string) {
    const { data, error } = await supabase
      .from('voteheads').select('*').eq('school_id', schoolId)
      .eq('is_active', true).order('sort_order')
    return { data, error: error?.message }
  },

  async create(schoolId: string, name: string, isMandatory: boolean) {
    const { data: existing } = await supabase.from('voteheads').select('sort_order').eq('school_id', schoolId).order('sort_order', { ascending: false }).limit(1).single()
    const nextOrder = ((existing as any)?.sort_order ?? 0) + 1
    const { data, error } = await supabase.from('voteheads')
      .insert({ school_id: schoolId, name, is_mandatory: isMandatory, sort_order: nextOrder })
      .select().single()
    return { data, error: error?.message }
  },
}

// ─── FEE STRUCTURES ───────────────────────────────────────────────────────────
export const feeStructureApi = {
  async get(termId: string, gradeId: string) {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('*, votehead:voteheads(*)')
      .eq('term_id', termId).eq('grade_id', gradeId)
    return { data, error: error?.message }
  },

  async upsert(schoolId: string, termId: string, gradeId: string, voteheadId: string, amount: number) {
    const { data, error } = await supabase
      .from('fee_structures')
      .upsert({ school_id: schoolId, term_id: termId, grade_id: gradeId, votehead_id: voteheadId, amount },
        { onConflict: 'term_id,grade_id,votehead_id' })
      .select().single()
    return { data, error: error?.message }
  },
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
export const invoicesApi = {
  async list(schoolId: string, termId?: string) {
    let q = supabase
      .from('invoices')
      .select(`*, student:students(id,full_name,admission_number,grade:grades(name),stream:streams(name)), items:invoice_items(*, votehead:voteheads(name)), term:terms(name)`)
      .eq('school_id', schoolId)
    if (termId) q = q.eq('term_id', termId)
    const { data, error } = await q.order('created_at', { ascending: false })
    return { data, error: error?.message }
  },

  async getForStudent(studentId: string, termId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`*, items:invoice_items(*, votehead:voteheads(name))`)
      .eq('student_id', studentId).eq('term_id', termId).single()
    return { data, error: error?.message }
  },

  async generateForTerm(schoolId: string, termId: string) {
    // Call edge function to bulk-generate invoices
    const { data, error } = await supabase.functions.invoke('generate-term-invoices', {
      body: { school_id: schoolId, term_id: termId }
    })
    return { data, error: error?.message }
  },

  async updateStatus(id: string, paidAmount: number) {
    const status = paidAmount === 0 ? 'unpaid' : 'partial'
    const { data, error } = await supabase
      .from('invoices')
      .update({ paid_amount: paidAmount, status })
      .eq('id', id).select().single()
    return { data, error: error?.message }
  },

  async waive(id: string, notes: string) {
    const { data, error } = await supabase
      .from('invoices').update({ status: 'waived', notes }).eq('id', id).select().single()
    return { data, error: error?.message }
  },
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  async list(schoolId: string, limit = 50) {
    const { data, error } = await supabase
      .from('payments')
      .select(`*, student:students(id,full_name,admission_number,grade:grades(name))`)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data, error: error?.message }
  },

  async recordManual(payment: {
    school_id: string; student_id: string; invoice_id?: string
    payment_method: string; amount: number
    mpesa_code?: string; cheque_number?: string; bank_ref?: string
    notes?: string; received_by: string
  }) {
    // 1. Get next receipt number
    const { count } = await supabase
      .from('payments').select('*', { count: 'exact', head: true })
      .eq('school_id', payment.school_id)

    const { data: school } = await supabase
      .from('schools').select('short_name').eq('id', payment.school_id).single()

    const seq = String((count || 0) + 1).padStart(4, '0')
    const year = new Date().getFullYear()
    const receiptNumber = `${(school as any)?.short_name || 'SCH'}/RCP/${year}/${seq}`

    // 2. Insert payment
    const { data, error } = await supabase.from('payments').insert({
      ...payment,
      receipt_number: receiptNumber,
      payment_date: new Date().toISOString(),
      status: 'completed',
    }).select().single()

    if (error) return { data: null, error: error.message }

    // 3. Update invoice paid_amount if invoice_id given
    if (payment.invoice_id) {
      const { data: inv } = await supabase
        .from('invoices').select('paid_amount,net_amount').eq('id', payment.invoice_id).single()
      if (inv) {
        const newPaid = (inv as any).paid_amount + payment.amount
        const newBalance = (inv as any).net_amount - newPaid
        const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'
        await supabase.from('invoices')
          .update({ paid_amount: newPaid, status: newStatus })
          .eq('id', payment.invoice_id)
      }
    }

    // 4. Log to audit
    await supabase.from('audit_logs').insert({
      school_id: payment.school_id,
      user_id: payment.received_by,
      user_name: 'Staff',
      action: 'PAYMENT_MANUAL',
      entity_type: 'payment',
      entity_id: (data as any).id,
      new_values: { amount: payment.amount, method: payment.payment_method, receipt: receiptNumber },
    })

    return { data, error: null }
  },

  async initiateStkPush(schoolId: string, studentId: string, invoiceId: string, phone: string, amount: number, userId: string) {
    const { data, error } = await supabase.functions.invoke('initiate-stk-push', {
      body: { school_id: schoolId, student_id: studentId, invoice_id: invoiceId, phone, amount, created_by: userId }
    })
    return { data, error: error?.message }
  },

  async pollStatus(paymentId: string): Promise<'pending' | 'completed' | 'failed'> {
    const { data } = await supabase
      .from('payments').select('status').eq('id', paymentId).single()
    return (data as any)?.status || 'pending'
  },

  async generatePaymentLink(schoolId: string, studentId: string, createdBy: string, suggestedAmount?: number) {
    const { data, error } = await supabase
      .from('payment_links')
      .insert({ school_id: schoolId, student_id: studentId, created_by: createdBy, amount_suggested: suggestedAmount })
      .select().single()
    return { data, error: error?.message }
  },
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export const expensesApi = {
  async list(schoolId: string, termId?: string) {
    let q = supabase
      .from('expenses')
      .select('*, category:expense_categories(*)')
      .eq('school_id', schoolId)
    if (termId) q = q.eq('term_id', termId)
    const { data, error } = await q.order('created_at', { ascending: false })
    return { data, error: error?.message }
  },

  async create(expense: {
    school_id: string; term_id: string; category_id: string
    description: string; amount: number; vendor?: string
    payment_method: string; payment_ref?: string; payment_date: string
    created_by: string
  }) {
    // Generate voucher number
    const { count } = await supabase
      .from('expenses').select('*', { count: 'exact', head: true }).eq('school_id', expense.school_id)
    const { data: school } = await supabase.from('schools').select('short_name').eq('id', expense.school_id).single()
    const seq = String((count || 0) + 1).padStart(3, '0')
    const year = new Date().getFullYear()
    const voucherNumber = `${(school as any)?.short_name || 'SCH'}/VCH/${year}/${seq}`

    const { data, error } = await supabase.from('expenses').insert({
      ...expense,
      voucher_number: voucherNumber,
      status: expense.amount >= 10000 ? 'pending_approval' : 'approved',
    }).select().single()
    return { data, error: error?.message }
  },

  async approve(id: string, approvedBy: string) {
    const { data, error } = await supabase
      .from('expenses').update({ status: 'approved', approved_by: approvedBy }).eq('id', id).select().single()
    return { data, error: error?.message }
  },

  async reject(id: string) {
    const { data, error } = await supabase
      .from('expenses').update({ status: 'rejected' }).eq('id', id).select().single()
    return { data, error: error?.message }
  },

  async listCategories(schoolId: string) {
    const { data, error } = await supabase
      .from('expense_categories').select('*').eq('school_id', schoolId).eq('is_active', true)
    return { data, error: error?.message }
  },

  async createCategory(schoolId: string, name: string, budget?: number) {
    const { data, error } = await supabase
      .from('expense_categories').insert({ school_id: schoolId, name, budget_per_term: budget }).select().single()
    return { data, error: error?.message }
  },
}

// ─── DISCOUNTS ────────────────────────────────────────────────────────────────
export const discountsApi = {
  async list(schoolId: string, termId?: string) {
    const { data, error } = await supabase
      .from('discounts').select('*, student:students(full_name,admission_number,grade:grades(name))')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
    return { data, error: error?.message }
  },

  async apply(discount: {
    school_id: string; student_id: string; invoice_id?: string
    type: string; name: string; percentage?: number
    fixed_amount?: number; applied_amount: number; notes?: string; approved_by: string
  }) {
    const { data, error } = await supabase.from('discounts').insert(discount).select().single()
    if (error) return { data: null, error: error.message }

    // Update invoice discount_amount and net_amount
    if (discount.invoice_id) {
      const { data: inv } = await supabase
        .from('invoices').select('subtotal,discount_amount,bursary_amount').eq('id', discount.invoice_id).single()
      if (inv) {
        const i = inv as any
        const newDiscount = discount.type === 'bursary' || discount.type === 'scholarship'
          ? i.bursary_amount : i.discount_amount + discount.applied_amount
        const field = discount.type === 'bursary' || discount.type === 'scholarship' ? 'bursary_amount' : 'discount_amount'
        const newNet = i.subtotal - i.discount_amount - i.bursary_amount - discount.applied_amount
        await supabase.from('invoices').update({ [field]: newDiscount, net_amount: Math.max(0, newNet) }).eq('id', discount.invoice_id)
      }
    }
    return { data, error: null }
  },

  async remove(id: string) {
    const { error } = await supabase.from('discounts').delete().eq('id', id)
    return { error: error?.message }
  },
}

// ─── INSTALMENT PLANS ─────────────────────────────────────────────────────────
export const instalmentApi = {
  async list(schoolId: string) {
    const { data, error } = await supabase
      .from('instalment_plans')
      .select(`*, student:students(full_name,admission_number,grade:grades(name)), invoice:invoices(invoice_number,net_amount), schedule:instalment_schedule(*)`)
      .eq('school_id', schoolId).eq('status', 'active')
    return { data, error: error?.message }
  },

  async create(plan: {
    school_id: string; student_id: string; invoice_id: string
    total_amount: number; approved_by: string; notes?: string
  }, schedule: { due_date: string; amount: number }[]) {
    const { data, error } = await supabase.from('instalment_plans').insert(plan).select().single()
    if (error || !data) return { data: null, error: error?.message }

    const scheduleRows = schedule.map(s => ({ plan_id: (data as any).id, ...s }))
    await supabase.from('instalment_schedule').insert(scheduleRows)

    return { data, error: null }
  },

  async markPaid(scheduleId: string, paymentId: string, amount: number) {
    const { data, error } = await supabase
      .from('instalment_schedule')
      .update({ is_paid: true, paid_amount: amount, payment_id: paymentId })
      .eq('id', scheduleId).select().single()
    return { data, error: error?.message }
  },
}

// ─── PETTY CASH ───────────────────────────────────────────────────────────────
export const pettyCashApi = {
  async list(schoolId: string) {
    const { data, error } = await supabase
      .from('petty_cash').select('*').eq('school_id', schoolId).order('given_date', { ascending: false })
    return { data, error: error?.message }
  },

  async issue(record: {
    school_id: string; imprest_holder: string; amount_given: number
    given_date: string; notes?: string
  }) {
    const { data, error } = await supabase.from('petty_cash').insert({ ...record, status: 'open' }).select().single()
    return { data, error: error?.message }
  },

  async account(id: string, amountAccounted: number) {
    const { data, error } = await supabase
      .from('petty_cash')
      .update({ amount_accounted: amountAccounted, accounted_date: new Date().toISOString().split('T')[0], status: 'accounted' })
      .eq('id', id).select().single()
    return { data, error: error?.message }
  },
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
export const auditApi = {
  async list(schoolId: string, filters?: { category?: string; dateFrom?: string; search?: string }) {
    let q = supabase
      .from('audit_logs').select('*').eq('school_id', schoolId)
    if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom)
    if (filters?.search) q = q.or(`user_name.ilike.%${filters.search}%,action.ilike.%${filters.search}%`)
    const { data, error } = await q.order('created_at', { ascending: false }).limit(200)
    return { data, error: error?.message }
  },

  async log(entry: {
    school_id: string; user_id: string; user_name: string
    action: string; entity_type: string; entity_id?: string
    old_values?: any; new_values?: any
  }) {
    await supabase.from('audit_logs').insert(entry)
  },
}

// ─── REPORTS / SUMMARIES ──────────────────────────────────────────────────────
export const reportsApi = {
  async termSummary(schoolId: string, termId: string) {
    const { data, error } = await supabase
      .from('term_collection_summary')
      .select('*').eq('school_id', schoolId).eq('term_id', termId).single()
    return { data, error: error?.message }
  },

  async dailyCollections(schoolId: string, termId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('payment_date,amount')
      .eq('school_id', schoolId)
      .eq('status', 'completed')
      .order('payment_date')
    return { data, error: error?.message }
  },

  async defaulters(schoolId: string, termId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`*, student:students(full_name,admission_number,grade:grades(name),stream:streams(name),student_guardians(guardian:guardians(full_name,phone)))`)
      .eq('school_id', schoolId).eq('term_id', termId)
      .in('status', ['unpaid', 'partial'])
      .gt('balance', 0)
      .order('balance', { ascending: false })
    return { data, error: error?.message }
  },
}

// ─── SMS ──────────────────────────────────────────────────────────────────────
export const smsApi = {
  async send(schoolId: string, phone: string, message: string, type: string) {
    // Calls Africa's Talking via edge function
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { school_id: schoolId, phone, message, type }
    })
    return { data, error: error?.message }
  },

  async sendBulk(schoolId: string, recipients: { phone: string; message: string }[], type: string) {
    const { data, error } = await supabase.functions.invoke('send-sms-bulk', {
      body: { school_id: schoolId, recipients, type }
    })
    return { data, error: error?.message }
  },
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  async updateProfile(schoolId: string, updates: {
    name?: string; phone?: string; email?: string
    address?: string; principal_name?: string
  }) {
    const { data, error } = await supabase.from('schools').update(updates).eq('id', schoolId).select().single()
    return { data, error: error?.message }
  },

  async updateSms(schoolId: string, senderId: string) {
    const { data, error } = await supabase
      .from('schools').update({ sms_sender_id: senderId }).eq('id', schoolId).select().single()
    return { data, error: error?.message }
  },
}
