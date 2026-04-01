import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import styles from '../result.module.css'
import { createClient } from '@/lib/supabase/server'

export default async function SuscripcionExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string; planName?: string }>
}) {
  const { barbershopId: rawBarbershopId, planName: rawPlanName } = await searchParams
  const barbershopId = rawBarbershopId?.split('?')[0]
  const planName = rawPlanName?.split('?')[0]

  // Refrescar el access token del usuario antes de renderizar
  const userClient = await createClient()
  await userClient.auth.getUser()
  const agendaHref = barbershopId ? `/dashboard/${barbershopId}/agenda` : '/dashboard'

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.iconWrap}>
          <CheckCircle className={styles.iconSuccess} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>¡Bienvenido al Plan {planName ?? 'Base'}!</h1>
        <p className={styles.description}>
          Tu suscripción se acreditó correctamente. Ya podés seguir gestionando el negocio con todas las funciones premium.
        </p>
        <Link href={agendaHref} className={styles.cta}>
          Ir a la Agenda
        </Link>
      </section>
    </main>
  )
}
