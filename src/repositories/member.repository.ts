import { SupabaseClient } from '@supabase/supabase-js'
import { BarbershopRole } from '@/lib/definitions'

export async function getMemberRole(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string
): Promise<BarbershopRole | null> {
  const { data, error } = await supabase
    .from('barbershop_members')
    .select('role')
    .eq('barbershop_id', barbershopId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data.role as BarbershopRole
}
