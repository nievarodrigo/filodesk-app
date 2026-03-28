import styles from './landing.module.css'

const trustItems = [
  {
    title: 'Pensado para barberías de Argentina',
    desc: 'Flujos y lenguaje hechos para el día a día de barberías en CABA, GBA y todo el país.',
  },
  {
    title: 'Acompañamiento real por WhatsApp',
    desc: 'No te dejamos solo: te ayudamos a configurar y arrancar desde el primer día.',
  },
  {
    title: 'Casos y métricas públicas en camino',
    desc: 'Estamos preparando testimonios, casos reales y métricas de uso para esta sección.',
  },
]

export default function SocialProof() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>Confianza</div>
      <div className={styles.sectionTitle}>Construido junto a dueños de barberías</div>
      <div className={styles.sectionSub}>Producto simple, soporte humano y foco total en resultados reales.</div>

      <div className={styles.trustGrid}>
        {trustItems.map((item) => (
          <article key={item.title} className={styles.trustCard}>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
