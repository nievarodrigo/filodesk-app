import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'
import styles from './onboarding.module.css'

export const metadata: Metadata = { title: 'Configurá tu barbería' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Si ya tiene barbería, ir al dashboard
  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)

  if (barbershops && barbershops.length > 0) {
    redirect(`/dashboard/${barbershops[0].id}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>✦ FiloDesk</div>
        <p className={styles.step}>Paso 1 de 1</p>
        <h1 className={styles.title}>Configurá tu barbería</h1>
        <p className={styles.subtitle}>
          Estos datos aparecen en tu dashboard. Los podés cambiar cuando quieras.
        </p>
        <OnboardingForm />
      </div>
    </div>
  )
}
