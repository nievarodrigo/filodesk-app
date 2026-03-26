import { SupabaseClient } from '@supabase/supabase-js'
import type { SaleRow } from '@/types'

export async function insertMany(supabase: SupabaseClient, rows: SaleRow[]) {
  return supabase.from('sales').insert(rows)
}

export async function deleteById(supabase: SupabaseClient, id: string) {
  return supabase.from('sales').delete().eq('id', id)
}

export async function countByBarberId(supabase: SupabaseClient, barberId: string) {
  const { count } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('barber_id', barberId)
  return count ?? 0
}

export async function sumByBarberAndRange(
  supabase: SupabaseClient,
  barbershopId: string,
  barberId: string,
  periodStart: string,
  periodEnd: string
) {
  const { data } = await supabase
    .from('sales')
    .select('amount')
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .gte('date', periodStart)
    .lte('date', periodEnd)
  return (data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
}
