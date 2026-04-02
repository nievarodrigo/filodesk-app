import { SupabaseClient } from '@supabase/supabase-js'
import * as saleRepo from '@/repositories/sale.repository'
import type { SaleRow } from '@/types'

type ServiceItem = {
  service_type_id: string
  amount: number
  quantity: number
}

export async function createSale(
  supabase: SupabaseClient,
  barbershopId: string,
  { barber_id, date, notes, services, status }: {
    barber_id: string
    date: string
    notes: string | null
    services: ServiceItem[]
    status: 'pending' | 'approved'
  }
) {
  const { data: barber, error: barberError } = await supabase
    .from('barbers')
    .select('id')
    .eq('id', barber_id)
    .eq('barbershop_id', barbershopId)
    .eq('active', true)
    .maybeSingle()

  if (barberError || !barber) {
    return { error: 'El barbero seleccionado no está activo.' }
  }

  const rows: SaleRow[] = services.flatMap(r =>
    Array.from({ length: r.quantity }, () => ({
      barbershop_id: barbershopId,
      barber_id,
      service_type_id: r.service_type_id,
      amount: r.amount,
      status,
      date,
      notes,
    }))
  )

  const { error } = await saleRepo.insertMany(supabase, rows)
  if (error) return { error: 'No se pudo registrar la venta. Intentá de nuevo.' }
  return {}
}

export async function deleteSale(supabase: SupabaseClient, saleId: string, barbershopId: string) {
  await saleRepo.deleteById(supabase, saleId, barbershopId)
}
