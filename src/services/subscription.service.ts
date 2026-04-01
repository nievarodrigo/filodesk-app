import { SupabaseClient } from '@supabase/supabase-js'
import * as barbershopRepo from '@/repositories/barbershop.repository'
import * as checkoutIntentRepo from '@/repositories/checkout-intent.repository'
import { getSiteUrl } from '@/lib/vercel-url'
import * as galiopayService from '@/services/galiopay.service'

export const ALLOWED_MONTHS = [1, 3, 6, 12] as const
export const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.08, 6: 0.13, 12: 0.20 }

function isMonthAllowed(months: number): months is typeof ALLOWED_MONTHS[number] {
  return (ALLOWED_MONTHS as readonly number[]).includes(months)
}

export function calculateDiscountedMonthlyPrice(basePrice: number, months: number): number {
  return Math.round(basePrice * (1 - (DISCOUNTS[months] ?? 0)))
}

export function calculateSubscriptionTotal(basePrice: number, months: number): number {
  return calculateDiscountedMonthlyPrice(basePrice, months) * months
}

export function calculateRenewsAt(startDate: Date, months: number): string {
  return new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + months,
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
      startDate.getUTCSeconds(),
      startDate.getUTCMilliseconds()
    )
  ).toISOString()
}

async function getPlanData(supabase: SupabaseClient, planId: string) {
  const { data, error } = await supabase
    .from('plans')
    .select('id, price, name')
    .eq('id', planId)
    .eq('active', true)
    .single()
  
  if (error || !data) return null
  return data
}

export async function createMPSubscription(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  planId: string = 'base',
  payerEmail?: string,
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const plan = await getPlanData(supabase, planId)
  if (!plan) return { error: 'invalid_plan' as const }

  const siteUrl = getSiteUrl()
  const body = {
    reason: `FiloDesk — ${barbershop.name} (Plan ${plan.name})`,
    ...(payerEmail && { payer_email: payerEmail }),
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: plan.price,
      currency_id: 'ARS',
    },
    back_url: `${siteUrl}/suscripcion/exito?barbershopId=${barbershopId}`,
    external_reference: barbershopId,
  }

  console.log('[MP preapproval] request body:', JSON.stringify(body))

  const res = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[MP preapproval] API error:', JSON.stringify(data))
    return { error: 'mp_error' as const }
  }

  const isSandbox = process.env.MP_ACCESS_TOKEN?.startsWith('TEST-')
  const redirectUrl = isSandbox ? (data.sandbox_init_point ?? data.init_point) : data.init_point
  if (!redirectUrl) {
    console.error('[MP preapproval] no init_point in response:', JSON.stringify(data))
    return { error: 'mp_error' as const }
  }

  return { redirectUrl: redirectUrl as string }
}

export async function createMPCheckout(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  months = 1,
  planId: string = 'base'
) {
  if (!isMonthAllowed(months)) return { error: 'invalid_months' as const }
  
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const plan = await getPlanData(supabase, planId)
  if (!plan) return { error: 'invalid_plan' as const }

  const siteUrl = getSiteUrl()
  const totalPrice = calculateSubscriptionTotal(plan.price, months)
  const label = months === 1 ? '1 mes' : `${months} meses`

  const intentResult = await checkoutIntentRepo.create(supabase, {
    barbershop_id: barbershopId,
    months,
    expected_amount: totalPrice,
    plan_id: planId,
    currency_id: 'ARS',
  })

  if (intentResult.error) return { error: 'intent_creation_failed' as const }

  const intentId = intentResult.data.id
  const isSandbox = process.env.MP_ACCESS_TOKEN?.startsWith('TEST-')
  const baseUrl = siteUrl.includes('localhost') ? 'https://filodesk.app' : siteUrl

  const body = {
    items: [{
      title: `FiloDesk — ${barbershop.name} (${label})`,
      quantity: 1,
      unit_price: totalPrice,
      currency_id: 'ARS',
    }],
    back_urls: {
      success: `${baseUrl}/suscripcion/exito-pago?barbershopId=${barbershopId}`,
      failure: `${baseUrl}/suscripcion?barbershopId=${barbershopId}`,
      pending: `${baseUrl}/suscripcion?barbershopId=${barbershopId}`,
    },
    auto_return: 'approved',
    external_reference: `${barbershopId}:${intentId}`,
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok || (!data.init_point && !data.sandbox_init_point)) {
    await checkoutIntentRepo.markFailed(supabase, intentId)
    return { error: 'mp_error' as const }
  }

  const redirectUrl = isSandbox ? data.sandbox_init_point : data.init_point
  return { redirectUrl: redirectUrl as string }
}

export async function verifyCheckoutPayment(
  supabase: SupabaseClient,
  paymentId: string,
  intentId: string,
  barbershopId: string,
) {
  if (!paymentId || !intentId) return { error: 'missing_payment_or_intent_id' as const }

  try {
    const intentResult = await checkoutIntentRepo.findById(supabase, intentId)
    if (!intentResult) return { error: 'intent_not_found' as const }
    if (intentResult.barbershop_id !== barbershopId) return { error: 'barbershop_mismatch' as const }
    if (intentResult.status !== 'pending') return { error: 'already_completed' as const }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })

    if (!mpRes.ok) return { error: 'payment_not_found' as const }
    const payment = await mpRes.json()

    if (payment.status !== 'approved') return { error: 'payment_not_approved' as const }
    
    const expectedRef = `${barbershopId}:${intentId}`
    if (payment.external_reference !== expectedRef) return { error: 'external_ref_mismatch' as const }
    if (payment.transaction_amount !== intentResult.expected_amount) return { error: 'amount_mismatch' as const }
    if (payment.currency_id !== 'ARS') return { error: 'currency_mismatch' as const }

    const updateResult = await checkoutIntentRepo.markCompletedIfPending(supabase, intentId, paymentId)
    if (updateResult.error) return { error: 'already_completed' as const }

    return {
      ok: true,
      months: intentResult.months,
      amount: intentResult.expected_amount,
      planId: intentResult.plan_id ?? 'base',
    }
  } catch (err) {
    console.error('[MP verify] error:', err)
    return { error: 'verification_failed' as const }
  }
}

