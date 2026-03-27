import { SupabaseClient } from '@supabase/supabase-js'
import * as barbershopRepo from '@/repositories/barbershop.repository'

export async function createMPSubscription(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const siteUrl = 'https://filodesk.app'

  // Usamos /preapproval_plan en vez de /preapproval
  // Con plan, el usuario ingresa su propio email de MP en el checkout
  // No se requiere payer_email — cualquiera puede suscribirse
  const body = {
    reason: `FiloDesk — ${barbershop.name}`,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 11999,
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

const BASE_PRICE = 11999
const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.08, 6: 0.13, 12: 0.20 }

export async function createMPCheckout(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  months = 1,
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const siteUrl = 'https://filodesk.app'
  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(BASE_PRICE * (1 - discount))
  const totalPrice = pricePerMonth * months
  const label = months === 1 ? '1 mes' : `${months} meses`

  // Checkout Pro: pago único — acepta todos los medios de pago
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
    external_reference: barbershopId,
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
    return { error: 'mp_error' as const }
  }

  return { redirectUrl: data.init_point as string }
}

export async function activateOneMonthPayment(
  supabase: SupabaseClient,
  barbershopId: string,
) {
  const now = new Date()
  const renewsAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()

  await barbershopRepo.updateSubscription(
    supabase, barbershopId, 'active', null,
    now.toISOString(), renewsAt, 11999, 'checkout_pro'
  )
  return {}
}

export async function processWebhook(
  supabase: SupabaseClient,
  subscriptionId: string
) {
  const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  const subscription = await mpRes.json()

  if (!mpRes.ok) {
    console.error('[MP webhook] error fetching subscription', subscription)
    return { error: 'mp_error' }
  }

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
  // Buscamos sin filtrar por status para ver qué devuelve MP en sandbox
  const mpRes = await fetch(
    `https://api.mercadopago.com/preapproval/search?external_reference=${barbershopId}`,
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
  )
  const data = await mpRes.json()
  console.log('[activateByBarbershopId] MP search response:', JSON.stringify(data))

  // Preferimos la más reciente con status authorized; si no hay, la más reciente
  const results: { id: string; status: string; date_created?: string; next_payment_date?: string }[] = data?.results ?? []
  const subscription = results.find(s => s.status === 'authorized') ?? results[0]
  if (!subscription) {
    console.error('[activateByBarbershopId] No subscription found for barbershopId:', barbershopId)
    return { error: 'not_found' }
  }

  console.log('[activateByBarbershopId] subscription id:', subscription.id, 'status:', subscription.status)

  const status: 'active' | 'expired' = subscription.status === 'authorized' ? 'active' : 'expired'
  const startsAt = subscription.date_created ?? null
  const renewsAt = subscription.next_payment_date ?? null
  const amount = (subscription as any).auto_recurring?.transaction_amount ?? null
  const paymentMethod = (subscription as any).payment_method_id ?? null
  const dbResult = await barbershopRepo.updateSubscription(supabase, barbershopId, status, subscription.id, startsAt, renewsAt, amount, paymentMethod)
  console.log('[activateByBarbershopId] DB update result:', JSON.stringify(dbResult))
  return {}
}
