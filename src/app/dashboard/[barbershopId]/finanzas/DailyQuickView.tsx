import styles from './finanzas.module.css'
import InfoTooltip from './InfoTooltip'

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
        <p className={styles.quickLabel}>
          <span className={styles.metricLabelRow}>
            <span>Ventas de Hoy</span>
            <InfoTooltip
              ariaLabel="Qué significa Ventas de Hoy"
              content="Total que ingresó hoy sumando servicios y productos registrados."
            />
          </span>
        </p>
        <p className={`${styles.quickValue} ${styles.kpiValuePositive}`}>{formatARS(salesToday)}</p>
      </div>
      <div className={styles.quickStat}>
        <p className={styles.quickLabel}>
          <span className={styles.metricLabelRow}>
            <span>Servicios de Hoy</span>
            <InfoTooltip
              ariaLabel="Qué significa Servicios de Hoy"
              content="Cantidad de servicios cobrados durante la jornada actual."
            />
          </span>
        </p>
        <p className={styles.quickValue}>{servicesToday}</p>
      </div>
      <div className={styles.quickStat}>
        <p className={styles.quickLabel}>
          <span className={styles.metricLabelRow}>
            <span>Efectivo vs. Transferencia</span>
            <InfoTooltip
              ariaLabel="Qué significa Efectivo vs. Transferencia"
              content="Distribución de cobros por método de pago del día. Si aparece N/D, todavía no hay desglose disponible."
            />
          </span>
        </p>
        <p className={styles.quickValue}>{paymentSplit}</p>
      </div>
    </section>
  )
}
