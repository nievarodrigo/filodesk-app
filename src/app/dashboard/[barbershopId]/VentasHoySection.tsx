'use client'

import { useState } from 'react'
import styles from './ventashoy.module.css'

interface ServiceSale {
  id: string
  barber_id: string
  type: 'servicio'
  barber: string
  service: string
  amount: number
  notes: string | null
}
interface ProductSale {
  id: string; type: 'producto'
  product: string; quantity: number
  amount: number
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

interface GroupedBarber {
  barber_id: string
  barber: string
  serviceCount: number
  total: number
  services: Array<{
    id: string
    service: string
    amount: number
    notes: string | null
  }>
}

function groupServicesByBarber(sales: ServiceSale[]): GroupedBarber[] {
  const map = new Map<string, GroupedBarber>()

  for (const s of sales) {
    const existing = map.get(s.barber_id)
    if (existing) {
      existing.serviceCount++
      existing.total += s.amount
      existing.services.push({
        id: s.id,
        service: s.service,
        amount: s.amount,
        notes: s.notes,
      })
    } else {
      map.set(s.barber_id, {
        barber_id: s.barber_id,
        barber: s.barber,
        serviceCount: 1,
        total: s.amount,
        services: [{
          id: s.id,
          service: s.service,
          amount: s.amount,
          notes: s.notes,
        }],
      })
    }
  }

  // Ordenar por barbero
  return [...map.values()].sort((a, b) => a.barber.localeCompare(b.barber))
}

interface Props {
  serviceSales: ServiceSale[]
  productSales: ProductSale[]
}

export default function VentasHoySection({ serviceSales, productSales }: Props) {
  const [filter, setFilter] = useState<'todos' | 'servicio' | 'producto'>('todos')
  const [expandedBarberId, setExpandedBarberId] = useState<string | null>(null)

  const grouped = groupServicesByBarber(serviceSales)
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

          {/* ── Servicios agrupados por barbero ── */}
          {showServices && grouped.length > 0 && (
            <>
              <div className={styles.tableHead}>
                <span></span>
                <span>Barbero</span>
                <span>Servicios</span>
                <span>Total</span>
              </div>
              {grouped.map(g => (
                <div key={g.barber_id}>
                  <div
                    className={`${styles.tableRow} ${styles.tableRowService}`}
                    onClick={() => setExpandedBarberId(expandedBarberId === g.barber_id ? null : g.barber_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                      {expandedBarberId === g.barber_id ? '▼' : '▶'}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{g.barber}</span>
                    <span className={styles.countBadge}>×{g.serviceCount}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(g.total)}</span>
                  </div>

                  {/* ── Detalle expandible de servicios ── */}
                  {expandedBarberId === g.barber_id && (
                    <div style={{ background: 'var(--hover)', paddingLeft: 16 }}>
                      {g.services.map(svc => (
                        <div key={svc.id} className={styles.tableRow} style={{ fontSize: '.9rem', paddingLeft: 32 }}>
                          <span></span>
                          <span style={{ color: 'var(--muted)' }}>{svc.service}</span>
                          <span></span>
                          <span style={{ color: 'var(--green)', fontWeight: 500 }}>{formatARS(svc.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                <span></span>
                <span>Producto</span>
                <span>Cant.</span>
                <span>Total</span>
              </div>
              {productSales.map(p => (
                <div key={p.id} className={`${styles.tableRow} ${styles.tableRowProduct}`}>
                  <span></span>
                  <span style={{ fontWeight: 500 }}>{p.product}</span>
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
