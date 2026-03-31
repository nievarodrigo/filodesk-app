'use server'

import { revalidatePath } from 'next/cache'
import { canAccess } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { CreateAppointmentSchema, UpdateAppointmentStatusSchema } from '@/lib/validations/appointment'
import { getServerAuthContext } from '@/services/auth.service'
import * as appointmentService from '@/services/appointment.service'

async function requireAgendaAccess(barbershopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' as const }

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || !canAccess(context.role, 'register_sale')) {
    return { error: 'No tenés permisos para gestionar agenda.' as const }
  }

  return { supabase, user, context }
}

export async function getAgendaData(barbershopId: string, fromISO: string, toISO: string, barberId?: string) {
  const auth = await requireAgendaAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const from = Date.parse(fromISO)
  const to = Date.parse(toISO)
  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
    return { error: 'Rango de fechas inválido.' }
  }

  return appointmentService.getAgendaData(auth.supabase, barbershopId, fromISO, toISO, barberId)
}

export async function createAgendaAppointment(
  barbershopId: string,
  payload: {
    barberId: string
    clientName: string
    clientPhone?: string
    serviceId?: string | null
    startTime: string
    endTime: string
    notes?: string
  }
) {
  const validated = CreateAppointmentSchema.safeParse(payload)
  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors).find(Boolean)?.[0]
    return { error: firstError ?? 'Datos inválidos.' }
  }

  const auth = await requireAgendaAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const result = await appointmentService.createAppointment(auth.supabase, barbershopId, validated.data)
  if ('error' in result) return { error: result.error }

  revalidatePath(`/dashboard/${barbershopId}/agenda`)
  return { success: true }
}

export async function updateAgendaAppointmentStatus(
  barbershopId: string,
  appointmentId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
) {
  const validated = UpdateAppointmentStatusSchema.safeParse({ status })
  if (!validated.success) return { error: 'Estado inválido.' }

  const auth = await requireAgendaAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const result = await appointmentService.updateAppointmentStatus(
    auth.supabase,
    barbershopId,
    appointmentId,
    validated.data.status
  )
  if ('error' in result) return { error: result.error }

  revalidatePath(`/dashboard/${barbershopId}/agenda`)
  return { success: true }
}

export async function deleteAgendaAppointment(barbershopId: string, appointmentId: string) {
  const auth = await requireAgendaAccess(barbershopId)
  if ('error' in auth) return { error: auth.error }

  const result = await appointmentService.cancelAppointment(auth.supabase, barbershopId, appointmentId)
  if ('error' in result) return { error: result.error }

  revalidatePath(`/dashboard/${barbershopId}/agenda`)
  return { success: true }
}
