import styles from './finanzas.module.css'

type DailyQuickViewProps = {
  salesToday: number
  servicesToday: number
  cashToday: number | null
  transferToday: number | null
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function DailyQuickView({
  salesToday,
  servicesToday,
  cashToday,
  transferToday,
}: DailyQuickViewProps) {
  const paymentSplit = cashToday !== null && transferToday !== null
    ? `${formatARS(cashToday)} / ${formatARS(transferToday)}`
    : 'N/D'

  return (
    <section className={styles.dailyQuickView} aria-label="Caja diaria de hoy">
      <div className={styles.quickStat}>
        <p className={styles.quickLabel}>Ventas de Hoy</p>
        <p className={`${styles.quickValue} ${styles.kpiValuePositive}`}>{formatARS(salesToday)}</p>
      </div>
      <div className={styles.quickStat}>
        <p className={styles.quickLabel}>Servicios de Hoy</p>
        <p className={styles.quickValue}>{servicesToday}</p>
      </div>
      <div className={styles.quickStat}>
        <p className={styles.quickLabel}>Efectivo vs. Transferencia</p>
        <p className={styles.quickValue}>{paymentSplit}</p>
      </div>
    </section>
  )
}
