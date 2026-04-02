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

export async function countByProductId(
  supabase: SupabaseClient,
  barbershopId: string,
  productId: string
) {
  const { count } = await supabase
    .from('product_sales')
    .select('id', { count: 'exact', head: true })
    .eq('barbershop_id', barbershopId)
    .eq('product_id', productId)
  return count ?? 0
}

export async function findById(
  supabase: SupabaseClient,
  barbershopId: string,
  id: string
) {
  const { data } = await supabase
    .from('product_sales')
    .select('id, product_id, quantity')
    .eq('barbershop_id', barbershopId)
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function deleteById(
  supabase: SupabaseClient,
  barbershopId: string,
  id: string
) {
  return supabase
    .from('product_sales')
    .delete()
    .eq('barbershop_id', barbershopId)
    .eq('id', id)
}
