import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: { barbershop_id: string; name: string; commission_pct: number }
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
    .select('name, commission_pct')
    .eq('id', id)
    .single()
  return data
}

export async function updateActive(supabase: SupabaseClient, id: string, active: boolean) {
  return supabase.from('barbers').update({ active }).eq('id', id)
}

export async function deleteById(supabase: SupabaseClient, id: string, barbershopId: string) {
  return supabase.from('barbers').delete().eq('id', id).eq('barbershop_id', barbershopId)
}
