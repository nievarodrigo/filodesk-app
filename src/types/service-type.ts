export type ServiceType = {
  id: string
  barbershop_id: string | null
  name: string
  default_price: number | null
  active: boolean
  created_at: string
}

export type CreateServiceTypeInput = {
  name: string
  default_price: number
}
