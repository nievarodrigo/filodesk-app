import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  const { type, data } = body

  // Solo procesamos eventos de suscripción
  if (type !== 'subscription_preapproval') {
    return NextResponse.json({ ok: true })
  }

  const subscriptionId = data?.id
  if (!subscriptionId) return NextResponse.json({ ok: false }, { status: 400 })

  // Consultamos el estado actual de la suscripción en MP
  const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  const subscription = await mpRes.json()

  if (!mpRes.ok) {
    console.error('[MP webhook] error fetching subscription', subscription)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const barbershopId = subscription.external_reference
  const mpStatus     = subscription.status // authorized, paused, cancelled, pending

  let subscriptionStatus: 'active' | 'expired'
  if (mpStatus === 'authorized') {
    subscriptionStatus = 'active'
  } else {
    subscriptionStatus = 'expired'
  }

  const supabase = await createClient()
  await supabase
    .from('barbershops')
    .update({
      subscription_status: subscriptionStatus,
      mp_subscription_id: subscriptionId,
    })
    .eq('id', barbershopId)

  return NextResponse.json({ ok: true })
}
