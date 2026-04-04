import Image from 'next/image'
import styles from './landing.module.css'
import AnimateOnScroll from './AnimateOnScroll'

const STATS = [
  { value: '3 hs',    desc: 'perdidas por semana liquidando comisiones a mano con Excel o papel' },
  { value: '1 de 3',  desc: 'servicios sin registrar en días de alta carga cuando no hay sistema' },
  { value: '-68%',    desc: 'menos tiempo administrativo con FiloDesk vs gestión manual' },
  { value: '100%',    desc: 'visibilidad en tiempo real de ganancia neta, comisiones y stock — desde el celu' },
]

const COMPARISON = [
  { metric: 'Liquidar comisiones',  before: '~3 horas / semana',              after: 'Automático al registrar'   },
  { metric: 'Ver ganancia neta',    before: 'Estimada, al cierre del mes',     after: 'Exacta, en tiempo real'    },
  { metric: 'Registrar servicio',   before: '2–3 min con papel o anotación',   after: 'Menos de 30 segundos'      },
  { metric: 'Errores de cálculo',   before: 'Frecuentes (fórmulas rotas)',      after: 'Cero — automático'         },
  { metric: 'Control de stock',     before: '"Creo que queda..."',             after: 'Actualizado al instante'   },
]

export default function VisualSection() {
  return (
    <section className={styles.visualSection}>
      <div className={styles.visualBgWrap}>
        <Image
          src="/barbershop-visual.png"
          alt="Interior de una barbería de lujo"
          fill
          className={styles.visualBg}
          sizes="100vw"
          quality={90}
          priority
        />
        <div className={styles.visualOverlay} />
      </div>

      <div className={styles.visualBody}>

        <AnimateOnScroll className={styles.visualHeadline}>
          <h2>Tu oficio merece un <span className={styles.visualAccent}>sistema</span> a la altura.</h2>
        </AnimateOnScroll>

        {/* Divisor → stats */}
        <AnimateOnScroll className={styles.visualDivider} delay={80}>
          <span className={styles.visualDividerLine} />
          <span className={styles.visualDividerLabel}>El costo oculto de no tener un sistema</span>
          <span className={styles.visualDividerLine} />
        </AnimateOnScroll>

        {/* Stats cards */}
        <div className={styles.statsGrid}>
          {STATS.map((s, i) => (
            <AnimateOnScroll key={s.value} className={styles.statCard} delay={120 + i * 80}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statDesc}>{s.desc}</span>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Título tabla */}
        <AnimateOnScroll className={styles.comparisonTitle} delay={180}>
          La diferencia está en el <em>filo</em>
        </AnimateOnScroll>

        {/* Comparison table */}
        <AnimateOnScroll className={styles.comparisonWrap} delay={220}>
          <div className={styles.comparisonTableWrap}>
            <table className={styles.cTable}>
              <thead>
                <tr>
                  <th className={styles.cTh}>Característica</th>
                  <th className={styles.cTh}><span className={styles.iconNo}>✗</span> Sin sistema</th>
                  <th className={`${styles.cTh} ${styles.cThAfter}`}><span className={styles.iconYes}>✓</span> FiloDesk</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.metric} className={styles.cRow}>
                    <td className={styles.cTd}>{row.metric}</td>
                    <td className={`${styles.cTd} ${styles.cTdBefore}`}>{row.before}</td>
                    <td className={`${styles.cTd} ${styles.cTdAfter}`}>{row.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimateOnScroll>

      </div>
    </section>
  )
}
