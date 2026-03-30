import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: {
    barbershop_id: string
    name: string
    last_name: string
    email: string
    phone: string
    commission_pct: number
    user_id?: string | null
  }
) {
  return supabase.from('barbers').insert(data)
}

export async function countByBarbershopId(supabase: SupabaseClient, barbershopId: string) {
  const { count, error } = await supabase
    .from('barbers')
    .select('*', { count: 'exact', head: true })
    .eq('barbershop_id', barbershopId)

  return { count: count ?? 0, error }
}

export async function findById(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from('barbers')
    .select('name, last_name, email, phone, user_id, commission_pct')
    .eq('id', id)
    .single()
  return data
}

export async function findByUserId(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string
) {
  const { data } = await supabase
    .from('barbers')
    .select('id, name, last_name, email, user_id, commission_pct, active')
    .eq('barbershop_id', barbershopId)
    .eq('user_id', userId)
    .maybeSingle()

  return data
}

export async function findByEmailWithoutUserId(
  supabase: SupabaseClient,
  barbershopId: string,
  email: string
) {
  const { data } = await supabase
    .from('barbers')
    .select('id, name, last_name, email, user_id, commission_pct, active')
    .eq('barbershop_id', barbershopId)
    .ilike('email', email)
    .is('user_id', null)
    .maybeSingle()

  return data
}

export async function attachUserId(
  supabase: SupabaseClient,
  barberId: string,
  userId: string
) {
  return supabase
    .from('barbers')
    .update({ user_id: userId })
    .eq('id', barberId)
    .is('user_id', null)
}

export async function updateActive(supabase: SupabaseClient, id: string, active: boolean) {
  return supabase.from('barbers').update({ active }).eq('id', id)
}

export async function deleteById(supabase: SupabaseClient, id: string, barbershopId: string) {
  return supabase
    .from('barbers')
    .update({ active: false })
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
}
