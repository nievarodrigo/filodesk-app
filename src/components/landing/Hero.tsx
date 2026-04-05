import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import styles from './landing.module.css'

const CHART_BARS = [
  { height: '40%', opacity: '0.1' },
  { height: '55%', opacity: '0.2' },
  { height: '45%', opacity: '0.3' },
  { height: '70%', opacity: '0.4' },
  { height: '60%', opacity: '0.6' },
  { height: '85%', opacity: '0.8' },
  { height: '100%', opacity: '1'   },
]

const AVATARS = [
  { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmWLwIOn0xiJxoLS28HVJzwFM_v9oy6QMlz1MZ1eccJHdSGVYJ2byocFqtw76c1JH3rPUMYlw0TzZ3_nY0ZykZKIvoZjCS5QjJ1678-IN0dc-vWyldHqs38JKXJtOZ0OE8GQRUiGAYp-dZEJKMzwfXCVdoP9Z4R3-aoziZqpuZ1UCrhbBsZFxEmhPRO5Gh9pAZDUE9Dt_BUo76aJ6w37YxE-p4NUp3CxPNMBkKUEl3iz_0PCrRtv3IIe97VNdPd6iXC4iS1OLU4oM', alt: 'Barbero' },
  { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoFD2NDzQFqxi898K5etxpPZjOFy_QrVTl9sIbX-zSSPLqtbf8xGobuhrUwzFyz4qloUcLCLYpaoyhUq1S58eHxnKXajsnfAZszN7S2ltHh4mpRi2woSo92PjGikrSMj3DHM5XfOaLcgpiPxmGyIMoeBqRrvSrEG5XPzts8Xop0rLge4x8CJgML-k7v5MpwfTjP-F6KsbVoI5p4YZBc7izs1lyfoQe75bNeWw0IuAOJHxs6vXSkAEfwR0_peZudKUe8ryFu-rCc9A', alt: 'Barbero' },
  { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBce1RsDJM81bxkpzyHTChuPImbeSKQmz3KPTPFjLdi2Plsuc8UjAAls7Ghw6vNXz4xLDcU1uM3zUI50MR_iXOI7uxUncWa3udF-wYw306eGNeSbAn3QcPD2xzwQZZB_PpvDzEk9_g4haspJqxlDfBKA6te5sGUd47QepDNexWGGK9Zl9I3YkaehHeGgDMitJoYPAytMYQk9UA0KgcM9xRQBNGBdLJYEjBD9kQUuVYtcwplNX17kqnTcb5t_EN2mq7Rh8tu_hrnXpo', alt: 'Barbero' },
]

export default async function Hero() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  return (
    <section className={styles.heroSection}>
      {/* Left: Text */}
      <div className={styles.heroText}>
        <h1 className={styles.heroH1}>
          Colgá el cuaderno. <span className={styles.heroAccent}>Digitalizá</span> tu oficio.
        </h1>

        <p className={styles.heroP}>
          Dejá de perder tiempo liquidando comisiones a mano y olvidate de los errores de cálculo. Controlá tus ventas, barberos y stock desde una sola app pensada por y para barberos profesionales.
        </p>

        <div className={styles.heroCta}>
          {user ? (
            <Link href="/dashboard">
              <button className={`${styles.btnPrimary} ${styles.btnPrimaryLg}`}>
                Ir al dashboard →
              </button>
            </Link>
          ) : (
            <>
              <Link href="/auth/register">
                <button className={`${styles.btnPrimary} ${styles.btnPrimaryLg}`}>
                  Empezar gratis
                </button>
              </Link>
              <button className={styles.btnSecondary}>Ver Demo</button>
            </>
          )}
        </div>

        <div className={styles.heroSocialProof}>
          <div className={styles.avatarStack}>
            {AVATARS.map((a, i) => (
              <Image key={i} src={a.src} alt={a.alt} width={40} height={40} />
            ))}
          </div>
          <p className={styles.heroSocialText}>
            <span className={styles.heroSocialCount}>+500</span> barberías ya confían
          </p>
        </div>
      </div>

      {/* Right: Chart widget */}
      <div className={styles.heroWidget}>
        <div className={styles.widgetGlow} />
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <div>
              <p className={styles.widgetLabel}>Ingresos Mensuales</p>
              <p className={styles.widgetAmount}>$ 1.250.000,00</p>
            </div>
            <span className={styles.widgetBadge}>+12%</span>
          </div>

          <div className={styles.chartBars}>
            {CHART_BARS.map((bar, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: bar.height,
                  borderRadius: '0.25rem 0.25rem 0 0',
                  background: i === CHART_BARS.length - 1
                    ? 'linear-gradient(135deg, #f2c345 0%, #d4a82a 100%)'
                    : `rgba(242, 195, 69, ${bar.opacity})`,
                }}
              />
            ))}
          </div>

          <div className={styles.widgetDays}>
            {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
