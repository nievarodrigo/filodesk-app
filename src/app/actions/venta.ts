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

  const serviceIds  = formData.getAll('service_type_id[]') as string[]
  const amounts     = formData.getAll('amount[]') as string[]
  const quantities  = formData.getAll('quantity[]') as string[]

  if (!barber_id) return { message: 'Seleccioná un barbero.' }
  if (!date)      return { message: 'Ingresá la fecha.' }
  if (serviceIds.length === 0) return { message: 'Agregá al menos un servicio.' }

  const base = serviceIds.map((service_type_id, i) => ({
    service_type_id,
    amount:   Number(amounts[i]) || 0,
    quantity: Math.max(1, Number(quantities[i]) || 1),
  }))

  const invalid = base.find(r => !r.service_type_id || r.amount <= 0)
  if (invalid) return { message: 'Completá el servicio y monto de cada fila.' }

  // Insert one record per unit so ticket promedio and service count stay accurate
  const rows = base.flatMap(r =>
    Array.from({ length: r.quantity }, () => ({
      barbershop_id: barbershopId,
      barber_id,
      service_type_id: r.service_type_id,
      amount: r.amount,
      date,
      notes,
    }))
  )

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
