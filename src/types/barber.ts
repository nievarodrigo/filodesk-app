export type Barber = {
  id: string
  barbershop_id: string
  name: string
  email: string | null
  phone: string | null
  commission_pct: number
  active: boolean
  created_at: string
}

export type CreateBarberInput = {
  name: string
  email: string
  phone: string
  commission_pct: number
}
