'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import * as galiopayService from '@/services/galiopay.service'
import * as barbershopRepo from '@/repositories/barbershop.repository'

const BASE_PRICE = 11999
const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.08, 6: 0.13, 12: 0.20 }

export async function createGalioPAyPaymentLink(barbershopId: string, months: number): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const barbershop = await barbershopRepo.findNameByIdAndOwner(supabase, barbershopId, user.id)
  if (!barbershop) redirect('/dashboard')

  const discount = DISCOUNTS[months] ?? 0
  const pricePerMonth = Math.round(BASE_PRICE * (1 - discount))
  const totalPrice = pricePerMonth * months
  const label = months === 1 ? '1 mes' : `${months} meses`

  const referenceId = `FILODESK-${barbershopId.slice(0, 8)}-${Date.now()}`

  const result = await galiopayService.createPaymentLink({
    referenceId,
    amount: totalPrice,
    description: `FiloDesk — ${barbershop.name} (${label})`,
    email: user.email,
    name: barbershop.name,
  })

  if (result.error) {
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=galiopay`)
  }

  // Redirigir al link de pago de GalioPay
  redirect(result.paymentLink.url)
}
