'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canAccess } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { CreateBarberSchema, type CreateBarberState } from '@/lib/validations/barber'
import * as barberRepo from '@/repositories/barber.repository'
import { getServerAuthContext } from '@/services/auth.service'
import * as barberService from '@/services/barber.service'
import { getPlanLimit } from '@/services/plan.service'

async function requireManageBarbersAccess(barbershopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' as const }

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || !canAccess(context.role, 'manage_barbers')) {
    return { error: 'No tenés permisos para gestionar barberos.' as const }
  }

  return { supabase, user, context }
}

export async function createBarber(
  barbershopId: string,
  _state: CreateBarberState,
  formData: FormData
): Promise<CreateBarberState> {
  const validated = CreateBarberSchema.safeParse({
    name: formData.get('name'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    commission_pct: Number(formData.get('commission_pct')),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || !canAccess(context.role, 'manage_barbers')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const barberLimit = getPlanLimit(context.plan, 'barbers')
  if (barberLimit !== null) {
    const { count, error } = await barberRepo.countByBarbershopId(supabase, barbershopId)
    if (error) return { message: 'No se pudo validar el límite de tu plan.' }

    if (count >= barberLimit) {
      return { message: `Tu plan ${context.plan} permite hasta ${barberLimit} barberos.` }
    }
  }

  const result = await barberService.createBarber(supabase, barbershopId, validated.data)
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
}

export async function toggleBarberActive(barbershopId: string, barberId: string, active: boolean) {
  const auth = await requireManageBarbersAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const { supabase } = auth
  await barberService.toggleActive(supabase, barberId, active)
  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
  return { success: true }
}

export async function deleteBarber(barbershopId: string, barberId: string) {
  const auth = await requireManageBarbersAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const { supabase } = auth
  const result = await barberService.deleteBarber(supabase, barbershopId, barberId)
  if ('error' in result) return { error: result.error }
  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
  return { success: true }
}

export async function updateBarberCommission(barbershopId: string, barberId: string, commission: number) {
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    return { error: 'La comisión debe ser un número entre 0 y 100.' }
  }

  const auth = await requireManageBarbersAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const { supabase } = auth
  const { error } = await supabase
    .from('barbers')
    .update({ commission_pct: commission })
    .eq('id', barberId)
    .eq('barbershop_id', barbershopId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/${barbershopId}/barberosyservicios`)
  return { success: true }
}
