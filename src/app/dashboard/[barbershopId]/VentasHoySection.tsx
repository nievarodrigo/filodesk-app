'use client'

import { useState } from 'react'
import styles from './ventashoy.module.css'

interface ServiceSale {
  id: string; type: 'servicio'
  barber: string; service: string
  amount: number; notes: string | null
}
interface ProductSale {
  id: string; type: 'producto'
  product: string; quantity: number
  amount: number
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

interface GroupedService {
  key: string
  barber: string
  service: string
  count: number
  total: number
}

function groupServices(sales: ServiceSale[]): GroupedService[] {
  const map = new Map<string, GroupedService>()
  for (const s of sales) {
    const key = `${s.barber}||${s.service}`
    const existing = map.get(key)
    if (existing) {
      existing.count++
      existing.total += s.amount
    } else {
      map.set(key, { key, barber: s.barber, service: s.service, count: 1, total: s.amount })
    }
  }
  // Ordenar por barbero luego servicio
  return [...map.values()].sort((a, b) =>
    a.barber.localeCompare(b.barber) || a.service.localeCompare(b.service)
  )
}

interface Props {
  serviceSales: ServiceSale[]
  productSales: ProductSale[]
}

export default function VentasHoySection({ serviceSales, productSales }: Props) {
  const [filter, setFilter] = useState<'todos' | 'servicio' | 'producto'>('todos')

  const grouped = groupServices(serviceSales)
  const totalServicios = serviceSales.reduce((s, r) => s + r.amount, 0)
  const totalProductos = productSales.reduce((s, r) => s + r.amount, 0)
  const total = totalServicios + totalProductos

  const TABS = [
    { key: 'todos',    label: `Todos` },
    { key: 'servicio', label: `Servicios (${serviceSales.length})` },
    { key: 'producto', label: `Productos (${productSales.length})` },
  ] as const

  const showServices = filter === 'todos' || filter === 'servicio'
  const showProducts = filter === 'todos' || filter === 'producto'

  const totalCount = serviceSales.length + productSales.length

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>
            Ventas de hoy
            {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
          </h2>
          {total > 0 && (
            <div className={styles.totals}>
              <span style={{ color: 'var(--green)' }}>{formatARS(total)}</span>
              {filter === 'todos' && totalProductos > 0 && (
                <span className={styles.totalBreak}>
                  ({formatARS(totalServicios)} servicios + {formatARS(totalProductos)} productos)
                </span>
              )}
            </div>
          )}
        </div>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.key}
              className={filter === t.key ? styles.tabActive : styles.tab}
              onClick={() => setFilter(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {totalCount === 0 ? (
        <p className={styles.empty}>Todavía no hay ventas hoy.</p>
      ) : (
        <div className={styles.table}>

          {/* ── Servicios agrupados ── */}
          {showServices && grouped.length > 0 && (
            <>
              <div className={styles.tableHead}>
                <span>Barbero</span>
                <span>Servicio</span>
                <span>Cant.</span>
                <span>Total</span>
              </div>
              {grouped.map(g => (
                <div key={g.key} className={`${styles.tableRow} ${styles.tableRowService}`}>
                  <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{g.barber}</span>
                  <span>{g.service}</span>
                  <span className={styles.countBadge}>×{g.count}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(g.total)}</span>
                </div>
              ))}
            </>
          )}

          {/* ── Separador si hay ambos ── */}
          {showServices && showProducts && grouped.length > 0 && productSales.length > 0 && (
            <div className={styles.divider} />
          )}

          {/* ── Productos ── */}
          {showProducts && productSales.length > 0 && (
            <>
              <div className={styles.tableHead}>
                <span>Producto</span>
                <span></span>
                <span>Cant.</span>
                <span>Total</span>
              </div>
              {productSales.map(p => (
                <div key={p.id} className={`${styles.tableRow} ${styles.tableRowProduct}`}>
                  <span style={{ fontWeight: 500 }}>{p.product}</span>
                  <span />
                  <span className={styles.countBadge}>×{p.quantity}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(p.amount)}</span>
                </div>
              ))}
            </>
          )}

          {/* ── Empty states por tab ── */}
          {showServices && !showProducts && grouped.length === 0 && (
            <p className={styles.empty}>No hay servicios hoy.</p>
          )}
          {showProducts && !showServices && productSales.length === 0 && (
            <p className={styles.empty}>No hay productos hoy.</p>
          )}

        </div>
      )}
    </div>
  )
}
