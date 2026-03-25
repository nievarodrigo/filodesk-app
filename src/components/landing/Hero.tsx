import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import styles from './landing.module.css'

export default async function Hero() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  return (
    <div className={styles.hero}>
      <div className={styles.heroBadge}>✦ Para dueños de barberías</div>
      <h1>
        Sabé exactamente<br />
        cuánto <span>ganás</span>.
      </h1>
      <p>
        La herramienta que tu barbería necesitaba. Comisiones, gastos y ganancia
        — todo calculado solo, para que vos te enfoques en crecer.
      </p>
      <div className={styles.heroCta}>
        {user ? (
          <Link href="/dashboard">
            <button className={`${styles.btn} ${styles.btnLg}`}>Ir al dashboard →</button>
          </Link>
        ) : (
          <>
            <Link href="/auth/register">
              <button className={`${styles.btn} ${styles.btnLg}`}>Empezar gratis 14 días</button>
            </Link>

          </>
        )}
      </div>
      <div className={styles.heroSub}>Sin tarjeta de crédito · Cancelás cuando querés</div>
    </div>
  )
}
