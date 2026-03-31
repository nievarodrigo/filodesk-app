import styles from './landing.module.css'

const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
    title: 'Registrá ventas en segundos',
    desc: 'Seleccionás el barbero, el servicio y listo. FiloDesk registra la venta, calcula la comisión y actualiza los números al instante.',
    mobileTitle: 'Registro de ventas rápido',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Comisiones automáticas',
    desc: 'Configurás el porcentaje de cada barbero una sola vez. Cada venta calcula su comisión automáticamente, sin fórmulas ni errores.',
    mobileTitle: 'Comisiones automáticas por barbero',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Tu ganancia real del mes',
    desc: 'Ingresos menos comisiones menos gastos: el número que importa, calculado en automático. Sin planillas, sin estimaciones.',
    mobileTitle: 'Ganancia neta en tiempo real',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Gastos y nóminas',
    desc: 'Registrás alquiler, insumos, sueldos y cualquier egreso del local. Todo se descuenta automáticamente de tu ganancia neta.',
    mobileTitle: 'Gastos y nóminas del local',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Agenda de turnos',
    desc: 'Organizá los turnos de cada barbero en una grilla visual por día. Para las barberías que trabajan con reservas.',
    mobileTitle: 'Agenda de turnos',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    title: 'Control de stock',
    desc: 'Llevás el inventario de productos con alertas de reposición. Cada venta descuenta el stock automáticamente.',
    mobileTitle: 'Control de stock con alertas',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    title: 'Gráficos y estadísticas',
    desc: 'Visualizá ventas por barbero, ingresos por mes y tendencias del negocio. Para tomar decisiones con datos reales.',
    mobileTitle: 'Gráficos y estadísticas',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
    title: 'Desde el celular, sin instalar apps',
    desc: 'Abrís FiloDesk desde el navegador del celu y funciona igual que en la compu. Sin descargas, sin actualizaciones manuales.',
    mobileTitle: 'Funciona desde el celular',
  },
]

export default function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.featuresDesktop}>
        <div className={styles.sectionLabel}>Funciones</div>
        <div className={styles.sectionTitle}>Todo lo que necesitás para gestionar</div>
        <div className={styles.sectionSub}>Sin complicaciones, sin planillas y sin perder tiempo.</div>

        <div className={styles.featuresGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.featuresMobile}>
        <div className={styles.featuresListTitle}>Descubrí todo lo que podés hacer con nuestro sistema:</div>
        <ul className={styles.featuresMinimalList}>
          {features.map((f) => (
            <li key={f.title} className={styles.featureRow}>
              <span className={styles.featureRowIcon} aria-hidden="true">{f.icon}</span>
              <span className={styles.featureRowText}>{f.mobileTitle ?? f.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
