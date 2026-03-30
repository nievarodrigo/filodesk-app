import { SupabaseClient } from '@supabase/supabase-js'
import * as barberRepo from '@/repositories/barber.repository'
import * as saleRepo from '@/repositories/sale.repository'
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

export async function updateBarberData(
  supabase: SupabaseClient,
  barbershopId: string,
  barberId: string,
  input: {
    name: string
    lastName: string
    email: string
    phone: string
  }
) {
  const { error } = await barberRepo.updateData(supabase, barberId, barbershopId, {
    name: input.name.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
  })

  if (error?.code === '23505') {
    return { error: 'Ya existe un barbero con ese email en esta barbería.' }
  }
  if (error) return { error: 'No se pudo actualizar el perfil del barbero.' }
  return { success: true as const }
}

export async function deleteBarber(
  supabase: SupabaseClient,
  barbershopId: string,
  barberId: string
) {
  const salesCount = await saleRepo.countByBarberId(supabase, barberId)

  if (salesCount === 0) {
    const hardDelete = await barberRepo.hardDeleteById(supabase, barberId, barbershopId)
    if (!hardDelete.error) return { mode: 'hard' as const }
  }

  const softDelete = await barberRepo.softDeleteById(supabase, barberId, barbershopId)
  if (softDelete.error) return { error: 'No se pudo dar de baja al barbero. Intentá de nuevo.' }

  return { mode: 'soft' as const }
}
