import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: { barbershop_id: string; name: string; cost_price: number; sale_price: number; stock: number }
) {
  return supabase.from('products').insert(data)
}

export async function findById(supabase: SupabaseClient, barbershopId: string, id: string) {
  const { data } = await supabase
    .from('products')
    .select('id, name, cost_price, sale_price, stock')
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
    .single()
  return data
}

export async function findByIds(supabase: SupabaseClient, barbershopId: string, ids: string[]) {
  const { data } = await supabase
    .from('products')
    .select('id, stock, name')
    .eq('barbershop_id', barbershopId)
    .in('id', ids)
  return data
}

export async function updateStock(supabase: SupabaseClient, barbershopId: string, id: string, stock: number) {
  return supabase
    .from('products')
    .update({ stock })
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
}

export async function updateStockAndCost(
  supabase: SupabaseClient,
  barbershopId: string,
  id: string,
  stock: number,
  costPrice: number
) {
  return supabase
    .from('products')
    .update({ stock, cost_price: costPrice })
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
}

export async function updateActive(supabase: SupabaseClient, barbershopId: string, id: string, active: boolean) {
  return supabase
    .from('products')
    .update({ active })
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
}

export async function updateData(
  supabase: SupabaseClient,
  barbershopId: string,
  id: string,
  data: { name: string; sale_price: number; stock: number }
) {
  return supabase
    .from('products')
    .update(data)
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
}

export async function softDeleteById(supabase: SupabaseClient, barbershopId: string, id: string) {
  return supabase
    .from('products')
    .update({ active: false })
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
}

export async function hardDeleteById(supabase: SupabaseClient, barbershopId: string, id: string) {
  return supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('barbershop_id', barbershopId)
}
