import { SupabaseClient } from '@supabase/supabase-js'
import * as barbershopRepo from '@/repositories/barbershop.repository'
import * as checkoutIntentRepo from '@/repositories/checkout-intent.repository'
import { getSiteUrl } from '@/lib/vercel-url'

// Single source of truth for allowed months
export const ALLOWED_MONTHS = [1, 3, 6, 12] as const
const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.08, 6: 0.13, 12: 0.20 }

/**
 * Valida que los meses solicitados estén en la whitelist.
 */
function validateMonths(months: number) {
  if (!ALLOWED_MONTHS.includes(months as any)) {
    throw new Error('Cantidad de meses inválida')
  }
}

/**
 * Obtiene el precio de un plan desde la base de datos.
 * Evita el uso de constantes hardcodeadas (BASE_PRICE).
 */
async function getPlanPrice(supabase: SupabaseClient, planId: string) {
  const { data, error } = await supabase
    .from('plans')
    .select('price, name')
    .eq('id', planId)
    .single()
  
  if (error || !data) {
    console.error(`[Plans] Error fetching plan ${planId}:`, error)
    // Fallback de seguridad por si la tabla plans no está poblada correctamente
    return { price: 11999, name: 'Base' }
  }
  return data
}

export async function createMPSubscription(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  planId: string = 'base'
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const plan = await getPlanPrice(supabase, planId)
  const siteUrl = getSiteUrl()

  const body = {
    reason: `FiloDesk — ${barbershop.name} (Plan ${plan.name})`,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: plan.price,
      currency_id: 'ARS',
    },
    // IMPORTANTE: Ya no activamos en el back_url por seguridad (Issue High)
    back_url: `${siteUrl}/dashboard/${barbershopId}`,
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
  validateMonths(months)
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const plan = await getPlanPrice(supabase, planId)
  const siteUrl = getSiteUrl()
  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(plan.price * (1 - discount))
  const totalPrice = pricePerMonth * months
  const label = months === 1 ? '1 mes' : `${months} meses`

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
    
    // Idempotencia y correlación
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

/**
 * Activa un pago. 
 * Reemplaza el uso de constantes globales por valores persistidos o de DB.
 */
export async function activatePayment(
  supabase: SupabaseClient,
  barbershopId: string,
  months = 1,
) {
  validateMonths(months)
  const now = new Date()
  const renewsAt = new Date(now.getFullYear(), now.getMonth() + months, now.getDate()).toISOString()
  
  const plan = await getPlanPrice(supabase, 'base')
  const amount = Math.round(plan.price * (1 - (DISCOUNTS[months] ?? 0)))

  await barbershopRepo.updateSubscription(
    supabase, barbershopId, 'active', null,
    now.toISOString(), renewsAt, amount, 'checkout_pro'
  )
  return { ok: true }
}

export async function createBankTransfer(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  months = 1,
  planId: string = 'base'
) {
  validateMonths(months)
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const plan = await getPlanPrice(supabase, planId)
  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(plan.price * (1 - discount))
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
  return { ok: true }
}
