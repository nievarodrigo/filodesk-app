'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import * as galiopayService from '@/services/galiopay.service'
import * as barbershopRepo from '@/repositories/barbershop.repository'
import * as checkoutIntentRepo from '@/repositories/checkout-intent.repository'

const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.08, 6: 0.13, 12: 0.20 }

export async function createGalioPayPaymentLink(barbershopId: string, months: number, planId: string = 'base'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, user.id)
  if (!barbershop) redirect('/dashboard')

  // Leer el precio real del plan desde la base de datos, no hardcodearlo
  const { data: planData } = await supabase
    .from('plans')
    .select('price, name')
    .eq('id', planId)
    .eq('active', true)
    .single()

  if (!planData) redirect(`/suscripcion?barbershopId=${barbershopId}&error=invalid_plan`)

  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(planData.price * (1 - discount))
  const totalPrice = pricePerMonth * months
  const label = months === 1 ? '1 mes' : `${months} meses`

  // 1. Crear intención de pago para tracking y seguridad
  const intentResult = await checkoutIntentRepo.create(supabase, {
    barbershop_id: barbershopId,
    months,
    expected_amount: totalPrice,
    plan_id: planId,
    currency_id: 'ARS',
  })

  if (intentResult.error) {
    console.error('[GalioPay Action] intent creation failed:', intentResult.error)
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=intent_creation_failed`)
  }

  const intentId = intentResult.data.id

  // 2. Generar link de pago en GalioPay usando el intentId como referencia
  const result = await galiopayService.createPaymentLink({
    referenceId: intentId, // El webhook recibe este UUID para encontrar el intent
    amount: totalPrice,
    description: `FiloDesk — ${barbershop.name} (Plan ${planData.name}) — ${label}`,
    email: user.email ?? undefined,
    name: barbershop.name,
  })

  if ('error' in result) {
    console.error('[GalioPay Action] API error:', result.error)
    await checkoutIntentRepo.markFailed(supabase, intentId)
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=galiopay`)
  }

  redirect(result.paymentLink.url)
}
