import { SupabaseClient } from '@supabase/supabase-js'
import * as serviceTypeRepo from '@/repositories/service-type.repository'
import type { CreateServiceTypeInput } from '@/types'

export async function createServiceType(
  supabase: SupabaseClient,
  barbershopId: string,
  input: CreateServiceTypeInput
) {
  const { error } = await serviceTypeRepo.insert(supabase, {
    barbershop_id: barbershopId,
    name: input.name,
    default_price: input.default_price,
  })
  if (error) return { error: 'No se pudo crear el servicio.' }
  return {}
}

async function upsertOverride(
  supabase: SupabaseClient,
  barbershopId: string,
  globalService: { name: string; default_price: number | null; active: boolean },
  updateFields: Record<string, unknown>
) {
  const existing = await serviceTypeRepo.findByBarbershopAndName(supabase, barbershopId, globalService.name)
  if (existing) {
    if ('default_price' in updateFields) {
      await serviceTypeRepo.updatePrice(supabase, existing.id, updateFields.default_price as number)
    }
    if ('active' in updateFields) {
      await serviceTypeRepo.updateActive(supabase, existing.id, updateFields.active as boolean)
    }
  } else {
    await serviceTypeRepo.insert(supabase, {
      barbershop_id: barbershopId,
      name: globalService.name,
      default_price: (updateFields.default_price as number) ?? globalService.default_price ?? 0,
      active: (updateFields.active as boolean) ?? globalService.active,
    })
  }
}

export async function updatePrice(
  supabase: SupabaseClient,
  barbershopId: string,
  serviceId: string,
  price: number
) {
  const service = await serviceTypeRepo.findById(supabase, serviceId)
  if (!service) return

  if (service.barbershop_id === null) {
    await upsertOverride(supabase, barbershopId, service, { default_price: price })
  } else {
    await serviceTypeRepo.updatePrice(supabase, serviceId, price)
  }
}

export async function toggleActive(
  supabase: SupabaseClient,
  barbershopId: string,
  serviceId: string,
  active: boolean
) {
  const service = await serviceTypeRepo.findById(supabase, serviceId)
  if (!service) return

  if (service.barbershop_id === null) {
    await upsertOverride(supabase, barbershopId, service, { active })
  } else {
    await serviceTypeRepo.updateActive(supabase, serviceId, active)
  }
}

export async function deleteServiceType(
  supabase: SupabaseClient,
  barbershopId: string,
  serviceId: string
) {
  const service = await serviceTypeRepo.findById(supabase, serviceId)
  if (!service || service.barbershop_id !== barbershopId) {
    return { error: 'Solo podés eliminar servicios propios, no los globales.' }
  }
  await serviceTypeRepo.deleteById(supabase, serviceId)
  return {}
}
