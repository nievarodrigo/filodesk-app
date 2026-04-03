'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canAccess } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { getServerAuthContext } from '@/services/auth.service'
import * as saleService from '@/services/sale.service'

export type CreateVentaState = { message?: string; success?: boolean } | undefined

export async function createVenta(
  barbershopId: string,
  _state: CreateVentaState,
  formData: FormData
): Promise<CreateVentaState> {
  const barber_id = formData.get('barber_id') as string
  const date = formData.get('date') as string
  const notes = (formData.get('notes') as string) || null

  const serviceIds = formData.getAll('service_type_id[]') as string[]
  const amounts = formData.getAll('amount[]') as string[]
  const quantities = formData.getAll('quantity[]') as string[]

  if (!barber_id) return { message: 'Seleccioná un barbero.' }
  if (!date) return { message: 'Ingresá la fecha.' }
  if (serviceIds.length === 0) return { message: 'Agregá al menos un servicio.' }

  const services = serviceIds.map((service_type_id, i) => ({
    service_type_id,
    amount: Number(amounts[i]) || 0,
    quantity: Math.max(1, Number(quantities[i]) || 1),
  }))

  const invalid = services.find(r => !r.service_type_id || r.amount <= 0)
  if (invalid) return { message: 'Completá el servicio y monto de cada fila.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || !canAccess(context.role, 'register_sale')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const result = await saleService.createSale(supabase, barbershopId, {
    barber_id,
    date,
    notes,
    services,
    status: context.role === 'barber' ? 'pending' : 'approved',
  })
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/ventas`)
  revalidatePath(`/dashboard/${barbershopId}`)
  return { success: true, message: 'Servicio registrado con éxito.' }
}

export async function deleteVenta(barbershopId: string, saleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || context.role === 'barber') {
    return { error: 'No tenés permisos para eliminar servicios.' }
  }

  await saleService.deleteSale(supabase, saleId, barbershopId)
  revalidatePath(`/dashboard/${barbershopId}/ventas`)
  revalidatePath(`/dashboard/${barbershopId}`)
  return { success: true }
}

export async function approveVenta(barbershopId: string, saleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || context.role === 'barber') {
    redirect(`/dashboard/${barbershopId}`)
  }

  const { error } = await supabase
    .from('sales')
    .update({ status: 'approved' })
    .eq('id', saleId)
    .eq('barbershop_id', barbershopId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${barbershopId}`)
  revalidatePath(`/dashboard/${barbershopId}/ventas`)
  revalidatePath(`/dashboard/${barbershopId}/finanzas`)
  revalidatePath(`/dashboard/${barbershopId}/nominas`)

  return { success: true }
}
