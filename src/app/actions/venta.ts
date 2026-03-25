'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type CreateVentaState = {
  message?: string
} | undefined

export async function createVenta(
  barbershopId: string,
  _state: CreateVentaState,
  formData: FormData
): Promise<CreateVentaState> {
  const barber_id = formData.get('barber_id') as string
  const date      = formData.get('date') as string
  const notes     = (formData.get('notes') as string) || null

  const serviceIds = formData.getAll('service_type_id[]') as string[]
  const amounts    = formData.getAll('amount[]') as string[]

  if (!barber_id) return { message: 'Seleccioná un barbero.' }
  if (!date)      return { message: 'Ingresá la fecha.' }
  if (serviceIds.length === 0) return { message: 'Agregá al menos un servicio.' }

  const rows = serviceIds.map((service_type_id, i) => ({
    barbershop_id:   barbershopId,
    barber_id,
    service_type_id,
    amount:          Number(amounts[i]) || 0,
    date,
    notes,
  }))

  const invalid = rows.find(r => !r.service_type_id || r.amount <= 0)
  if (invalid) return { message: 'Completá el servicio y monto de cada fila.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase.from('sales').insert(rows)

  if (error) {
    return { message: 'No se pudo registrar la venta. Intentá de nuevo.' }
  }

  revalidatePath(`/dashboard/${barbershopId}/ventas`)
  revalidatePath(`/dashboard/${barbershopId}`)
}

export async function deleteVenta(barbershopId: string, saleId: string) {
  const supabase = await createClient()
  await supabase.from('sales').delete().eq('id', saleId)
  revalidatePath(`/dashboard/${barbershopId}/ventas`)
  revalidatePath(`/dashboard/${barbershopId}`)
}
