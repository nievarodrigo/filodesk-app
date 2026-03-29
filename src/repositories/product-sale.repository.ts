import { SupabaseClient } from '@supabase/supabase-js'

type ProductSaleRow = {
  barbershop_id: string
  product_id: string
  quantity: number
  sale_price: number
  date: string
  transaction_id?: string
}

export async function insert(supabase: SupabaseClient, data: ProductSaleRow) {
  return supabase.from('product_sales').insert(data)
}

export async function insertMany(supabase: SupabaseClient, rows: ProductSaleRow[]) {
  return supabase.from('product_sales').insert(rows)
}
