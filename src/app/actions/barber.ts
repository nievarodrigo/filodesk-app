'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateBarberSchema, type CreateBarberState } from '@/lib/validations/barber'

export async function createBarber(
  barbershopId: string,
  _state: CreateBarberState,
  formData: FormData
): Promise<CreateBarberState> {
  const validated = CreateBarberSchema.safeParse({
    name: formData.get('name'),
    commission_pct: Number(formData.get('commission_pct')),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase.from('barbers').insert({
    barbershop_id: barbershopId,
    name: validated.data.name,
    commission_pct: validated.data.commission_pct,
  })

  if (error) {
    return { message: 'No se pudo agregar el barbero. Intentá de nuevo.' }
  }

  revalidatePath(`/dashboard/${barbershopId}/barberos`)
}

export async function toggleBarberActive(barbershopId: string, barberId: string, active: boolean) {
  const supabase = await createClient()
  await supabase.from('barbers').update({ active }).eq('id', barberId)
  revalidatePath(`/dashboard/${barbershopId}/barberos`)
}

export async function deleteBarber(barbershopId: string, barberId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('barber_id', barberId)
  if (count && count > 0) {
    return { error: 'Este barbero tiene ventas registradas. Solo podés desactivarlo.' }
  }
  await supabase.from('barbers').delete().eq('id', barberId).eq('barbershop_id', barbershopId)
  revalidatePath(`/dashboard/${barbershopId}/barberos`)
}
