import styles from './landing.module.css'

export default function Testimonial() {
  return (
    <section className={styles.section}>
      <div className={styles.testimonial}>
        <blockquote>
          &ldquo;Antes cerraba la semana con una planilla de Excel que me llevaba una hora.
          Ahora lo veo en tiempo real sin hacer nada.&rdquo;
        </blockquote>
        <div className={styles.testimonialAuthor}>
          <div className={styles.tAvatar}>AC</div>
          <div>
            <div className={styles.tName}>Ariel C.</div>
            <div className={styles.tRole}>Dueño de barbería · Buenos Aires</div>
          </div>
        </div>
      </div>
    </section>
  )
}
