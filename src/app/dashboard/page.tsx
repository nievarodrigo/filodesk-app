import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Detecta cuántas barberías tiene y redirige
export default async function DashboardRouter() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id, subscription_status, trial_ends_at')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: true })

  if (!barbershops || barbershops.length === 0) {
    redirect('/onboarding')
  }

  const barbershop = barbershops[0]

  // Chequear si el trial expiró
  if (barbershop.subscription_status === 'trial' && barbershop.trial_ends_at) {
    const expired = new Date(barbershop.trial_ends_at) < new Date()
    if (expired) {
      redirect(`/suscripcion?barbershopId=${barbershop.id}`)
    }
  }

  // Suscripción vencida
  if (barbershop.subscription_status === 'expired') {
    redirect(`/suscripcion?barbershopId=${barbershop.id}`)
  }

  redirect(`/dashboard/${barbershop.id}`)
}
