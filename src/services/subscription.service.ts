import { SupabaseClient } from '@supabase/supabase-js'
import * as barbershopRepo from '@/repositories/barbershop.repository'
import * as checkoutIntentRepo from '@/repositories/checkout-intent.repository'

export async function createMPSubscription(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://filodesk.app'

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

const BASE_PRICE = 11999 // En pesos ARS
const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.08, 6: 0.13, 12: 0.20 }

export async function createMPCheckout(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  months = 1,
) {
  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, userId)
  if (!barbershop) return { error: 'not_found' as const }

  const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://filodesk.app'
  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(BASE_PRICE * (1 - discount))
  const totalPrice = pricePerMonth * months
  const label = months === 1 ? '1 mes' : `${months} meses`

  // 1. Crear intención de checkout con intent.id como correlator primario
  const intentResult = await checkoutIntentRepo.create(supabase, {
    barbershop_id: barbershopId,
    months,
    expected_amount: totalPrice, // En pesos ARS
    currency_id: 'ARS',
  })

  if (intentResult.error) {
    console.error('[MP checkout] failed to create intent:', intentResult.error)
    return { error: 'intent_creation_failed' as const }
  }

  const intentId = intentResult.data.id

  // 2. Crear checkout en MP con external_reference que incluye intent.id
  // Formato: "barbershopId:intentId" — permite correlacionar el pago con nuestra intención
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

/**
 * Verifica que el pago llegó a MercadoPago y que coincide con la intención.
 * SECURITY: Función crítica — evita bypass, replay y doble activación.
 *
 * Flujo:
 * 1. Busca intent por intentId (correlator primario)
 * 2. Valida que está pending
 * 3. Consulta MP con payment_id
 * 4. Valida status, external_reference, transaction_amount, currency_id
 * 5. Marca como completed de forma atómica (UPDATE WHERE status='pending')
 * 6. Si ya estaba completado, rechaza (idempotente)
 */
export async function verifyCheckoutPayment(
  supabase: SupabaseClient,
  paymentId: string,
  intentId: string,
  barbershopId: string,
) {
  if (!paymentId || !intentId) {
    return { error: 'missing_payment_or_intent_id' as const }
  }

  try {
    // 1. Buscar la intención por intentId (no por paymentId — ese es el correlator secundario)
    const intentResult = await checkoutIntentRepo.findById(supabase, intentId)
    if (!intentResult) {
      console.warn('[MP verify] no checkout intent found for intentId:', intentId)
      return { error: 'intent_not_found' as const }
    }

    // 2. Verificar que la intención es para esta barbería
    if (intentResult.barbershop_id !== barbershopId) {
      console.error('[MP verify] barbershopId mismatch:', intentResult.barbershop_id, 'vs', barbershopId)
      return { error: 'barbershop_mismatch' as const }
    }

    // 3. Verificar que la intención aún está pending (si no, ya fue procesada)
    if (intentResult.status !== 'pending') {
      console.warn('[MP verify] checkout intent already processed:', intentResult.status)
      return { error: 'already_completed' as const }
    }

    // 4. Consultar el pago real contra MP API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })

    if (!mpRes.ok) {
      console.error('[MP verify] payment not found in MP:', paymentId)
      return { error: 'payment_not_found' as const }
    }

    const payment = await mpRes.json()

    // 5. Validar que el pago fue aprobado
    if (payment.status !== 'approved') {
      console.error('[MP verify] payment not approved:', payment.status)
      return { error: 'payment_not_approved' as const }
    }

    // 6. Validar external_reference (debe ser "barbershopId:intentId")
    const expectedRef = `${barbershopId}:${intentId}`
    if (payment.external_reference !== expectedRef) {
      console.error('[MP verify] external_reference mismatch:', payment.external_reference, 'vs expected', expectedRef)
      return { error: 'external_ref_mismatch' as const }
    }

    // 7. Validar transaction_amount (en pesos ARS)
    // MP devuelve en la misma unidad que enviamos
    if (payment.transaction_amount !== intentResult.expected_amount) {
      console.error('[MP verify] amount mismatch:', payment.transaction_amount, 'vs expected', intentResult.expected_amount)
      return { error: 'amount_mismatch' as const }
    }

    // 8. Validar currency_id
    if (payment.currency_id !== 'ARS') {
      console.error('[MP verify] wrong currency:', payment.currency_id)
      return { error: 'currency_mismatch' as const }
    }

    // 9. Marcar como completado de forma ATÓMICA (solo si aún está pending)
    // Esto garantiza one-time use: si llega 2x el mismo paymentId, la segunda falla
    console.log('[MP verify] ===== STARTING markCompletedIfPending =====')
    console.log('[MP verify] intentId:', intentId, '| paymentId:', paymentId)
    const updateResult = await checkoutIntentRepo.markCompletedIfPending(
      supabase,
      intentId,
      paymentId
    )
    console.log('[MP verify] ===== UPDATE RESULT =====')
    console.log('[MP verify] error:', updateResult.error)
    console.log('[MP verify] data:', updateResult.data)

    // Verificar que se actualizó exactamente 1 fila
    // .single() lanza error si no hay exactamente 1 fila actualizada
    if (updateResult.error) {
      console.warn('[MP verify] failed to mark as completed:', updateResult.error.message)
      return { error: 'already_completed' as const }
    }

    if (!updateResult.data) {
      console.warn('[MP verify] no data returned from update (unexpected)')
      return { error: 'update_failed' as const }
    }

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
  const amount = Math.round(BASE_PRICE * (1 - (DISCOUNTS[months] ?? 0)))

  await barbershopRepo.updateSubscription(
    supabase, barbershopId, 'active', null,
    now.toISOString(), renewsAt, amount, 'checkout_pro'
  )
  return {}
}

// Deprecated: use activatePayment instead
export async function activateOneMonthPayment(
  supabase: SupabaseClient,
  barbershopId: string,
) {
  return activatePayment(supabase, barbershopId, 1)
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
  const amount = (subscription as unknown as { auto_recurring?: { transaction_amount?: number } }).auto_recurring?.transaction_amount ?? null
  const paymentMethod = (subscription as unknown as { payment_method_id?: string }).payment_method_id ?? null
  const dbResult = await barbershopRepo.updateSubscription(supabase, barbershopId, status, subscription.id, startsAt, renewsAt, amount, paymentMethod)
  console.log('[activateByBarbershopId] DB update result:', JSON.stringify(dbResult))
  return {}
}
