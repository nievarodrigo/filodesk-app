import styles from './paginacion.module.css'

interface Props {
  current: number
  total: number
  baseHref: string
}

export default function Paginacion({ current, total, baseHref }: Props) {
  if (total <= 1) return null
  const sep = baseHref.includes('?') ? '&' : '?'
  return (
    <div className={styles.nav}>
      {current > 1
        ? <a href={`${baseHref}${sep}p=${current - 1}`} className={styles.btn}>← Anterior</a>
        : <span className={styles.disabled}>← Anterior</span>}
      <span className={styles.info}>Pág. {current} de {total}</span>
      {current < total
        ? <a href={`${baseHref}${sep}p=${current + 1}`} className={styles.btn}>Siguiente →</a>
        : <span className={styles.disabled}>Siguiente →</span>}
    </div>
  )
}
