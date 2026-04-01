'use server'

import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'

const TESTING_BARBERSHOP_ID = 'bba517b8-ea61-45d0-8b70-adb41298d54f'

export async function createMPSubscription(barbershopId: string, planId: string = 'base'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (planId === 'pro' && barbershopId !== TESTING_BARBERSHOP_ID) {
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=${encodeURIComponent('El Plan Pro estará disponible muy pronto.')}`)
  }

  let result: Awaited<ReturnType<typeof subscriptionService.createMPSubscription>>
  try {
    result = await subscriptionService.createMPSubscription(
      supabase, barbershopId, user.id, planId
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Subscription Action] createMPSubscription failed:', error)
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=unexpected_error`)
  }

  if (result.error === 'not_found') redirect('/dashboard')
  if (result.error) redirect(`/suscripcion?barbershopId=${barbershopId}&error=${result.error}`)

  redirect(result.redirectUrl!)
}

export async function createMPCheckoutWithMonths(barbershopId: string, months: number, planId: string = 'base'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (planId === 'pro' && barbershopId !== TESTING_BARBERSHOP_ID) {
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=${encodeURIComponent('El Plan Pro estará disponible muy pronto.')}`)
  }

  let result: Awaited<ReturnType<typeof subscriptionService.createMPCheckout>>
  try {
    result = await subscriptionService.createMPCheckout(
      supabase, barbershopId, user.id, months, planId
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Subscription Action] createMPCheckoutWithMonths failed:', error)
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=unexpected_error`)
  }

  if (result.error === 'not_found') redirect('/dashboard')
  if (result.error) redirect(`/suscripcion?barbershopId=${barbershopId}&error=${result.error}`)

  redirect(result.redirectUrl!)
}

export async function createBankTransfer(barbershopId: string, months: number, planId: string = 'base'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let result: Awaited<ReturnType<typeof subscriptionService.createBankTransfer>>
  try {
    result = await subscriptionService.createBankTransfer(
      supabase, barbershopId, user.id, months, planId
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('[Subscription Action] createBankTransfer failed:', error)
    redirect(`/suscripcion?barbershopId=${barbershopId}&error=unexpected_error`)
  }

  if (result.error === 'not_found') redirect('/dashboard')
  if (result.error) redirect(`/suscripcion?barbershopId=${barbershopId}&error=${result.error}`)

  redirect(result.redirectUrl!)
}
