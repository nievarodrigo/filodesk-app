import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: { barbershop_id: string; name: string; cost_price: number; sale_price: number; stock: number }
) {
  return supabase.from('products').insert(data)
}

export async function findById(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from('products')
    .select('id, name, cost_price, sale_price, stock')
    .eq('id', id)
    .single()
  return data
}

export async function findByIds(supabase: SupabaseClient, ids: string[]) {
  const { data } = await supabase
    .from('products')
    .select('id, stock, name')
    .in('id', ids)
  return data
}

export async function updateStock(supabase: SupabaseClient, id: string, stock: number) {
  return supabase.from('products').update({ stock }).eq('id', id)
}

export async function updateStockAndCost(supabase: SupabaseClient, id: string, stock: number, costPrice: number) {
  return supabase.from('products').update({ stock, cost_price: costPrice }).eq('id', id)
}

export async function updateActive(supabase: SupabaseClient, id: string, active: boolean) {
  return supabase.from('products').update({ active }).eq('id', id)
}
