import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: { barbershop_id: string; description: string; amount: number; category: string; date: string }
) {
  return supabase.from('expenses').insert(data)
}

export async function deleteById(supabase: SupabaseClient, id: string) {
  return supabase.from('expenses').delete().eq('id', id)
}
