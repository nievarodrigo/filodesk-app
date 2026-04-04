import styles from './landing.module.css'
import AnimateOnScroll from './AnimateOnScroll'

const STATS = [
  {
    value: '3 hs',
    label: 'perdidas por semana',
    detail: 'liquidando comisiones a mano con Excel o papel',
  },
  {
    value: '1 de 3',
    label: 'servicios sin registrar',
    detail: 'en días de alta carga cuando no hay sistema',
  },
  {
    value: '-68%',
    label: 'menos tiempo administrativo',
    detail: 'con FiloDesk vs gestión manual',
  },
  {
    value: '100%',
    label: 'visibilidad en tiempo real',
    detail: 'de ganancia neta, comisiones y stock — desde el celu',
  },
]

const COMPARISON = [
  {
    metric: 'Liquidar comisiones',
    before: '~3 horas / semana',
    after: 'Automático al registrar',
  },
  {
    metric: 'Ver ganancia neta del mes',
    before: 'Estimada, al cierre del mes',
    after: 'Exacta, en tiempo real',
  },
  {
    metric: 'Registrar un servicio',
    before: '2–3 min con papel o anotación',
    after: 'Menos de 30 segundos',
  },
  {
    metric: 'Errores de cálculo',
    before: 'Frecuentes (fórmulas rotas, olvidos)',
    after: 'Cero — cálculo automático',
  },
  {
    metric: 'Control de stock',
    before: '"Creo que queda..."',
    after: 'Actualizado al instante por cada venta',
  },
]

export default function StatsSection() {
  return (
    <section className={styles.statsSection}>
      <AnimateOnScroll className={styles.sectionHeader}>
        <h2 className={styles.sectionH2}>
          El costo oculto de <span className={styles.sectionH2Accent}>no tener un sistema</span>
        </h2>
        <p className={styles.sectionP}>
          No es solo incomodidad. Cada semana sin un sistema tiene un precio real en tiempo, plata y decisiones que se toman a ciegas.
        </p>
      </AnimateOnScroll>

      {/* Big stats */}
      <div className={styles.statsGrid}>
        {STATS.map((s, i) => (
          <AnimateOnScroll key={s.label} className={styles.statCard} delay={i * 80}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statDetail}>{s.detail}</span>
          </AnimateOnScroll>
        ))}
      </div>

      {/* Comparison table */}
      <AnimateOnScroll className={styles.comparisonWrap} delay={120}>
        <div className={styles.comparisonTable}>
          {/* Header */}
          <div className={styles.comparisonHeader}>
            <span className={styles.comparisonMetricHead} />
            <span className={styles.comparisonBeforeHead}>Papel / Excel</span>
            <span className={styles.comparisonAfterHead}>FiloDesk</span>
          </div>

          {/* Rows */}
          {COMPARISON.map((row) => (
            <div key={row.metric} className={styles.comparisonRow}>
              <span className={styles.comparisonMetric}>{row.metric}</span>
              <span className={styles.comparisonBefore}>{row.before}</span>
              <span className={styles.comparisonAfter}>{row.after}</span>
            </div>
          ))}
        </div>
      </AnimateOnScroll>
    </section>
  )
}
