import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getServerAuthContext } from '@/services/auth.service'
import SuscripcionClient from './SuscripcionClient'

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string }>
}) {
  const { barbershopId } = await searchParams
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (!barbershopId) redirect('/dashboard')

  const context = await getServerAuthContext(supabase, barbershopId, user.id, serviceClient)
  const { data: barbershop, error } = await serviceClient
    .from('barbershops')
    .select('name, subscription_status, trial_ends_at, plan_name')
    .eq('id', barbershopId)
    .single()

  if (error || !barbershop) redirect('/dashboard')

  if (!context || (context.role !== 'owner' && context.role !== 'manager')) {
    redirect('/dashboard')
  }

  // Obtener planes desde DB (Issue Medium - Single Source of Truth)
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('active', true)
    .order('price', { ascending: true })

  const trialEnd = barbershop.trial_ends_at
    ? new Date(barbershop.trial_ends_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <SuscripcionClient
      barbershopId={barbershopId}
      barbershopName={barbershop.name}
      currentPlan={barbershop.plan_name ?? 'Base'}
      subscriptionStatus={barbershop.subscription_status}
      trialEnd={trialEnd}
      plans={plans || []}
    />
  )
}
