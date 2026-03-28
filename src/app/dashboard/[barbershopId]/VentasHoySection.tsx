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
  created_at: string
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

function extractTime(isoString: string): string {
  if (!isoString) return '—'
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
}

function PaginationControls({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: {
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '12px 0', fontSize: '.78rem', color: 'var(--muted)' }}>
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: currentPage === 1 ? 'transparent' : 'var(--surface)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        &lt;
      </button>
      <span>{currentPage} / {totalPages}</span>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: currentPage === totalPages ? 'transparent' : 'var(--surface)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
      >
        &gt;
      </button>
    </div>
  )
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
    created_at: string
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
        created_at: s.created_at,
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
          created_at: s.created_at,
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
  const [expandedBarberIds, setExpandedBarberIds] = useState<Set<string>>(new Set())
  const [barberPage, setBarberPage] = useState(1)
  const [servicePagesPerBarber, setServicePagesPerBarber] = useState<Record<string, number>>({})
  const [productPage, setProductPage] = useState(1)

  const ITEMS_PER_PAGE = 10

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

  // Paginación de barberos
  const totalBarbersPages = Math.ceil(grouped.length / ITEMS_PER_PAGE)
  const barberStart = (barberPage - 1) * ITEMS_PER_PAGE
  const barberEnd = barberStart + ITEMS_PER_PAGE
  const paginatedBarbers = grouped.slice(barberStart, barberEnd)

  // Paginación de productos
  const totalProductsPages = Math.ceil(productSales.length / ITEMS_PER_PAGE)
  const productStart = (productPage - 1) * ITEMS_PER_PAGE
  const productEnd = productStart + ITEMS_PER_PAGE
  const paginatedProducts = productSales.slice(productStart, productEnd)

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
              {paginatedBarbers.map(g => {
                const servicePage = servicePagesPerBarber[g.barber_id] || 1
                const totalServicePages = Math.ceil(g.services.length / ITEMS_PER_PAGE)
                const serviceStart = (servicePage - 1) * ITEMS_PER_PAGE
                const serviceEnd = serviceStart + ITEMS_PER_PAGE
                const paginatedServices = g.services.slice(serviceStart, serviceEnd)

                return (
                <div key={g.barber_id}>
                  <div
                    className={`${styles.tableRow} ${styles.tableRowService}`}
                    onClick={() => {
                      const newSet = new Set(expandedBarberIds)
                      if (newSet.has(g.barber_id)) {
                        newSet.delete(g.barber_id)
                      } else {
                        newSet.add(g.barber_id)
                      }
                      setExpandedBarberIds(newSet)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                      {expandedBarberIds.has(g.barber_id) ? '▼' : '▶'}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{g.barber}</span>
                    <span className={styles.countBadge}>×{g.serviceCount}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(g.total)}</span>
                  </div>

                  {/* ── Detalle expandible de servicios ── */}
                  {expandedBarberIds.has(g.barber_id) && (
                    <div style={{ background: 'var(--hover)', paddingLeft: 16 }}>
                      <div className={styles.tableHead} style={{ paddingLeft: 32, fontSize: '.85rem' }}>
                        <span>Hora</span>
                        <span>Servicio</span>
                        <span>Cant.</span>
                        <span>Monto</span>
                      </div>
                      {paginatedServices.map(svc => (
                        <div key={svc.id} className={styles.tableRow} style={{ fontSize: '.9rem', paddingLeft: 32 }}>
                          <span style={{ color: 'var(--muted)', fontSize: '.75rem' }}>{extractTime(svc.created_at)}</span>
                          <span style={{ color: 'var(--muted)' }}>{svc.service}</span>
                          <span style={{ textAlign: 'center' }}>1</span>
                          <span style={{ color: 'var(--green)', fontWeight: 500 }}>{formatARS(svc.amount)}</span>
                        </div>
                      ))}
                      {totalServicePages > 1 && (
                        <PaginationControls
                          currentPage={servicePage}
                          totalPages={totalServicePages}
                          onPrevious={() => setServicePagesPerBarber(prev => ({ ...prev, [g.barber_id]: Math.max(1, servicePage - 1) }))}
                          onNext={() => setServicePagesPerBarber(prev => ({ ...prev, [g.barber_id]: Math.min(totalServicePages, servicePage + 1) }))}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
              })}
              {totalBarbersPages > 1 && (
                <PaginationControls
                  currentPage={barberPage}
                  totalPages={totalBarbersPages}
                  onPrevious={() => setBarberPage(Math.max(1, barberPage - 1))}
                  onNext={() => setBarberPage(Math.min(totalBarbersPages, barberPage + 1))}
                />
              )}
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
              {paginatedProducts.map(p => (
                <div key={p.id} className={`${styles.tableRow} ${styles.tableRowProduct}`}>
                  <span></span>
                  <span style={{ fontWeight: 500 }}>{p.product}</span>
                  <span className={styles.countBadge}>×{p.quantity}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(p.amount)}</span>
                </div>
              ))}
              {totalProductsPages > 1 && (
                <PaginationControls
                  currentPage={productPage}
                  totalPages={totalProductsPages}
                  onPrevious={() => setProductPage(Math.max(1, productPage - 1))}
                  onNext={() => setProductPage(Math.min(totalProductsPages, productPage + 1))}
                />
              )}
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
