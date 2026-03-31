import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import styles from '../result.module.css'

export default async function SuscripcionErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string }>
}) {
  const { barbershopId: rawBarbershopId } = await searchParams
  const barbershopId = rawBarbershopId?.split('?')[0]
  const retryHref = barbershopId ? `/suscripcion?barbershopId=${barbershopId}` : '/suscripcion'

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.iconWrap}>
          <AlertTriangle className={styles.iconError} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>Hubo un problema con el pago</h1>
        <p className={styles.description}>
          No pudimos completar la operación. Volvé a intentarlo y, si persiste, escribinos para ayudarte enseguida.
        </p>
        <Link href={retryHref} className={styles.cta}>
          Reintentar suscripción
        </Link>
      </section>
    </main>
  )
}
