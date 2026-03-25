import styles from './landing.module.css'

const steps = [
  {
    num: '1',
    title: 'Creás tu cuenta',
    desc: 'Te registrás con tu mail, configurás tu barbería y agregás a tus barberos. Tarda menos de 5 minutos.',
  },
  {
    num: '2',
    title: 'Registrás las ventas del día',
    desc: 'Cada servicio, producto o café que se vende se carga en segundos. Los números se actualizan solos.',
  },
  {
    num: '3',
    title: 'Cerrás la semana con todo claro',
    desc: 'Sabés cuánto ganó cada barbero, cuánto gastaste y cuánto te queda a vos. Todo en una pantalla.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className={styles.section}>
      <div className={styles.sectionLabel}>Cómo funciona</div>
      <div className={styles.sectionTitle}>En tres pasos</div>
      <div className={styles.sectionSub}>Empezás a usarlo el mismo día, sin capacitación ni instalaciones.</div>

      <div className={styles.stepsGrid}>
        {steps.map((s) => (
          <div key={s.num} className={styles.step}>
            <div className={styles.stepNum}>{s.num}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
