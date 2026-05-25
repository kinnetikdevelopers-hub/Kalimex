import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Payment, Invoice, Student, School } from '../types'

// ─── Color palette ────────────────────────────────────────────────────────────
const GREEN  = rgb(0.102, 0.478, 0.290)   // #1A7A4A
const INK    = rgb(0.051, 0.059, 0.055)   // #0D0F0E
const MUTED  = rgb(0.541, 0.569, 0.565)   // #8A9190
const LINE   = rgb(0.886, 0.906, 0.898)   // #E2E7E5
const WHITE  = rgb(1, 1, 1)
const SURFACE = rgb(0.957, 0.969, 0.961)  // #F4F7F5

function formatKES(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

function drawLine(page: any, y: number, x1 = 40, x2 = 555, color = LINE, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color })
}

export async function generateReceiptPDF(opts: {
  payment: Payment
  invoice: Invoice
  student: Student
  school: Partial<School>
}): Promise<Uint8Array> {
  const { payment, invoice, student, school } = opts

  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { height } = page.getSize()

  const boldFont   = await doc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await doc.embedFont(StandardFonts.Helvetica)
  const monoFont   = await doc.embedFont(StandardFonts.Courier)

  // ── Header bar ─────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 90, width: 595, height: 90, color: INK })

  // Logo hex shape (simple square stand-in)
  page.drawRectangle({ x: 40, y: height - 72, width: 36, height: 36, color: GREEN })
  page.drawText('K', { x: 51, y: height - 60, size: 20, font: boldFont, color: WHITE })

  // School name
  page.drawText(school.name || 'School Name', {
    x: 86, y: height - 52, size: 14, font: boldFont, color: WHITE,
  })
  page.drawText(school.address || '', {
    x: 86, y: height - 66, size: 9, font: regularFont, color: rgb(0.7, 0.75, 0.73),
  })

  // Receipt label (right)
  page.drawText('OFFICIAL RECEIPT', {
    x: 410, y: height - 48, size: 11, font: boldFont, color: GREEN,
  })
  page.drawText(`Powered by Kalimex`, {
    x: 410, y: height - 63, size: 8, font: regularFont, color: rgb(0.5, 0.55, 0.53),
  })

  let y = height - 110

  // ── Receipt meta row ───────────────────────────────────────────────────────
  page.drawRectangle({ x: 40, y: y - 46, width: 515, height: 54, color: SURFACE })

  const metaItems = [
    { label: 'Receipt No.', value: payment.receipt_number },
    { label: 'Date', value: new Date(payment.payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { label: 'Payment Method', value: payment.payment_method === 'mpesa_stk' || payment.payment_method === 'mpesa_paybill' ? 'M-Pesa' : payment.payment_method.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    { label: 'Academic Term', value: 'Term 2 2025' },
  ]

  metaItems.forEach((m, i) => {
    const colX = 48 + i * 130
    page.drawText(m.label, { x: colX, y: y - 18, size: 7.5, font: regularFont, color: MUTED })
    page.drawText(m.value, { x: colX, y: y - 32, size: 9, font: boldFont, color: INK })
  })

  y -= 66

  // ── Student info ───────────────────────────────────────────────────────────
  page.drawText('STUDENT DETAILS', { x: 40, y, size: 8, font: boldFont, color: MUTED })
  drawLine(page, y - 4)
  y -= 20

  const studentCols = [
    { label: 'Full Name', value: student.full_name },
    { label: 'Admission No.', value: student.admission_number },
    { label: 'Grade', value: `${student.grade?.name || ''} ${student.stream?.name || ''}`.trim() },
  ]
  studentCols.forEach((col, i) => {
    const colX = 40 + i * 175
    page.drawText(col.label, { x: colX, y, size: 8, font: regularFont, color: MUTED })
    page.drawText(col.value, { x: colX, y: y - 14, size: 10, font: boldFont, color: INK })
  })

  y -= 36

  // ── M-Pesa info if applicable ──────────────────────────────────────────────
  if (payment.mpesa_code) {
    page.drawRectangle({ x: 40, y: y - 28, width: 515, height: 36, color: rgb(0.91, 0.97, 0.94) })
    page.drawText('M-PESA TRANSACTION', { x: 52, y: y - 10, size: 8, font: boldFont, color: GREEN })
    page.drawText(`Code: ${payment.mpesa_code}`, { x: 52, y: y - 22, size: 9.5, font: monoFont, color: INK })
    if (payment.mpesa_phone) {
      page.drawText(`Phone: ${payment.mpesa_phone}`, { x: 240, y: y - 22, size: 9.5, font: monoFont, color: INK })
    }
    y -= 48
  }

  y -= 10

  // ── Invoice breakdown ──────────────────────────────────────────────────────
  page.drawText('FEE BREAKDOWN', { x: 40, y, size: 8, font: boldFont, color: MUTED })
  drawLine(page, y - 4)
  y -= 18

  // Table header
  page.drawRectangle({ x: 40, y: y - 16, width: 515, height: 22, color: INK })
  page.drawText('VOTEHEAD', { x: 50, y: y - 10, size: 8, font: boldFont, color: WHITE })
  page.drawText('AMOUNT', { x: 460, y: y - 10, size: 8, font: boldFont, color: WHITE })
  y -= 22

  // Table rows
  const items = invoice.items || []
  items.forEach((item, i) => {
    const rowBg = i % 2 === 0 ? WHITE : SURFACE
    page.drawRectangle({ x: 40, y: y - 18, width: 515, height: 22, color: rowBg })
    page.drawText(item.description, { x: 50, y: y - 10, size: 9, font: regularFont, color: INK })
    const amtStr = formatKES(item.amount)
    const amtWidth = boldFont.widthOfTextAtSize(amtStr, 9)
    page.drawText(amtStr, { x: 555 - amtWidth, y: y - 10, size: 9, font: boldFont, color: INK })
    y -= 22
  })

  y -= 4
  drawLine(page, y)
  y -= 12

  // Subtotals
  const totRows: { label: string; value: string; bold?: boolean; color?: any }[] = []
  totRows.push({ label: 'Subtotal', value: formatKES(invoice.subtotal) })
  if (invoice.discount_amount > 0) {
    totRows.push({ label: 'Sibling / Early Payment Discount', value: `− ${formatKES(invoice.discount_amount)}`, color: GREEN })
  }
  if (invoice.bursary_amount > 0) {
    totRows.push({ label: 'Bursary / Scholarship', value: `− ${formatKES(invoice.bursary_amount)}`, color: rgb(0.15, 0.39, 0.93) })
  }
  totRows.push({ label: 'Net Payable', value: formatKES(invoice.net_amount), bold: true })
  totRows.push({ label: 'Amount Paid (This Receipt)', value: formatKES(payment.amount), bold: true, color: GREEN })
  totRows.push({ label: 'Outstanding Balance', value: formatKES(invoice.balance), bold: true, color: invoice.balance > 0 ? rgb(0.86, 0.15, 0.15) : GREEN })

  totRows.forEach(row => {
    const labelFont = row.bold ? boldFont : regularFont
    const valFont = row.bold ? boldFont : monoFont
    const color = row.color || (row.bold ? INK : MUTED)
    const valStr = row.value
    const valWidth = valFont.widthOfTextAtSize(valStr, row.bold ? 10 : 9)
    page.drawText(row.label, { x: 50, y, size: row.bold ? 10 : 9, font: labelFont, color })
    page.drawText(valStr, { x: 555 - valWidth, y, size: row.bold ? 10 : 9, font: valFont, color })
    y -= row.bold ? 18 : 15
  })

  y -= 14

  // ── Paid in Full stamp ────────────────────────────────────────────────────
  if (invoice.balance === 0) {
    page.drawRectangle({ x: 380, y: y - 10, width: 175, height: 30, color: rgb(0.91, 0.97, 0.94) })
    page.drawRectangle({ x: 380, y: y - 10, width: 175, height: 30, color: rgb(0.91, 0.97, 0.94) })
    page.drawText('✓  PAID IN FULL', { x: 400, y: y, size: 11, font: boldFont, color: GREEN })
  }

  y -= 30
  drawLine(page, y)
  y -= 18

  // ── Notes / Terms ─────────────────────────────────────────────────────────
  page.drawText('This is an official receipt issued by ' + (school.name || 'the school') + '. Please retain for your records.', {
    x: 40, y, size: 8, font: regularFont, color: MUTED,
  })
  y -= 13
  page.drawText('For queries contact: ' + (school.phone || '') + ' · ' + (school.email || ''), {
    x: 40, y, size: 8, font: regularFont, color: MUTED,
  })

  // ── Footer bar ─────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 36, color: SURFACE })
  page.drawText('Powered by Kalimex · Kenya School Finance Platform · kalimex.co.ke', {
    x: 40, y: 12, size: 8, font: regularFont, color: MUTED,
  })
  const rnWidth = monoFont.widthOfTextAtSize(payment.receipt_number, 8)
  page.drawText(payment.receipt_number, {
    x: 555 - rnWidth, y: 12, size: 8, font: monoFont, color: GREEN,
  })

  return doc.save()
}

// ─── Helper: trigger browser download of PDF ─────────────────────────────────
export function downloadPDF(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
