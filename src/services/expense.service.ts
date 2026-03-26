import { SupabaseClient } from '@supabase/supabase-js'
import * as expenseRepo from '@/repositories/expense.repository'
import type { CreateExpenseInput } from '@/types'

export async function createExpense(
  supabase: SupabaseClient,
  barbershopId: string,
  input: CreateExpenseInput
) {
  const { error } = await expenseRepo.insert(supabase, {
    barbershop_id: barbershopId,
    ...input,
  })
  if (error) return { error: 'No se pudo registrar el gasto. ' + error.message }
  return {}
}

export async function deleteExpense(supabase: SupabaseClient, id: string) {
  await expenseRepo.deleteById(supabase, id)
}
