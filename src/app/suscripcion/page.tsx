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
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (!barbershopId) redirect('/dashboard')

  // SECURITY: Filtrar por owner_id (Issue Medium)
  const { data: barbershop, error } = await supabase
    .from('barbershops')
    .select('name, subscription_status, trial_ends_at')
    .eq('id', barbershopId)
    .eq('owner_id', user.id)
    .single()

  if (error || !barbershop) redirect('/dashboard')
  if (barbershop.subscription_status === 'active') redirect(`/dashboard/${barbershopId}`)

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
      subscriptionStatus={barbershop.subscription_status}
      trialEnd={trialEnd}
      plans={plans || []}
    />
  )
}
