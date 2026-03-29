import { SupabaseClient } from '@supabase/supabase-js'
import * as barbershopRepo from '@/repositories/barbershop.repository'
import * as checkoutIntentRepo from '@/repositories/checkout-intent.repository'
import { getSiteUrl } from '@/lib/vercel-url'

const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.08, 6: 0.13, 12: 0.20 }

export async function createMPSubscription(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  planId: string = 'base'
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  // Obtener el precio del plan desde la DB
  const { data: plan } = await supabase.from('plans').select('price, name').eq('id', planId).single()
  const planPrice = plan?.price || 11999

  const siteUrl = getSiteUrl()

  const body = {
    reason: `FiloDesk — ${barbershop.name} (Plan ${plan?.name || 'Base'})`,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: planPrice,
      currency_id: 'ARS',
    },
    back_url: `${siteUrl}/suscripcion/exito?barbershopId=${barbershopId}`,
    external_reference: barbershopId,
  }

  const res = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok || !data.init_point) {
    console.error('[MP subscription]', data)
    return { error: 'mp_error' as const }
  }

  return { redirectUrl: data.init_point as string }
}

export async function createMPCheckout(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  months = 1,
  planId: string = 'base'
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  // Obtener el precio del plan
  const { data: plan } = await supabase.from('plans').select('price, name').eq('id', planId).single()
  const basePrice = plan?.price || 11999

  const siteUrl = getSiteUrl()
  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(basePrice * (1 - discount))
  const totalPrice = pricePerMonth * months
  const label = months === 1 ? '1 mes' : `${months} meses`

  // 1. Crear intención de checkout
  const intentResult = await checkoutIntentRepo.create(supabase, {
    barbershop_id: barbershopId,
    months,
    expected_amount: totalPrice,
    currency_id: 'ARS',
  })

  if (intentResult.error) {
    console.error('[MP checkout] failed to create intent:', intentResult.error)
    return { error: 'intent_creation_failed' as const }
  }

  const intentId = intentResult.data.id

  // 2. Crear checkout en MP con external_reference que incluye intent.id
  const externalRef = `${barbershopId}:${intentId}`
  const body = {
    items: [{
      title: `FiloDesk — ${barbershop.name} (${label})`,
      quantity: 1,
      unit_price: totalPrice,
      currency_id: 'ARS',
    }],
    back_urls: {
      success: `${siteUrl}/suscripcion/exito-pago?barbershopId=${barbershopId}`,
      failure: `${siteUrl}/suscripcion?barbershopId=${barbershopId}`,
      pending: `${siteUrl}/suscripcion?barbershopId=${barbershopId}`,
    },
    auto_return: 'approved',
    external_reference: externalRef,
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

  if (!res.ok || !data.init_point) {
    console.error('[MP checkout]', data)
    await checkoutIntentRepo.markFailed(supabase, intentId)
    return { error: 'mp_error' as const }
  }

  return { redirectUrl: data.init_point as string }
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

    return { ok: true, months: intentResult.months, amount: intentResult.expected_amount }
  } catch (err) {
    console.error('[MP verify] error:', err)
    return { error: 'verification_failed' as const }
  }
}

export async function activatePayment(
  supabase: SupabaseClient,
  barbershopId: string,
  months = 1,
) {
  const now = new Date()
  const renewsAt = new Date(now.getFullYear(), now.getMonth() + months, now.getDate()).toISOString()
  
  // Para pagos directos sin planId especificado (fallback), usamos Base
  const { data: plan } = await supabase.from('plans').select('price').eq('id', 'base').single()
  const basePrice = plan?.price || 11999
  const amount = Math.round(basePrice * (1 - (DISCOUNTS[months] ?? 0)))

  await barbershopRepo.updateSubscription(
    supabase, barbershopId, 'active', null,
    now.toISOString(), renewsAt, amount, 'checkout_pro'
  )
  return {}
}

export async function createBankTransfer(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  months = 1,
  planId: string = 'base'
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const { data: plan } = await supabase.from('plans').select('price').eq('id', planId).single()
  const basePrice = plan?.price || 11999

  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(basePrice * (1 - discount))
  const totalPrice = pricePerMonth * months

  const { error } = await supabase.from('subscriptions').insert({
    barbershop_id: barbershopId,
    plan_id: planId,
    payment_method: 'bank_transfer',
    status: 'pending_validation',
    amount: totalPrice,
    ends_at: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
  })

  if (error) {
    console.error('[Bank transfer] error creating sub:', error)
    return { error: 'db_error' as const }
  }

  return { redirectUrl: 'https://admin-pay.galio.app/' }
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

  await barbershopRepo.updateSubscription(supabase, barbershopId, status, subscriptionId, startsAt, renewsAt, amount, paymentMethod)
  return {}
}

export async function activateByBarbershopId(
  supabase: SupabaseClient,
  barbershopId: string
) {
  const mpRes = await fetch(
    `https://api.mercadopago.com/preapproval/search?external_reference=${barbershopId}`,
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
  )
  const data = await mpRes.json()
  const results: any[] = data?.results ?? []
  const subscription = results.find(s => s.status === 'authorized') ?? results[0]
  if (!subscription) return { error: 'not_found' }

  const status: 'active' | 'expired' = subscription.status === 'authorized' ? 'active' : 'expired'
  const startsAt = subscription.date_created ?? null
  const renewsAt = subscription.next_payment_date ?? null
  const amount = subscription.auto_recurring?.transaction_amount ?? null
  const paymentMethod = subscription.payment_method_id ?? null

  await barbershopRepo.updateSubscription(supabase, barbershopId, status, subscription.id, startsAt, renewsAt, amount, paymentMethod)
  return {}
}
