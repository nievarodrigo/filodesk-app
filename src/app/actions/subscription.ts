'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'

export async function createMPSubscription(barbershopId: string, planId: string = 'base'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await subscriptionService.createMPSubscription(
    supabase, barbershopId, user.id, planId
  )

  if (result.error === 'not_found') redirect('/dashboard')
  if (result.error) redirect(`/suscripcion?barbershopId=${barbershopId}&error=${result.error}`)

  redirect(result.redirectUrl!)
}

export async function createMPCheckoutWithMonths(barbershopId: string, months: number, planId: string = 'base'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await subscriptionService.createMPCheckout(
    supabase, barbershopId, user.id, months, planId
  )

  if (result.error === 'not_found') redirect('/dashboard')
  if (result.error) redirect(`/suscripcion?barbershopId=${barbershopId}&error=${result.error}`)

  redirect(result.redirectUrl!)
}

export async function createBankTransfer(barbershopId: string, months: number, planId: string = 'base'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await subscriptionService.createBankTransfer(
    supabase, barbershopId, user.id, months, planId
  )

  if (result.error === 'not_found') redirect('/dashboard')
  if (result.error) redirect(`/suscripcion?barbershopId=${barbershopId}&error=${result.error}`)

  redirect(result.redirectUrl!)
}
