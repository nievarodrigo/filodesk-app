import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { getServerAuthContext } from '@/services/auth.service'
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

  const authContext = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!authContext) redirect('/dashboard')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id, name, subscription_status, trial_ends_at, subscription_renews_at, subscription_payment_method')
    .eq('id', barbershopId)
    .single()

  if (!barbershop) redirect('/dashboard')

  // Chequear suscripción en cada carga del dashboard
  const status = barbershop.subscription_status
  const trialEndsAt = barbershop.trial_ends_at ? new Date(barbershop.trial_ends_at) : null
  const trialStillActive = trialEndsAt && trialEndsAt > new Date()

  // Si el trial todavía no vence, dejar pasar sin importar el status en DB
  if (!trialStillActive) {
    if (status === 'expired') {
      redirect(`/suscripcion?barbershopId=${barbershopId}`)
    }
    if (status === 'trial') {
      redirect(`/suscripcion?barbershopId=${barbershopId}`)
    }
  }
  // Pago único vencido: si pagó con checkout_pro y la fecha de renovación ya pasó
  if (status === 'active' && barbershop.subscription_payment_method === 'checkout_pro') {
    const renewsAt = barbershop.subscription_renews_at ? new Date(barbershop.subscription_renews_at) : null
    if (renewsAt && renewsAt < new Date()) {
      // Marcar como expirado y redirigir
      await supabase.from('barbershops').update({ subscription_status: 'expired' }).eq('id', barbershopId)
      redirect(`/suscripcion?barbershopId=${barbershopId}`)
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar barbershopId={barbershopId} barbershopName={barbershop.name} role={authContext.role} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
