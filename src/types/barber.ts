export type Barber = {
  id: string
  barbershop_id: string
  name: string
  commission_pct: number
  active: boolean
  created_at: string
}

export type CreateBarberInput = {
  name: string
  commission_pct: number
}
