import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: { owner_id: string; name: string; address?: string; phone: string; subscription_status: string; trial_ends_at: string }
) {
  return supabase.from('barbershops').insert(data).select('id').single()
}

export async function findByIdAndOwner(supabase: SupabaseClient, id: string, ownerId: string) {
  const { data } = await supabase
    .from('barbershops')
    .select('id, name, plan_name, subscription_status, trial_ends_at, mp_subscription_id')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  return data
}

export async function findById(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from('barbershops')
    .select('id, owner_id, name, plan_name')
    .eq('id', id)
    .single()

  return data
}

export async function findNameByIdAndOwner(supabase: SupabaseClient, id: string, ownerId: string) {
  const { data } = await supabase
    .from('barbershops')
    .select('name')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  return data
}

export async function updateSubscription(
  supabase: SupabaseClient,
  barbershopId: string,
  status: 'active' | 'expired',
  mpSubscriptionId: string | null,
  startsAt?: string | null,
  renewsAt?: string | null,
  amount?: number | null,
  paymentMethod?: string | null,
) {
  return supabase
    .from('barbershops')
    .update({
      subscription_status: status,
      mp_subscription_id: mpSubscriptionId,
      ...(startsAt !== undefined && { subscription_starts_at: startsAt }),
      ...(renewsAt !== undefined && { subscription_renews_at: renewsAt }),
      ...(amount !== undefined && { subscription_amount: amount }),
      ...(paymentMethod !== undefined && { subscription_payment_method: paymentMethod }),
    })
    .eq('id', barbershopId)
}
