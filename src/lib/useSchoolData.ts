import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import * as DEMO from './mockData'
import type { Student, Invoice, Payment, Grade, Stream, Votehead, Term, School, Guardian } from '../types'

const isDemo = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
  return !url || url.includes('placeholder') || url.includes('your-project')
}

// ─── Generic fetcher with demo fallback ──────────────────────────────────────
async function fetchOrDemo<T>(
  supabaseQuery: () => Promise<{ data: T | null; error: any }>,
  demoData: T
): Promise<T> {
  if (isDemo()) return demoData
  const { data, error } = await supabaseQuery()
  if (error || !data) {
    console.warn('[Kalimex] Supabase error, using demo data:', error?.message)
    return demoData
  }
  return data
}

// ─── Students hook ────────────────────────────────────────────────────────────
export function useStudents(schoolId: string) {
  const [students, setStudents] = useState<Student[]>(DEMO.DEMO_STUDENTS)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchOrDemo(
      async () => supabase
        .from('students')
        .select('*, grade:grades(id,name,code), stream:streams(id,name)')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('full_name'),
      DEMO.DEMO_STUDENTS
    )
    setStudents(data as Student[])
    setLoading(false)
  }, [schoolId])

  useEffect(() => { reload() }, [reload])

  const addStudent = async (student: {
    full_name: string; admission_number: string; grade_id: string
    stream_id?: string; gender?: string; date_of_birth?: string
    guardian_name?: string; guardian_phone?: string
    guardian_email?: string; guardian_relationship?: string
    family_id?: string
  }) => {
    if (isDemo()) {
      // Demo: add to local state
      const grade = DEMO.DEMO_GRADES.find(g => g.id === student.grade_id)
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        school_id: schoolId,
        admission_number: student.admission_number,
        full_name: student.full_name,
        grade_id: student.grade_id,
        grade,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active',
        created_at: new Date().toISOString(),
        family_id: student.family_id,
      }
      setStudents(prev => [...prev, newStudent])
      return { data: newStudent, error: null }
    }

    // Real Supabase
    const { data, error } = await supabase.from('students').insert({
      school_id: schoolId,
      full_name: student.full_name,
      admission_number: student.admission_number,
      grade_id: student.grade_id,
      stream_id: student.stream_id,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      admission_date: new Date().toISOString().split('T')[0],
      status: 'active',
    }).select('*, grade:grades(id,name,code), stream:streams(id,name)').single()

    if (error) return { data: null, error: error.message }

    // Add guardian if provided
    if (student.guardian_phone || student.guardian_name) {
      const { data: guardian } = await supabase.from('guardians').insert({
        school_id: schoolId,
        full_name: student.guardian_name || 'Guardian',
        phone: student.guardian_phone || '',
        email: student.guardian_email,
        relationship: student.guardian_relationship || 'Parent',
        is_primary: true,
        is_fee_responsible: true,
      }).select().single()

      if (guardian) {
        await supabase.from('student_guardians').insert({
          student_id: (data as any).id,
          guardian_id: (guardian as any).id,
          is_primary: true,
        })
      }
    }

    await reload()
    return { data, error: null }
  }

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    if (isDemo()) {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
      return { error: null }
    }
    const { error } = await supabase.from('students').update(updates).eq('id', id)
    if (!error) await reload()
    return { error: error?.message }
  }

  return { students, loading, reload, addStudent, updateStudent }
}

// ─── Invoices hook ────────────────────────────────────────────────────────────
export function useInvoices(schoolId: string, termId = 'term-2') {
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO.DEMO_INVOICES)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchOrDemo(
      async () => supabase
        .from('invoices')
        .select('*, student:students(id,full_name,admission_number,grade:grades(name),stream:streams(name)), items:invoice_items(*, votehead:voteheads(name)), term:terms(name)')
        .eq('school_id', schoolId)
        .eq('term_id', termId)
        .order('created_at', { ascending: false }),
      DEMO.DEMO_INVOICES
    )
    setInvoices(data as Invoice[])
    setLoading(false)
  }, [schoolId, termId])

  useEffect(() => { reload() }, [reload])

  return { invoices, loading, reload }
}

