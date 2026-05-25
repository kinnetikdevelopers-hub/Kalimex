// ============================================================
// Supabase Edge Function: daraja-callback
// Deploy: supabase functions deploy daraja-callback
// URL: https://[project].supabase.co/functions/v1/daraja-callback
// This is the URL you register as your Daraja callback URL
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface DarajaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>
      }
    }
  }
}

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body: DarajaCallback
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { stkCallback } = body.Body
  const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback

  // ── Payment Failed ────────────────────────────────────────────────────────
  if (ResultCode !== 0) {
    // Update payment link status if exists
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('mpesa_checkout_id', CheckoutRequestID)

    console.log(`STK Push failed: ${stkCallback.ResultDesc}`)
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Extract metadata ──────────────────────────────────────────────────────
  const meta = CallbackMetadata?.Item || []
  const get = (name: string) => meta.find(i => i.Name === name)?.Value

  const mpesaCode = get('MpesaReceiptNumber') as string
  const amount = Number(get('Amount'))
  const phone = String(get('PhoneNumber'))
  const transactionDate = String(get('TransactionDate'))

  if (!mpesaCode || !amount) {
    console.error('Missing required metadata from Daraja callback')
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Find pending payment by checkout ID ───────────────────────────────────
  const { data: pendingPayment, error: findErr } = await supabase
    .from('payments')
    .select('*, students(*, grades(*)), invoices(*), schools(*)')
    .eq('mpesa_checkout_id', CheckoutRequestID)
    .eq('status', 'pending')
    .single()

  if (findErr || !pendingPayment) {
    console.error('Pending payment not found for CheckoutRequestID:', CheckoutRequestID)
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Generate receipt number ───────────────────────────────────────────────
  const school = pendingPayment.schools
  const shortName = school?.short_name || 'SCH'
  const year = new Date().getFullYear()

  // Get next receipt sequence
  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', pendingPayment.school_id)
    .eq('status', 'completed')

  const seq = String((count || 0) + 1).padStart(4, '0')
  const receiptNumber = `${shortName}/RCP/${year}/${seq}`

  // ── Update payment to completed ───────────────────────────────────────────
  const { error: payErr } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      mpesa_code: mpesaCode,
      mpesa_phone: phone,
      amount,
      receipt_number: receiptNumber,
      payment_date: new Date().toISOString(),
    })
    .eq('id', pendingPayment.id)

  if (payErr) {
    console.error('Failed to update payment:', payErr)
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Update invoice paid_amount and status ─────────────────────────────────
  if (pendingPayment.invoice_id) {
    const invoice = pendingPayment.invoices
    const newPaid = Number(invoice.paid_amount) + amount
    const newBalance = Number(invoice.net_amount) - newPaid
    const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

    await supabase
      .from('invoices')
      .update({
        paid_amount: newPaid,
        status: newStatus,
      })
      .eq('id', pendingPayment.invoice_id)
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    school_id: pendingPayment.school_id,
    user_name: 'M-Pesa Daraja',
    action: 'PAYMENT_RECEIVED',
    entity_type: 'payment',
    entity_id: pendingPayment.id,
    new_values: { amount, mpesaCode, phone, receiptNumber },
  })

  // ── Send SMS Receipt ──────────────────────────────────────────────────────
  const student = pendingPayment.students
  if (school?.sms_api_key && phone) {
    const smsBody = `Dear Parent, KES ${amount.toLocaleString()} received for ${student?.full_name}. Receipt: ${receiptNumber}. M-Pesa: ${mpesaCode}. Thank you. - ${school.name}`

    try {
      const smsRes = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': school.sms_api_key,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: 'sandbox', // change to your AT username in production
          to: `+254${phone.slice(-9)}`,
          message: smsBody,
          from: school.sms_sender_id || 'KALIMEX',
        }),
      })

      const smsData = await smsRes.json()

      await supabase.from('sms_logs').insert({
        school_id: pendingPayment.school_id,
        recipient_phone: phone,
        recipient_name: student?.full_name,
        message: smsBody,
        type: 'receipt',
        status: smsData.SMSMessageData?.Recipients?.[0]?.status === 'Success' ? 'sent' : 'failed',
        cost: smsData.SMSMessageData?.Recipients?.[0]?.cost || 0,
      })

      // Mark receipt as sent
      await supabase.from('payments').update({ receipt_sent: true }).eq('id', pendingPayment.id)
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr)
    }
  }

  console.log(`✓ Payment confirmed: ${receiptNumber} | ${mpesaCode} | KES ${amount} for ${student?.full_name}`)

  return new Response(
    JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
