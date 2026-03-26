export type Sale = {
  id: string
  barbershop_id: string
  barber_id: string
  service_type_id: string
  amount: number
  date: string
  notes: string | null
  created_at: string
}

export type SaleRow = {
  barbershop_id: string
  barber_id: string
  service_type_id: string
  amount: number
  date: string
  notes: string | null
}

export type SaleWithRelations = Sale & {
  barbers: { name: string; commission_pct: number }
  service_types: { name: string }
}
