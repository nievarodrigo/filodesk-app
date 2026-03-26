import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: { barbershop_id: string; product_id: string; quantity: number; sale_price: number; date: string }
) {
  return supabase.from('product_sales').insert(data)
}

export async function insertMany(
  supabase: SupabaseClient,
  rows: { barbershop_id: string; product_id: string; quantity: number; sale_price: number; date: string }[]
) {
  return supabase.from('product_sales').insert(rows)
}
