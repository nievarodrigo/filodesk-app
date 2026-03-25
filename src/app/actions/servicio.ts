'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({
  name:          z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').trim(),
  default_price: z.number({ invalid_type_error: 'Ingresá un precio válido.' }).min(0),
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
    name:          formData.get('name'),
    default_price: Number(formData.get('default_price')),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase.from('service_types').insert({
    barbershop_id: barbershopId,
    name:          validated.data.name,
    default_price: validated.data.default_price,
  })

  if (error) return { message: 'No se pudo crear el servicio.' }
  revalidatePath(`/dashboard/${barbershopId}/servicios`)
}

export async function updateServicioPrice(
  barbershopId: string,
  serviceId: string,
  default_price: number
) {
  const supabase = await createClient()

  const { data: service } = await supabase
    .from('service_types')
    .select('barbershop_id, name, active')
    .eq('id', serviceId)
    .single()

  if (!service) return

  if (service.barbershop_id === null) {
    // Global service — upsert a barbershop-specific override
    const { data: existing } = await supabase
      .from('service_types')
      .select('id')
      .eq('barbershop_id', barbershopId)
      .eq('name', service.name)
      .maybeSingle()

    if (existing) {
      await supabase.from('service_types').update({ default_price }).eq('id', existing.id)
    } else {
      await supabase.from('service_types').insert({
        barbershop_id: barbershopId,
        name: service.name,
        default_price,
        active: service.active,
      })
    }
  } else {
    await supabase.from('service_types').update({ default_price }).eq('id', serviceId)
  }

  revalidatePath(`/dashboard/${barbershopId}/configuracion`)
  revalidatePath(`/dashboard/${barbershopId}`)
}

export async function toggleServicio(
  barbershopId: string,
  serviceId: string,
  active: boolean
) {
  const supabase = await createClient()

  const { data: service } = await supabase
    .from('service_types')
    .select('barbershop_id, name, default_price')
    .eq('id', serviceId)
    .single()

  if (!service) return

  if (service.barbershop_id === null) {
    const { data: existing } = await supabase
      .from('service_types')
      .select('id')
      .eq('barbershop_id', barbershopId)
      .eq('name', service.name)
      .maybeSingle()

    if (existing) {
      await supabase.from('service_types').update({ active }).eq('id', existing.id)
    } else {
      await supabase.from('service_types').insert({
        barbershop_id: barbershopId,
        name: service.name,
        default_price: service.default_price,
        active,
      })
    }
  } else {
    await supabase.from('service_types').update({ active }).eq('id', serviceId)
  }

  revalidatePath(`/dashboard/${barbershopId}/configuracion`)
  revalidatePath(`/dashboard/${barbershopId}`)
}
