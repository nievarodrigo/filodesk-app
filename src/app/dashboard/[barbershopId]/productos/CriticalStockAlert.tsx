import styles from './productos.module.css'

type CriticalStockItem = {
  id: string
  name: string
  stock: number
}

type CriticalStockAlertProps = {
  items: CriticalStockItem[]
}

export default function CriticalStockAlert({ items }: CriticalStockAlertProps) {
  if (items.length === 0) return null

  return (
    <section className={`${styles.criticalStockAlert} ${styles.sectionGap}`} aria-label="Acción requerida por stock crítico">
      <p className={styles.criticalStockTitle}>Acción Requerida</p>
      <ul className={styles.criticalStockList}>
        {items.map((item) => (
          <li key={item.id} className={styles.criticalStockItem}>
            <span className={styles.criticalStockName}>{item.name}</span>
            <span className={item.stock <= 0 ? styles.criticalStockZero : styles.criticalStockLow}>
              {item.stock <= 0 ? 'Sin stock' : `${item.stock} u.`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
