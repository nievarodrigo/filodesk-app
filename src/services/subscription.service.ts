import { SupabaseClient } from '@supabase/supabase-js'
import * as barbershopRepo from '@/repositories/barbershop.repository'

export async function createMPSubscription(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  userEmail: string
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const siteUrl = 'https://filodesk.app'

  const body = {
    reason: `FiloDesk — ${barbershop.name}`,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 11999,
      currency_id: 'ARS',
    },
    back_url: `${siteUrl}/suscripcion/exito?barbershopId=${barbershopId}`,
    payer_email: process.env.MP_TEST_PAYER_EMAIL || userEmail,
    external_reference: barbershopId,
  }

  const res = await fetch('https://api.mercadopago.com/preapproval', {
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

  await barbershopRepo.updateSubscription(supabase, barbershopId, status, subscriptionId)
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
  const results: { id: string; status: string }[] = data?.results ?? []
  const subscription = results.find(s => s.status === 'authorized') ?? results[0]
  if (!subscription) {
    console.error('[activateByBarbershopId] No subscription found for barbershopId:', barbershopId)
    return { error: 'not_found' }
  }

  console.log('[activateByBarbershopId] subscription id:', subscription.id, 'status:', subscription.status)

  const status: 'active' | 'expired' = subscription.status === 'authorized' ? 'active' : 'expired'
  const dbResult = await barbershopRepo.updateSubscription(supabase, barbershopId, status, subscription.id)
  console.log('[activateByBarbershopId] DB update result:', JSON.stringify(dbResult))
  return {}
}
