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

  // 2. Obtener datos de la suscripción con lock implícito (status='pending_validation')
  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('status', 'pending_validation') // SECURITY: Prevenir doble aprobación concurrente
    .single()

  if (fetchError || !sub) {
    console.error('[Admin] Sub not found or already processed:', subscriptionId)
    return
  }

  // 3. Activar suscripción y barbería
  const now = new Date().toISOString()

  // Paso A: Actualizar suscripción primero
  const { error: subErr } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      starts_at: now,
      validated_at: now,
      validated_by: user.id
    })
    .eq('id', subscriptionId)
    .eq('status', 'pending_validation')

  if (subErr) {
    console.error('[Admin] Error updating subscription:', subErr)
    return
  }

  // Paso B: Actualizar barbería
  const { error: barbErr } = await supabase
    .from('barbershops')
    .update({
      subscription_status: 'active',
      subscription_starts_at: now,
      subscription_renews_at: sub.ends_at,
      subscription_amount: sub.amount,
      subscription_payment_method: sub.payment_method,
      plan_name: sub.plan_id === 'base' ? 'Base' : sub.plan_id === 'pro' ? 'Pro' : 'Premium IA'
    })
    .eq('id', sub.barbershop_id)

  if (barbErr) {
    console.error('[Admin] CRITICAL: Barbershop update failed. Attempting rollback of subscription status:', barbErr)
    
    // COMPENSACIÓN: Revertir suscripción a pending_validation para que el admin pueda reintentar
    const { error: rollbackErr } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'pending_validation',
        starts_at: null,
        validated_at: null,
        validated_by: null 
      })
      .eq('id', subscriptionId)
    
    if (rollbackErr) {
      console.error('[Admin] FATAL: Rollback failed. System is now in INCONSISTENT state:', {
        subscriptionId,
        error: rollbackErr
      })
    }
    
    return
  }

  revalidatePath('/admin/pagos')
  revalidatePath('/admin/clientes')
  revalidatePath(`/dashboard/${sub.barbershop_id}`)
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
