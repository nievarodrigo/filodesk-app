'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/lib/constants/gastos'
import { z } from 'zod'
import * as expenseService from '@/services/expense.service'

const Schema = z.object({
  description: z.string().min(2, 'Describí el gasto.').trim(),
  amount: z.number({ error: 'Ingresá un monto válido.' }).positive('El monto debe ser mayor a 0.'),
  category: z.enum(CATEGORIES),
  date: z.string().min(1, 'Ingresá la fecha de pago.'),
})

export type GastoState = {
  errors?: { description?: string[]; amount?: string[]; category?: string[]; date?: string[] }
  message?: string
} | undefined

export async function createGasto(
  barbershopId: string,
  _state: GastoState,
  formData: FormData
): Promise<GastoState> {
  const validated = Schema.safeParse({
    description: formData.get('description'),
    amount: Number(formData.get('amount')),
    category: formData.get('category'),
    date: formData.get('date'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await expenseService.createExpense(supabase, barbershopId, validated.data)
  if (result.error) return { message: result.error }

  revalidatePath(`/dashboard/${barbershopId}/gastos`)
}

export async function deleteGasto(barbershopId: string, id: string) {
  const supabase = await createClient()
  await expenseService.deleteExpense(supabase, id)
  revalidatePath(`/dashboard/${barbershopId}/gastos`)
}
