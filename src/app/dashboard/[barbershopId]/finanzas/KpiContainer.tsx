import type { ReactNode } from 'react'
import styles from './finanzas.module.css'

type KpiContainerProps = {
  title: string
  summary: string
  grid?: '2x2'
  children: ReactNode
}

export default function KpiContainer({
  title,
  summary,
  grid = '2x2',
  children,
}: KpiContainerProps) {
  return (
    <details className={styles.kpiContainer} open>
      <summary className={styles.kpiContainerSummary}>
        <div>
          <p className={styles.kpiContainerTitle}>{title}</p>
          <p className={styles.kpiContainerMini}>{summary}</p>
        </div>
        <div className={styles.kpiContainerActions}>
          <span className={styles.kpiContainerWhenOpen}>Contraer KPIs</span>
          <span className={styles.kpiContainerWhenClosed}>Ver KPIs</span>
          <span className={styles.kpiContainerChevron} aria-hidden>▾</span>
        </div>
      </summary>
      <div className={styles.kpiContainerBody}>
        <div className={grid === '2x2' ? styles.kpiContainerGrid2x2 : undefined}>
          {children}
        </div>
      </div>
    </details>
  )
}
