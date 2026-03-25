import styles from './landing.module.css'

const bars = [52, 78, 64, 91, 100, 87]

export default function DashboardPreview() {
  return (
    <div className={styles.previewWrap}>
      <div className={styles.previewFrame}>

        <div className={styles.frameBar}>
          <div className={`${styles.dot} ${styles.dotRed}`} />
          <div className={`${styles.dot} ${styles.dotYellow}`} />
          <div className={`${styles.dot} ${styles.dotGreen}`} />
        </div>

        <div className={styles.miniStats}>
          {[
            { label: 'Total facturado', val: '$47.200', green: false },
            { label: 'Pagado a barberos', val: '$23.600', green: false },
            { label: 'Gastos del local', val: '$4.500', green: false },
            { label: 'Tu ganancia', val: '$19.100', green: true },
          ].map((s) => (
            <div key={s.label} className={styles.miniCard}>
              <div className={styles.miniLabel}>{s.label}</div>
              <div className={`${styles.miniVal} ${s.green ? styles.miniValGreen : ''}`}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className={styles.miniGrid}>
          <div className={styles.miniChartCard}>
            <div className={styles.miniChartTitle}>Ventas diarias</div>
            <div className={styles.miniBars}>
              {bars.map((h, i) => (
                <div key={i} className={styles.miniBar} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className={styles.miniTableCard}>
            <div className={styles.miniChartTitle}>Barberos</div>
            {[
              { name: 'Galuchi', val: '$13.400' },
              { name: 'Juan M.', val: '$5.200' },
              { name: 'Gastón P.', val: '$5.000' },
            ].map((r) => (
              <div key={r.name} className={styles.miniRow}>
                <span>{r.name}</span>
                <span>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
