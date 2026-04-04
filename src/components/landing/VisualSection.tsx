import Image from 'next/image'
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

export default function VisualSection() {
  return (
    <section className={styles.visualSection}>
      {/* Imagen de fondo fija para toda la sección */}
      <div className={styles.visualBgWrap}>
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0J1Dbl_G49oE4wCvcha8X0eAuIR6RCMzBcP_4ekiNJoyrGN7o9TjuV0BQ0aIcgz14K2zS_UdH6FGgoP5-o_h3iuIibMaWIdej-fKew0fA5EFuzQN__8SGcFoDU_5YVUTrRok4R5BQIYS3NAje3HSXY4lIMzpP9Kqy6LpU48PYEiyBigNtnieXsi14V4gTaJj0fMOl5yLHegf8q_KP1ZgEV40lkKMcR4o_5OZ7umkcOgCT20IhqSvJtJb-XC_1NbgjO2HWoOf2ghQ"
          alt="Interior de una barbería de lujo"
          fill
          className={styles.visualBg}
          sizes="100vw"
        />
        {/* Overlay: suave arriba, más opaco abajo para que los datos sean legibles */}
        <div className={styles.visualOverlay} />
      </div>

      {/* Contenido sobre la imagen */}
      <div className={styles.visualBody}>

        {/* Frase aspiracional */}
        <AnimateOnScroll className={styles.visualHeadline}>
          <h2>Tu oficio merece un sistema a la altura.</h2>
        </AnimateOnScroll>

        {/* Divisor con título de sección */}
        <AnimateOnScroll className={styles.visualDivider} delay={80}>
          <span className={styles.visualDividerLine} />
          <span className={styles.visualDividerLabel}>El costo oculto de no tener un sistema</span>
          <span className={styles.visualDividerLine} />
        </AnimateOnScroll>

        {/* Stats cards */}
        <div className={styles.statsGrid}>
          {STATS.map((s, i) => (
            <AnimateOnScroll key={s.label} className={styles.statCard} delay={120 + i * 80}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statDetail}>{s.detail}</span>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Tabla comparativa */}
        <AnimateOnScroll className={styles.comparisonWrap} delay={200}>
          <div className={styles.comparisonTable}>
            {/* Header */}
            <div className={styles.comparisonHead}>
              <div className={styles.cCellMetric} />
              <div className={`${styles.cCellBefore} ${styles.cHeadCell}`}>
                <span className={styles.iconNo}>✗</span> Sin sistema
              </div>
              <div className={`${styles.cCellAfter} ${styles.cHeadCell}`}>
                <span className={styles.iconYes}>✓</span> FiloDesk
              </div>
            </div>
            {/* Rows */}
            {COMPARISON.map((row) => (
              <div key={row.metric} className={styles.comparisonRow}>
                <div className={styles.cCellMetric}>{row.metric}</div>
                <div className={styles.cCellBefore}>{row.before}</div>
                <div className={styles.cCellAfter}>{row.after}</div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

      </div>
    </section>
  )
}
