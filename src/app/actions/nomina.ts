'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type NominaState = { message?: string } | undefined

export async function createNomina(
  barbershopId: string,
  _state: NominaState,
  formData: FormData
): Promise<NominaState> {
  const barber_id    = formData.get('barber_id') as string
  const period_start = formData.get('period_start') as string
  const period_end   = formData.get('period_end') as string

  if (!barber_id || !period_start || !period_end) {
    return { message: 'Completá todos los campos.' }
  }
  if (period_start > period_end) {
    return { message: 'La fecha de inicio debe ser anterior al fin.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Traer barbero y sus ventas del período
  const [{ data: barber }, { data: sales }] = await Promise.all([
    supabase.from('barbers').select('name, commission_pct').eq('id', barber_id).single(),
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).eq('barber_id', barber_id).gte('date', period_start).lte('date', period_end),
  ])

  if (!barber) return { message: 'Barbero no encontrado.' }

  const total_sales       = (sales ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const commission_amount = Math.round(total_sales * barber.commission_pct / 100)

  const { error } = await supabase.from('payrolls').insert({
    barbershop_id:    barbershopId,
    barber_id,
    period_start,
    period_end,
    total_sales,
    commission_pct:    barber.commission_pct,
    commission_amount,
    status:           'pending',
  })

  if (error) return { message: 'No se pudo crear la nómina.' }
  revalidatePath(`/dashboard/${barbershopId}/nominas`)
}

export async function markNominaPaid(barbershopId: string, nominaId: string) {
  const supabase = await createClient()
  await supabase.from('payrolls').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', nominaId)
  revalidatePath(`/dashboard/${barbershopId}/nominas`)
}

export async function deleteNomina(barbershopId: string, nominaId: string) {
  const supabase = await createClient()
  await supabase.from('payrolls').delete().eq('id', nominaId)
  revalidatePath(`/dashboard/${barbershopId}/nominas`)
}
