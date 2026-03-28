'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateBarberSchema, type CreateBarberState } from '@/lib/validations/barber'
import * as barberService from '@/services/barber.service'

export async function createBarber(
  barbershopId: string,
  _state: CreateBarberState,
  formData: FormData
): Promise<CreateBarberState> {
  const validated = CreateBarberSchema.safeParse({
    name: formData.get('name'),
    commission_pct: Number(formData.get('commission_pct')),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await barberService.createBarber(supabase, barbershopId, validated.data)
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/barberos`)
}

export async function toggleBarberActive(barbershopId: string, barberId: string, active: boolean) {
  const supabase = await createClient()
  await barberService.toggleActive(supabase, barberId, active)
  revalidatePath(`/dashboard/${barbershopId}/barberos`)
}

export async function deleteBarber(barbershopId: string, barberId: string) {
  const supabase = await createClient()
  const result = await barberService.deleteBarber(supabase, barbershopId, barberId)
  if (result.error) return { error: result.error }
  revalidatePath(`/dashboard/${barbershopId}/barberos`)
}

export async function updateBarberCommission(barbershopId: string, barberId: string, commission: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('barbers')
    .update({ commission_pct: commission })
    .eq('id', barberId)
    .eq('barbershop_id', barbershopId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/${barbershopId}/barberos`)
  return { success: true }
}
