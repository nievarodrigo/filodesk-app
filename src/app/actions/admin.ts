'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  // 2. Obtener datos de la suscripción
  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (fetchError || !sub) return
  if (sub.status !== 'pending_validation') return

  // 3. Activar suscripción y barbería (Transacción manual)
  const now = new Date().toISOString()

  // Actualizar suscripción
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      starts_at: now,
      validated_at: now,
      validated_by: user.id
    })
    .eq('id', subscriptionId)

  // Actualizar barbería
  await supabase
    .from('barbershops')
    .update({
      subscription_status: 'active',
      subscription_starts_at: now,
      subscription_renews_at: sub.ends_at,
      subscription_amount: sub.amount,
      subscription_payment_method: sub.payment_method
    })
    .eq('id', sub.barbershop_id)

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

  const { error } = await supabase.from('admin_expenses').insert({
    description,
    amount,
    date,
    category,
  })

  if (error) console.error('[Admin] Error adding expense:', error)

  revalidatePath('/admin/gastos')
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('admin_expenses')
    .delete()
    .eq('id', id)

  if (error) console.error('[Admin] Error deleting expense:', error)

  revalidatePath('/admin/gastos')
}
