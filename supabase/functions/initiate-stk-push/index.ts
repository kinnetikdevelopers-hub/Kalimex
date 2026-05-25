// ============================================================
// Supabase Edge Function: initiate-stk-push
// Called by the frontend when a bursar sends a payment link
// or when a parent clicks "Pay Now"
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface STKRequest {
  school_id: string
  student_id: string
  invoice_id?: string
  phone: string       // e.g. "0712345678"
  amount: number
  created_by?: string // staff user id
}

async function getDarajaToken(consumerKey: string, consumerSecret: string, env: string): Promise<string> {
  const baseUrl = env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

  const credentials = btoa(`${consumerKey}:${consumerSecret}`)
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  })
  const data = await res.json()
  return data.access_token
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Auth check: must be authenticated school staff
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: STKRequest
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { school_id, student_id, invoice_id, phone, amount, created_by } = body

  // ── Get school Daraja config ──────────────────────────────────────────────
  const { data: school } = await supabase
    .from('schools')
    .select('daraja_consumer_key, daraja_consumer_secret, daraja_paybill, daraja_passkey, daraja_env, short_name')
    .eq('id', school_id)
    .single()

  if (!school?.daraja_consumer_key) {
    return new Response(JSON.stringify({ error: 'Daraja not configured for this school' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Get Daraja access token ───────────────────────────────────────────────
  let accessToken: string
  try {
    accessToken = await getDarajaToken(school.daraja_consumer_key, school.daraja_consumer_secret, school.daraja_env)
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to get Daraja token' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Build STK Push payload ────────────────────────────────────────────────
  const baseUrl = school.daraja_env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  const password = btoa(`${school.daraja_paybill}${school.daraja_passkey}${timestamp}`)

  // Normalize phone: must be 2547XXXXXXXX
  let normalizedPhone = phone.replace(/\s/g, '')
  if (normalizedPhone.startsWith('0')) normalizedPhone = '254' + normalizedPhone.slice(1)
  if (normalizedPhone.startsWith('+')) normalizedPhone = normalizedPhone.slice(1)

  // Create a receipt number placeholder for this pending payment
  const shortName = school.short_name || 'SCH'
  const year = new Date().getFullYear()
  const pendingRef = `${shortName}/STK/${Date.now()}`

  // ── Insert pending payment record first ───────────────────────────────────
  const { data: pendingPayment, error: insertErr } = await supabase
    .from('payments')
    .insert({
      school_id,
      student_id,
      invoice_id,
      receipt_number: pendingRef,
      payment_method: 'mpesa_stk',
      amount,
      mpesa_phone: normalizedPhone,
      status: 'pending',
      received_by: created_by,
    })
    .select()
    .single()

  if (insertErr) {
    return new Response(JSON.stringify({ error: 'Failed to create pending payment' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Fire STK Push ─────────────────────────────────────────────────────────
  const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/daraja-callback`

  const stkPayload = {
    BusinessShortCode: school.daraja_paybill,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: normalizedPhone,
    PartyB: school.daraja_paybill,
    PhoneNumber: normalizedPhone,
    CallBackURL: callbackUrl,
    AccountReference: student_id.slice(0, 12), // admission number ideally
    TransactionDesc: `School fees payment`,
  }

  let stkResponse: any
  try {
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    })
    stkResponse = await stkRes.json()
  } catch (err) {
    // Cleanup pending payment
    await supabase.from('payments').delete().eq('id', pendingPayment.id)
    return new Response(JSON.stringify({ error: 'STK Push request failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  if (stkResponse.ResponseCode !== '0') {
    await supabase.from('payments').delete().eq('id', pendingPayment.id)
    return new Response(JSON.stringify({ error: stkResponse.errorMessage || 'STK Push rejected' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  // ── Save CheckoutRequestID so callback can find this payment ──────────────
  await supabase
    .from('payments')
    .update({ mpesa_checkout_id: stkResponse.CheckoutRequestID })
    .eq('id', pendingPayment.id)

  return new Response(JSON.stringify({
    success: true,
    checkout_request_id: stkResponse.CheckoutRequestID,
    merchant_request_id: stkResponse.MerchantRequestID,
    payment_id: pendingPayment.id,
    message: 'STK Push sent. Waiting for customer PIN entry.',
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
