export type Barbershop = {
  id: string
  owner_id: string
  name: string
  address?: string | null
  phone?: string | null
  subscription_status: 'trial' | 'active' | 'expired'
  trial_ends_at?: string | null
  mp_subscription_id?: string | null
  created_at: string
}

export type CreateBarbershopInput = {
  name: string
  address?: string
  phone: string
}
