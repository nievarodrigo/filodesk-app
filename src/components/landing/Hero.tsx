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
        Dejá el Excel.<br />
        Usá <span>FiloDesk</span>.
      </h1>
      <p>
        Sabé cuánto generó cada barbero, cuánto te queda a vos y qué hay en caja —
        todo en un solo lugar, en tiempo real.
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
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}>Ver demo</button>
          </>
        )}
      </div>
      <div className={styles.heroSub}>Sin tarjeta de crédito · Cancelás cuando querés</div>
    </div>
  )
}
