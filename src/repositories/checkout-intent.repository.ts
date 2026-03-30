import { SupabaseClient } from '@supabase/supabase-js'

export async function create(
  supabase: SupabaseClient,
  data: {
    barbershop_id: string
    months: number
    expected_amount: number
    plan_id: string
    currency_id?: string
  }
) {
  return supabase
    .from('checkout_intents')
    .insert({
      ...data,
      currency_id: data.currency_id || 'ARS',
      status: 'pending',
    })
    .select('id')
    .single()
}

export async function findById(
  supabase: SupabaseClient,
  intentId: string
) {
  const { data } = await supabase
    .from('checkout_intents')
    .select('*')
    .eq('id', intentId)
    .single()
  return data
}

export async function findByPaymentId(
  supabase: SupabaseClient,
  paymentId: string
) {
  const { data } = await supabase
    .from('checkout_intents')
    .select('*')
    .eq('payment_id', paymentId)
    .single()
  return data
}

export async function updatePaymentId(
  supabase: SupabaseClient,
  checkoutIntentId: string,
  paymentId: string
) {
  return supabase
    .from('checkout_intents')
    .update({ payment_id: paymentId })
    .eq('id', checkoutIntentId)
}

/**
 * Marca como completado de forma atómica (one-time use).
 * Solo actualiza si el status es 'pending', evitando doble procesamiento.
 * Retorna: data[0] si se actualizó (1 fila), null si ya estaba completado.
 * IMPORTANT: Usa .select() para recibir datos actualizados (sin esto, data es null).
 */
export async function markCompletedIfPending(
  supabase: SupabaseClient,
  checkoutIntentId: string,
  paymentId: string
) {
  return supabase
    .from('checkout_intents')
    .update({
      payment_id: paymentId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', checkoutIntentId)
    .eq('status', 'pending') // ATOMIC: solo si aún está pending
    .select() // Necesario para recibir las filas actualizadas
    .single() // Esperamos exactamente 1 fila actualizada
}

export async function markFailed(
  supabase: SupabaseClient,
  checkoutIntentId: string
) {
  return supabase
    .from('checkout_intents')
    .update({ status: 'failed' })
    .eq('id', checkoutIntentId)
}
