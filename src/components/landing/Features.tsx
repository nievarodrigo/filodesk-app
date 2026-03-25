import styles from './landing.module.css'

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
        <line x1="20" y1="4" x2="8.12" y2="15.88"/>
        <line x1="14.47" y1="14.48" x2="20" y2="20"/>
        <line x1="8.12" y1="8.12" x2="12" y2="12"/>
      </svg>
    ),
    title: 'Rendimiento por barbero',
    desc: 'Registrá los cortes, barbas y cejas de cada barbero. FiloDesk calcula automáticamente cuánto le corresponde cobrar.',
    highlight: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Tu ganancia en tiempo real',
    desc: 'Ves en todo momento cuánto entra, cuánto se va en sueldos y cuánto queda para vos. Sin sorpresas al cerrar la semana.',
    highlight: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    title: 'Control de caja',
    desc: 'Sabés exactamente cuánta plata tiene que haber en caja en cada momento. Si no coincide, algo está mal.',
    highlight: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: 'Ventas semanales',
    desc: 'Gráfico de ventas por día para ver tus mejores momentos y planificar mejor. ¿Qué día conviene poner promociones?',
    highlight: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    title: 'Gastos del local',
    desc: 'Publicidad, insumos, alquiler, café para clientes — todo registrado y descontado de tu ganancia real.',
    highlight: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
    title: 'Desde el celular, sin apps',
    desc: 'Abrís FiloDesk desde el navegador de tu celu y funciona igual que en la PC. Revisá tu ganancia del día desde donde estés.',
    highlight: true,
  },
]

export default function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.sectionLabel}>Features</div>
      <div className={styles.sectionTitle}>Todo lo que necesitás para gestionar</div>
      <div className={styles.sectionSub}>Sin complicaciones, sin planillas, sin perder el tiempo.</div>

      <div className={styles.featuresGrid}>
        {features.map((f) => (
          <div
            key={f.title}
            className={styles.featureCard}
            style={f.highlight ? {
              borderColor: 'rgba(196,30,58,.3)',
            } : {}}
          >
            <div className={styles.featureIcon}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
