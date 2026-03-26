import { SupabaseClient } from '@supabase/supabase-js'

export async function insert(
  supabase: SupabaseClient,
  data: {
    barbershop_id: string
    barber_id: string
    period_start: string
    period_end: string
    total_sales: number
    commission_pct: number
    commission_amount: number
    status: string
  }
) {
  return supabase.from('payrolls').insert(data)
}

export async function markPaid(supabase: SupabaseClient, id: string) {
  return supabase
    .from('payrolls')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteById(supabase: SupabaseClient, id: string) {
  return supabase.from('payrolls').delete().eq('id', id)
}