export async function activatePayment(
  supabase: SupabaseClient,
  barbershopId: string,
  months = 1,
  planId: string = 'base',
) {
  if (!isMonthAllowed(months)) return { error: 'invalid_months' as const }
  
  const plan = await getPlanData(supabase, planId)
  if (!plan) return { error: 'invalid_plan' as const }

  const now = new Date()
  const renewsAt = calculateRenewsAt(now, months)
  const amount = calculateDiscountedMonthlyPrice(plan.price, months)

  await barbershopRepo.updateSubscription(
    supabase, barbershopId, 'active', null,
    now.toISOString(), renewsAt, amount, 'checkout_pro', plan.name
  )
  return { ok: true }
}

async function getPlanByName(supabase: SupabaseClient, planName: string) {
  const { data, error } = await supabase
    .from('plans')
    .select('id, name')
    .eq('name', planName)
    .eq('active', true)
    .single()

  if (error || !data) return null
  return data
}

function extractPlanNameFromReason(reason: string | null | undefined) {
  if (!reason) return null

  const match = reason.match(/\(Plan ([^)]+)\)/i)
  return match?.[1] ?? null
}

export async function createBankTransfer(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  months = 1,
  planId: string = 'base'
) {
  if (!isMonthAllowed(months)) return { error: 'invalid_months' as const }
  
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const plan = await getPlanData(supabase, planId)
  if (!plan) return { error: 'invalid_plan' as const }

  const totalPrice = calculateSubscriptionTotal(plan.price, months)

  const { error } = await supabase.from('subscriptions').insert({
    barbershop_id: barbershopId,
    plan_id: planId,
    payment_method: 'bank_transfer',
    status: 'pending_validation',
    amount: totalPrice,
    ends_at: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
  })

  if (error) return { error: 'db_error' as const }

  // 2. Generamos el link de GalioPay real mediante su API
  const galioResult = await galiopayService.createPaymentLink({
    referenceId: barbershopId,
    amount: totalPrice,
    description: `Suscripción FiloDesk — Plan ${plan.name} (${months} ${months === 1 ? 'mes' : 'meses'})`,
  })

  if ('error' in galioResult) {
    console.error('[GalioPay] Error creating link:', galioResult.error)
    // Fallback al link genérico si la API falla
    return { redirectUrl: `https://admin-pay.galio.app/?amount=${totalPrice}&ref=${barbershopId}` }
  }

  return { redirectUrl: galioResult.paymentLink.url }
}

export async function processGalioPayWebhook(
  supabase: SupabaseClient,
  payload: {
    id: string
    status: string
    referenceId: string
    amount: number
    netAmount: number
    date: string
  }
) {
  const { referenceId, status, amount, date } = payload

  if (status !== 'approved') return { ok: true }

  // Buscar la suscripción pendiente para obtener el plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('barbershop_id', referenceId)
    .eq('status', 'pending_validation')
    .eq('payment_method', 'bank_transfer')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const planId = subscription?.plan_id ?? 'base'
  const plan = await getPlanData(supabase, planId)

  await barbershopRepo.updateSubscription(
    supabase,
    referenceId,
    'active',
    null,
    date,
    null,
    amount,
    'bank_transfer',
    plan?.name ?? null
  )

  // Marcar la suscripción como activa
  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('barbershop_id', referenceId)
    .eq('status', 'pending_validation')
    .eq('payment_method', 'bank_transfer')

  return { ok: true }
}

export async function processWebhook(
  supabase: SupabaseClient,
  subscriptionId: string
) {
  const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  const subscription = await mpRes.json()
  if (!mpRes.ok) return { error: 'mp_error' }

  const barbershopId = subscription.external_reference
  const status: 'active' | 'expired' = subscription.status === 'authorized' ? 'active' : 'expired'
  const startsAt = subscription.date_created ?? null
  const renewsAt = subscription.next_payment_date ?? null
  const amount = subscription.auto_recurring?.transaction_amount ?? null
  const paymentMethod = subscription.payment_method_id ?? null
  const extractedPlanName = extractPlanNameFromReason(subscription.reason)
  let planName: string | null = extractedPlanName

  if (!planName && subscription.preapproval_plan_id) {
    const planById = await getPlanData(supabase, subscription.preapproval_plan_id)
    planName = planById?.name ?? null
  } else if (planName) {
    const planByName = await getPlanByName(supabase, planName)
    planName = planByName?.name ?? planName
  }

  await barbershopRepo.updateSubscription(
    supabase,
    barbershopId,
    status,
    subscriptionId,
    startsAt,
    renewsAt,
    amount,
    paymentMethod,
    planName
  )
  return { ok: true }
}
