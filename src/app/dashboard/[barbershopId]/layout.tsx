import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import styles from './layout.module.css'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id, name, subscription_status, trial_ends_at')
    .eq('id', barbershopId)
    .eq('owner_id', session.user.id)
    .single()

  if (!barbershop) redirect('/dashboard')

  // Chequear suscripción en cada carga del dashboard
  const status = barbershop.subscription_status
  if (status === 'expired') {
    redirect(`/suscripcion?barbershopId=${barbershopId}`)
  }
  if (status === 'trial') {
    const endsAt = barbershop.trial_ends_at ? new Date(barbershop.trial_ends_at) : new Date(0)
    if (endsAt < new Date()) {
      redirect(`/suscripcion?barbershopId=${barbershopId}`)
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar barbershopId={barbershopId} barbershopName={barbershop.name} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
