import type { Student, Invoice, Family } from '../types'

// ─── School-configurable discount tiers ───────────────────────────────────────
export interface SiblingDiscountConfig {
  // Discount % for the 2nd child in a family
  secondChild: number
  // Discount % for 3rd+ child in a family
  thirdChildPlus: number
  // Apply discount to: which votehead? 'tuition' | 'all'
  applyTo: 'tuition_only' | 'all'
  // Early payment discount % (if paid before fee_due_date)
  earlyPayment: number
}

// Default config (school can override in settings)
export const DEFAULT_DISCOUNT_CONFIG: SiblingDiscountConfig = {
  secondChild: 7.5,
  thirdChildPlus: 17.5,
  applyTo: 'tuition_only',
  earlyPayment: 3,
}

// ─── Calculate sibling discount for a student ─────────────────────────────────
export function calculateSiblingDiscount(
  student: Student,
  allFamilyStudents: Student[],   // all active students in same family
  invoiceSubtotal: number,
  tuitionAmount: number,
  config: SiblingDiscountConfig = DEFAULT_DISCOUNT_CONFIG
): {
  discountAmount: number
  discountPercent: number
  discountType: 'none' | 'sibling_2nd' | 'sibling_3rd_plus'
  description: string
} {
  if (!student.family_id || allFamilyStudents.length <= 1) {
    return { discountAmount: 0, discountPercent: 0, discountType: 'none', description: '' }
  }

  // Sort siblings by admission date to determine order
  const sorted = [...allFamilyStudents].sort(
    (a, b) => new Date(a.admission_date).getTime() - new Date(b.admission_date).getTime()
  )

  const childIndex = sorted.findIndex(s => s.id === student.id)

  if (childIndex <= 0) {
    // First/eldest child — no discount
    return { discountAmount: 0, discountPercent: 0, discountType: 'none', description: '' }
  }

  const isThirdPlus = childIndex >= 2
  const pct = isThirdPlus ? config.thirdChildPlus : config.secondChild
  const discountType = isThirdPlus ? 'sibling_3rd_plus' : 'sibling_2nd'

  const base = config.applyTo === 'tuition_only' ? tuitionAmount : invoiceSubtotal
  const discountAmount = Math.round((base * pct) / 100)

  return {
    discountAmount,
    discountPercent: pct,
    discountType,
    description: isThirdPlus
      ? `Sibling discount (3rd+ child) — ${pct}% off ${config.applyTo === 'tuition_only' ? 'tuition' : 'total fees'}`
      : `Sibling discount (2nd child) — ${pct}% off ${config.applyTo === 'tuition_only' ? 'tuition' : 'total fees'}`,
  }
}

// ─── Calculate early payment discount ────────────────────────────────────────
export function calculateEarlyPaymentDiscount(
  invoiceNetAmount: number,
  paymentDate: Date,
  feeDueDate: Date,
  config: SiblingDiscountConfig = DEFAULT_DISCOUNT_CONFIG
): {
  discountAmount: number
  discountPercent: number
  eligible: boolean
} {
  const eligible = paymentDate <= feeDueDate && config.earlyPayment > 0
  if (!eligible) return { discountAmount: 0, discountPercent: 0, eligible: false }

  const discountAmount = Math.round((invoiceNetAmount * config.earlyPayment) / 100)
  return { discountAmount, discountPercent: config.earlyPayment, eligible: true }
}

// ─── Apply all discounts to an invoice ───────────────────────────────────────
export function applyDiscountsToInvoice(
  invoice: Invoice,
  student: Student,
  allFamilyStudents: Student[],
  feeDueDate: Date,
  config: SiblingDiscountConfig = DEFAULT_DISCOUNT_CONFIG
): {
  siblingDiscount: ReturnType<typeof calculateSiblingDiscount>
  earlyDiscount: ReturnType<typeof calculateEarlyPaymentDiscount>
  totalDiscount: number
  finalAmount: number
} {
  const tuitionItem = invoice.items?.find(i => i.description.toLowerCase().includes('tuition'))
  const tuitionAmount = tuitionItem?.amount || 0

  const siblingDiscount = calculateSiblingDiscount(
    student, allFamilyStudents, invoice.subtotal, tuitionAmount, config
  )

  // Early discount applied on net after sibling
  const afterSibling = invoice.subtotal - siblingDiscount.discountAmount
  const earlyDiscount = calculateEarlyPaymentDiscount(
    afterSibling, new Date(), feeDueDate, config
  )

  const totalDiscount = siblingDiscount.discountAmount + earlyDiscount.discountAmount
  const finalAmount = invoice.subtotal - totalDiscount

  return { siblingDiscount, earlyDiscount, totalDiscount, finalAmount }
}

// ─── Discount summary component data ─────────────────────────────────────────
export interface DiscountSummary {
  label: string
  amount: number
  percent: number
  color: string
  badge: string
}

export function getDiscountSummaries(
  siblingDiscount: ReturnType<typeof calculateSiblingDiscount>,
  earlyDiscount: ReturnType<typeof calculateEarlyPaymentDiscount>
): DiscountSummary[] {
  const out: DiscountSummary[] = []

  if (siblingDiscount.discountAmount > 0) {
    out.push({
      label: siblingDiscount.description,
      amount: siblingDiscount.discountAmount,
      percent: siblingDiscount.discountPercent,
      color: 'var(--green)',
      badge: siblingDiscount.discountType === 'sibling_3rd_plus' ? '3rd+ Child' : '2nd Child',
    })
  }

  if (earlyDiscount.discountAmount > 0) {
    out.push({
      label: `Early payment discount — ${earlyDiscount.discountPercent}% off`,
      amount: earlyDiscount.discountAmount,
      percent: earlyDiscount.discountPercent,
      color: 'var(--blue)',
      badge: 'Early Bird',
    })
  }

  return out
}
