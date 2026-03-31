import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import styles from './landing.module.css'

export default async function Hero() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  return (
    <div className={styles.hero}>
      <div className={styles.heroBadge}>✦ Hecho para barberías argentinas</div>
      <h1>
        Tu barbería,<br />
        bajo <span>control</span>.
      </h1>
      <p>
        Ventas, comisiones, gastos y ganancias — todo en un solo lugar.
        Dejá de perder plata por no tener los números claros.
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
