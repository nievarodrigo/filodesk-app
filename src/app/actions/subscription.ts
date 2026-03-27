'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'

export async function createMPSubscription(barbershopId: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const mpEmail = (formData.get('mpEmail') as string)?.trim() || user.email!

  const result = await subscriptionService.createMPSubscription(
    supabase, barbershopId, user.id, mpEmail
  )

  if (result.error === 'not_found') redirect('/dashboard')
  if (result.error) redirect(`/suscripcion?barbershopId=${barbershopId}&error=1`)

  redirect(result.redirectUrl!)
}
