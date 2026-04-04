import styles from './landing.module.css'
import AnimateOnScroll from './AnimateOnScroll'

const TESTIMONIALS = [
  {
    text: '"Antes liquidar comisiones me llevaba dos horas y siempre había algún quilombo. Ahora FiloDesk lo calcula solo. Cada barbero ve su comisión en tiempo real y no hay de qué discutir."',
    name: 'Juan "El Tano"',
    role: 'Dueño · Barbería Sin Nombre, CABA',
  },
  {
    text: '"Por fin sé exactamente cuánto me queda a mí. Ingresos menos comisiones menos gastos — el número aparece solo. Nunca más cerré un mes sin saber si gané o perdí."',
    name: 'Nico Barber',
    role: 'Fundador · High Precision, Rosario',
  },
  {
    text: '"Lo uso desde el celular en el local, sin instalar nada. Registro cada servicio en segundos y la agenda de los chicos siempre está actualizada. Simple como tiene que ser."',
    name: 'David G.',
    role: 'Propietario · Urban Cut, Mendoza',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonios" className={styles.testimonialsSection}>
      <AnimateOnScroll className={styles.sectionHeader}>
        <h2 className={`${styles.sectionH2} ${styles.testimonialsTitle}`}>
          Lo que dicen los <em>maestros del oficio</em>
        </h2>
      </AnimateOnScroll>

      <div className={styles.testimonialsGrid}>
        {TESTIMONIALS.map((t, i) => (
          <AnimateOnScroll key={t.name} className={styles.testimonialCard} delay={i * 100}>
            <span className={styles.testimonialQuote}>&ldquo;</span>
            <p className={styles.testimonialText}>{t.text}</p>
            <div className={styles.testimonialAuthor}>
              <span className={styles.testimonialName}>{t.name}</span>
              <span className={styles.testimonialRole}>{t.role}</span>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  )
}
