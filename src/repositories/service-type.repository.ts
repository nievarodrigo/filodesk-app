import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: { barbershop_id: string; name: string; default_price: number; active?: boolean }
) {
  return supabase.from('service_types').insert(data)
}

export async function findById(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from('service_types')
    .select('id, barbershop_id, name, default_price, active')
    .eq('id', id)
    .single()
  return data
}

export async function findByBarbershopAndName(supabase: SupabaseClient, barbershopId: string, name: string) {
  const { data } = await supabase
    .from('service_types')
    .select('id')
    .eq('barbershop_id', barbershopId)
    .eq('name', name)
    .maybeSingle()
  return data
}

export async function updatePrice(supabase: SupabaseClient, id: string, defaultPrice: number) {
  return supabase.from('service_types').update({ default_price: defaultPrice }).eq('id', id)
}

export async function updateActive(supabase: SupabaseClient, id: string, active: boolean) {
  return supabase.from('service_types').update({ active }).eq('id', id)
}

export async function deleteById(supabase: SupabaseClient, id: string) {
  return supabase.from('service_types').delete().eq('id', id)
}
