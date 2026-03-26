'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createMPSubscription(barbershopId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('name')
    .eq('id', barbershopId)
    .eq('owner_id', user.id)
    .single()

  if (!barbershop) return { error: 'Barbería no encontrada.' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://filodesk.app'

  const body = {
    reason: `FiloDesk — ${barbershop.name}`,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 11999,
      currency_id: 'ARS',
    },
    back_url: `${siteUrl}/suscripcion/exito?barbershopId=${barbershopId}`,
    payer_email: user.email,
    external_reference: barbershopId,
    status: 'pending',
  }

  const res = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok || !data.init_point) {
    console.error('[MP subscription]', data)
    return { error: 'No se pudo generar el link de pago. Intentá de nuevo.' }
  }

  redirect(data.init_point)
}
