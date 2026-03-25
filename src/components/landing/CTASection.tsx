import Link from 'next/link'
import styles from './landing.module.css'

export default function CTASection() {
  return (
    <div className={styles.ctaSection}>
      <h2>Tu barbería merece algo<br />mejor que un <span>Excel</span>.</h2>
      <p>Empezá gratis hoy. Sin tarjeta de crédito.</p>
      <Link href="/auth/register">
        <button className={`${styles.btn} ${styles.btnLg}`}>Crear mi cuenta gratis</button>
      </Link>
    </div>
  )
}
