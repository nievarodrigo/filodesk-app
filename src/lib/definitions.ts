import { z } from 'zod'

export const RegisterSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Ingresá tu nombre.' }).trim(),
    lastName: z.string().min(1, { message: 'Ingresá tu apellido.' }).trim(),
    email: z.string().email({ message: 'Ingresá un email válido.' }).trim(),
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
      .regex(/[a-zA-Z]/, { message: 'Debe contener al menos una letra.' })
      .regex(/[0-9]/, { message: 'Debe contener al menos un número.' })
      .trim(),
    confirmPassword: z.string().min(1, { message: 'Confirmá tu contraseña.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Ingresá un email válido.' }).trim(),
  password: z.string().min(1, { message: 'Ingresá tu contraseña.' }).trim(),
})

export type AuthFormState =
  | {
      errors?: {
        firstName?: string[]
        lastName?: string[]
        email?: string[]
        password?: string[]
        confirmPassword?: string[]
      }
      message?: string
    }
  | undefined

// Tipos de Supabase para Dashboard y Admin
export interface ServiceType {
  id: string
  name: string
  default_price: number
  barbershop_id: string | null
  active: boolean
}

export interface Sale {
  id: string
  barber_id?: string
  amount: number
  date: string
  created_at?: string
  notes: string | null
  barbers?: {
    name: string
    commission_pct: number
  } | Array<{
    name: string
    commission_pct: number
  }>
  service_types?: {
    name: string
  } | Array<{
    name: string
  }>
}

export interface ProductSale {
  id: string
  sale_price: number
  quantity: number
  products?: {
    name: string
  } | Array<{
    name: string
  }>
}

export interface Barber {
  id: string
  name: string
  commission_pct: number
  active: boolean
}

export interface Expense {
  id: string
  amount: number
  date: string
}

export interface AdminExpense {
  id: string
  amount: number
  date: string
  description: string
  category: string
}

export interface Product {
  id: string
  name: string
  sale_price: number
  stock: number
}

export interface Barbershop {
  id: string
  name: string
  created_at: string
  subscription_status: 'active' | 'trial' | 'expired'
  subscription_starts_at: string | null
  subscription_renews_at: string | null
  subscription_amount: number | null
  subscription_payment_method: string | null
  trial_ends_at: string | null
}

// Tipos para Recharts
export interface PayloadEntry {
  name: string
  value: number
  dataKey?: string
  [key: string]: unknown
}

export interface TooltipContent {
  active?: boolean
  payload?: PayloadEntry[]
  label?: string | number
  [key: string]: unknown
}