// ─── Payments hook ────────────────────────────────────────────────────────────
export function usePayments(schoolId: string) {
  const [payments, setPayments] = useState<Payment[]>(DEMO.DEMO_PAYMENTS)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchOrDemo(
      async () => supabase
        .from('payments')
        .select('*, student:students(id,full_name,admission_number,grade:grades(name))')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(100),
      DEMO.DEMO_PAYMENTS
    )
    setPayments(data as Payment[])
    setLoading(false)
  }, [schoolId])

  useEffect(() => { reload() }, [reload])

  const recordPayment = async (payment: {
    student_id: string; invoice_id?: string; payment_method: string
    amount: number; mpesa_code?: string; cheque_number?: string
    bank_ref?: string; notes?: string; received_by: string
  }) => {
    if (isDemo()) {
      const student = DEMO.DEMO_STUDENTS.find(s => s.id === payment.student_id)
      const seq = String(DEMO.DEMO_PAYMENTS.length + 1).padStart(4, '0')
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        school_id: schoolId,
        student_id: payment.student_id,
        invoice_id: payment.invoice_id,
        student,
        receipt_number: `GVA/RCP/2025/${seq}`,
        payment_method: payment.payment_method as any,
        amount: payment.amount,
        mpesa_code: payment.mpesa_code,
        payment_date: new Date().toISOString(),
        status: 'completed',
        receipt_sent: false,
        created_at: new Date().toISOString(),
      }
      setPayments(prev => [newPayment, ...prev])
      return { data: newPayment, error: null }
    }

    // Real Supabase — get receipt number
    const { count } = await supabase
      .from('payments').select('*', { count: 'exact', head: true }).eq('school_id', schoolId)
    const seq = String((count || 0) + 1).padStart(4, '0')
    const receiptNumber = `GVA/RCP/${new Date().getFullYear()}/${seq}`

    const { data, error } = await supabase.from('payments').insert({
      ...payment, school_id: schoolId,
      receipt_number: receiptNumber,
      payment_date: new Date().toISOString(),
      status: 'completed',
    }).select('*, student:students(id,full_name,admission_number)').single()

    if (error) return { data: null, error: error.message }

    // Update invoice
    if (payment.invoice_id) {
      const { data: inv } = await supabase.from('invoices').select('paid_amount,net_amount').eq('id', payment.invoice_id).single()
      if (inv) {
        const i = inv as any
        const newPaid = i.paid_amount + payment.amount
        const status = newPaid >= i.net_amount ? 'paid' : 'partial'
        await supabase.from('invoices').update({ paid_amount: newPaid, status }).eq('id', payment.invoice_id)
      }
    }

    await reload()
    return { data, error: null }
  }

  return { payments, loading, reload, recordPayment }
}

// ─── Grades hook ─────────────────────────────────────────────────────────────
export function useGrades(schoolId: string) {
  const [grades, setGrades] = useState<Grade[]>(DEMO.DEMO_GRADES)

  useEffect(() => {
    if (isDemo()) return
    supabase.from('grades').select('*').eq('school_id', schoolId).order('sort_order')
      .then(({ data }) => { if (data) setGrades(data as Grade[]) })
  }, [schoolId])

  return { grades }
}

// ─── School hook ──────────────────────────────────────────────────────────────
export function useSchool(schoolId: string) {
  const [school, setSchool] = useState<School>(DEMO.DEMO_SCHOOL)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (isDemo()) return
    setLoading(true)
    const { data } = await supabase.from('schools').select('*').eq('id', schoolId).single()
    if (data) setSchool(data as School)
    setLoading(false)
  }, [schoolId])

  useEffect(() => { reload() }, [reload])

  const updateSchool = async (updates: Partial<School>) => {
    if (isDemo()) { setSchool(prev => ({ ...prev, ...updates })); return { error: null } }
    const { error } = await supabase.from('schools').update(updates).eq('id', schoolId)
    if (!error) await reload()
    return { error: error?.message }
  }

  return { school, loading, updateSchool }
}

// ─── All schools hook (super admin) ──────────────────────────────────────────
export function useAllSchools() {
  const [schools, setSchools] = useState<School[]>([DEMO.DEMO_SCHOOL])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchOrDemo(
      async () => supabase.from('schools').select('*').order('name'),
      [DEMO.DEMO_SCHOOL]
    )
    setSchools(data as School[])
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const addSchool = async (school: {
    name: string; short_name?: string; county: string
    phone: string; email: string; principal_name?: string
    subscription_tier: string; address?: string
  }) => {
    if (isDemo()) {
      const newSchool = { ...DEMO.DEMO_SCHOOL, ...school, id: `sch-${Date.now()}`, subscription_status: 'trial', daraja_configured: false, sms_configured: false, created_at: new Date().toISOString(), is_active: true }
      setSchools(prev => [...prev, newSchool as unknown as School])
      return { data: newSchool, error: null }
    }
    const { data, error } = await supabase.from('schools').insert({
      ...school,
      subscription_status: 'trial',
      subscription_start: new Date().toISOString().split('T')[0],
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_students: school.subscription_tier === 'starter' ? 150 : school.subscription_tier === 'growth' ? 500 : 1000,
      daraja_env: 'sandbox',
      daraja_configured: false,
      sms_configured: false,
      is_active: true,
    }).select().single()

    if (!error) await reload()
    return { data, error: error?.message }
  }

  return { schools, loading, reload, addSchool }
}
