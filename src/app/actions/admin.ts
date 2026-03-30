'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'

/**
 * GESTIÓN DE PAGOS Y SUSCRIPCIONES
 */
export async function approveSubscription(subscriptionId: string): Promise<void> {
  const supabase = await createClient()

  // 1. Verificar que el usuario actual es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: isAdmin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!isAdmin) return

  let error: unknown = null
  try {
    const result = await supabase.rpc('approve_subscription_v1', {
      p_subscription_id: subscriptionId,
      p_admin_id: user.id,
    })
    error = result.error
  } catch (caughtError) {
    Sentry.captureException(caughtError)
    console.error('[Admin] Unexpected error approving subscription via RPC:', caughtError)
    return
  }

  if (error) {
    Sentry.captureException(error)
    console.error('[Admin] Error approving subscription via RPC:', error)
    return
  }

  revalidatePath('/admin/pagos')
  revalidatePath('/admin/clientes')
}

/**
 * GESTIÓN DE GASTOS OPERATIVOS
 */
export async function addExpense(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const date = formData.get('date') as string
  const category = formData.get('category') as string

  if (!description || isNaN(amount) || !date || !category) return

  let error: unknown = null
  try {
    const result = await supabase.from('admin_expenses').insert({
      description,
      amount,
      date,
      category,
    })
    error = result.error
  } catch (caughtError) {
    Sentry.captureException(caughtError)
    console.error('[Admin] Unexpected error adding expense:', caughtError)
    return
  }

  if (error) {
    Sentry.captureException(error)
    console.error('[Admin] Error adding expense:', error)
  }

  revalidatePath('/admin/gastos')
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient()

  let error: unknown = null
  try {
    const result = await supabase
      .from('admin_expenses')
      .delete()
      .eq('id', id)
    error = result.error
  } catch (caughtError) {
    Sentry.captureException(caughtError)
    console.error('[Admin] Unexpected error deleting expense:', caughtError)
    return
  }

  if (error) {
    Sentry.captureException(error)
    console.error('[Admin] Error deleting expense:', error)
  }

  revalidatePath('/admin/gastos')
}
