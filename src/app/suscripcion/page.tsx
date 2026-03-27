import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuscripcionClient from './SuscripcionClient'

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string }>
}) {
  const { barbershopId } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  if (!barbershopId) redirect('/dashboard')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('name, subscription_status, trial_ends_at')
    .eq('id', barbershopId)
    .single()

  if (!barbershop) redirect('/dashboard')
  if (barbershop.subscription_status === 'active') redirect(`/dashboard/${barbershopId}`)

  const trialEnd = barbershop.trial_ends_at
    ? new Date(barbershop.trial_ends_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    : null

  return (
    <SuscripcionClient
      barbershopId={barbershopId}
      barbershopName={barbershop.name}
      subscriptionStatus={barbershop.subscription_status}
      trialEnd={trialEnd}
    />
  )
}
