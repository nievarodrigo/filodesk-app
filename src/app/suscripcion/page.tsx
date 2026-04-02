// Build Version: 2026-03-29.01 (Force clean build)
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

  const trialEndsAt = barbershop.trial_ends_at ? new Date(barbershop.trial_ends_at) : null
  const trialEnd = trialEndsAt
    ? trialEndsAt.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // Si trial_ends_at es futuro, forzar status 'trial' sin importar lo que diga la DB
  const now = new Date()
  const effectiveStatus =
    barbershop.subscription_status === 'active'
      ? 'active'
      : trialEndsAt && trialEndsAt > now
        ? 'trial'
        : barbershop.subscription_status

  const TESTING_BARBERSHOP_ID = 'bba517b8-ea61-45d0-8b70-adb41298d54f'
  const proAvailable = barbershopId === TESTING_BARBERSHOP_ID

  return (
    <SuscripcionClient
      barbershopId={barbershopId}
      barbershopName={barbershop.name}
      currentPlan={barbershop.plan_name ?? 'Base'}
      subscriptionStatus={effectiveStatus}
      trialEnd={trialEnd}
      plans={plans || []}
      proAvailable={proAvailable}
    />
  )
}
