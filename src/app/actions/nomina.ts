'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import * as payrollService from '@/services/payroll.service'

export type NominaState = { message?: string } | undefined

export async function createNomina(
  barbershopId: string,
  _state: NominaState,
  formData: FormData
): Promise<NominaState> {
  const barber_id = formData.get('barber_id') as string
  const period_start = formData.get('period_start') as string
  const period_end = formData.get('period_end') as string

  if (!barber_id || !period_start || !period_end) return { message: 'Completá todos los campos.' }
  if (period_start > period_end) return { message: 'La fecha de inicio debe ser anterior al fin.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await payrollService.createPayroll(supabase, barbershopId, { barber_id, period_start, period_end })
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/nominas`)
}

export async function markNominaPaid(barbershopId: string, nominaId: string) {
  const supabase = await createClient()
  await payrollService.markPaid(supabase, nominaId)
  revalidatePath(`/dashboard/${barbershopId}/nominas`)
}

export async function deleteNomina(barbershopId: string, nominaId: string) {
  const supabase = await createClient()
  await payrollService.deletePayroll(supabase, nominaId)
  revalidatePath(`/dashboard/${barbershopId}/nominas`)
}
