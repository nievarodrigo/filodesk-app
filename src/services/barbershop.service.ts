import { SupabaseClient } from '@supabase/supabase-js'
import * as barbershopRepo from '@/repositories/barbershop.repository'
import type { CreateBarbershopInput } from '@/types'

export async function createBarbershop(
  supabase: SupabaseClient,
  userId: string,
  input: CreateBarbershopInput
) {
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)

  const { data, error } = await barbershopRepo.insert(supabase, {
    owner_id: userId,
    name: input.name,
    address: input.address,
    phone: input.phone,
    subscription_status: 'trial',
    trial_ends_at: trialEndsAt.toISOString(),
  })

  if (error) return { error: 'No se pudo crear la barbería. Intentá de nuevo.' }
  return { id: data.id }
}
