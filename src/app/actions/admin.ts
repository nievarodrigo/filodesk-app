'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function approveSubscription(subscriptionId: string) {
  const supabase = await createClient()

  // 1. Verificar que el usuario actual es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: isAdmin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!isAdmin) return { error: 'No autorizado' }

  // 2. Obtener datos de la suscripción
  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (fetchError || !sub) return { error: 'Suscripción no encontrada' }
  if (sub.status !== 'pending_validation') return { error: 'Ya procesada' }

  // 3. Activar suscripción y barbería (Transacción manual)
  const now = new Date().toISOString()

  // Actualizar suscripción
  const { error: subErr } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      starts_at: now,
      validated_at: now,
      validated_by: user.id
    })
    .eq('id', subscriptionId)

  if (subErr) return { error: 'Error al actualizar suscripción' }

  // Actualizar barbería
  const { error: barbErr } = await supabase
    .from('barbershops')
    .update({
      subscription_status: 'active',
      subscription_starts_at: now,
      subscription_renews_at: sub.ends_at,
      subscription_amount: sub.amount,
      subscription_payment_method: sub.payment_method
    })
    .eq('id', sub.barbershop_id)

  if (barbErr) return { error: 'Error al actualizar barbería' }

  revalidatePath('/admin/pagos')
  revalidatePath('/admin/clientes')
  return { ok: true }
}
