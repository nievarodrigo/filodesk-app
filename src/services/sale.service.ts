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
  { barber_id, date, notes, services }: {
    barber_id: string
    date: string
    notes: string | null
    services: ServiceItem[]
  }
) {
  const rows: SaleRow[] = services.flatMap(r =>
    Array.from({ length: r.quantity }, () => ({
      barbershop_id: barbershopId,
      barber_id,
      service_type_id: r.service_type_id,
      amount: r.amount,
      date,
      notes,
    }))
  )

  const { error } = await saleRepo.insertMany(supabase, rows)
  if (error) return { error: 'No se pudo registrar la venta. Intentá de nuevo.' }
  return {}
}

export async function deleteSale(supabase: SupabaseClient, saleId: string) {
  await saleRepo.deleteById(supabase, saleId)
}
