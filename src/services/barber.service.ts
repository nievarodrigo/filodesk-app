import { SupabaseClient } from '@supabase/supabase-js'
import * as barberRepo from '@/repositories/barber.repository'
import type { CreateBarberInput } from '@/types'

export async function createBarber(
  supabase: SupabaseClient,
  barbershopId: string,
  input: CreateBarberInput
) {
  const { error } = await barberRepo.insert(supabase, {
    barbershop_id: barbershopId,
    name: input.name.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    commission_pct: input.commission_pct,
  })
  if (error?.code === '23505') {
    return { error: 'Ya existe un barbero con ese email en esta barbería.' }
  }
  if (error) return { error: 'No se pudo agregar el barbero. Intentá de nuevo.' }
  return {}
}

export async function toggleActive(supabase: SupabaseClient, barberId: string, active: boolean) {
  await barberRepo.updateActive(supabase, barberId, active)
}

export async function deleteBarber(
  supabase: SupabaseClient,
  barbershopId: string,
  barberId: string
) {
  await barberRepo.deleteById(supabase, barberId, barbershopId)
  return {}
}
