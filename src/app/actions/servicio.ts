'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canAccess } from '@/lib/permissions'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getServerAuthContext } from '@/services/auth.service'
import { z } from 'zod'
import * as serviceTypeService from '@/services/service-type.service'

const Schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').trim(),
  default_price: z.number({ error: 'Ingresá un precio válido.' }).min(0),
})

export type ServicioState = {
  errors?: { name?: string[]; default_price?: string[] }
  message?: string
} | undefined

export async function createServicio(
  barbershopId: string,
  _state: ServicioState,
  formData: FormData
): Promise<ServicioState> {
  const validated = Schema.safeParse({
    name: formData.get('name'),
    default_price: Number(formData.get('default_price')),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await serviceTypeService.createServiceType(supabase, barbershopId, validated.data)
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
}

export async function updateServicioPrice(barbershopId: string, serviceId: string, default_price: number) {
  const supabase = await createClient()
  await serviceTypeService.updatePrice(supabase, barbershopId, serviceId, default_price)
  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
  revalidatePath(`/dashboard/${barbershopId}`)
}

export async function deleteServicio(barbershopId: string, serviceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || !canAccess(context.role, 'manage_services')) {
    return { error: 'No tenés permisos para eliminar servicios.' }
  }

  const adminClient = createServiceClient()
  const { data: serviceMeta } = await adminClient
    .from('service_types')
    .select('id, barbershop_id')
    .eq('id', serviceId)
    .maybeSingle()

  if (!serviceMeta) return { error: 'El servicio no existe.' }
  if (serviceMeta.barbershop_id !== null && serviceMeta.barbershop_id !== barbershopId) {
    return { error: 'No tenés permisos para eliminar este servicio.' }
  }

  const isGlobal = serviceMeta.barbershop_id === null
  if (isGlobal && context.role !== 'owner' && context.role !== 'manager') {
    return { error: 'Solo owner o manager pueden eliminar servicios globales.' }
  }

  const clientForDelete = isGlobal ? adminClient : supabase
  const result = await serviceTypeService.deleteServiceType(clientForDelete, barbershopId, serviceId)
  if (result && 'error' in result) return { error: result.error }
  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
  revalidatePath(`/dashboard/${barbershopId}`)
  return { success: true, mode: result?.mode }
}

export async function toggleServicio(barbershopId: string, serviceId: string, active: boolean) {
  const supabase = await createClient()
  await serviceTypeService.toggleActive(supabase, barbershopId, serviceId, active)
  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
  revalidatePath(`/dashboard/${barbershopId}`)
}
