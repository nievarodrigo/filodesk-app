import Link from 'next/link'
import styles from './landing.module.css'
import { ScissorsIcon } from './LandingIcons'
import AnimateOnScroll from './AnimateOnScroll'

export default function CTASection() {
  return (
    <section className={styles.finalCta}>
      <div className={styles.ctaTopDivider}>
        <div className={styles.ctaOrnament}>
          <ScissorsIcon size={20} />
        </div>
      </div>

      <AnimateOnScroll className={styles.ctaContent}>
        <h2 className={styles.ctaH2}>Subí el <span className={styles.ctaAccent}>nivel</span> de tu barbería, hoy.</h2>
        <p className={styles.ctaP}>
          Unite a la comunidad de barberos más grande de Argentina y empezá a profesionalizar tu pasión.
        </p>
        <Link href="/auth/register">
          <button className={styles.btnCtaMain}>Crear mi cuenta gratis</button>
        </Link>
      </AnimateOnScroll>
    </section>
  )
}
