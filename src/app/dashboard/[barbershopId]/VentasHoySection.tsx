'use client'

import { useState } from 'react'
import { BarbershopRole } from '@/lib/definitions'
import styles from './ventashoy.module.css'

interface ServiceSale {
  id: string
  barber_id: string
  type: 'servicio'
  barber: string
  service: string
  amount: number
  status: 'pending' | 'approved'
  created_at: string
  notes: string | null
}
interface ProductSale {
  id: string; type: 'producto'
  product: string; quantity: number
  amount: number
  transaction_id: string
  created_at: string
}

interface GroupedTransaction {
  transaction_id: string
  created_at: string
  itemCount: number
  total: number
  items: Array<{
    id: string
    product: string
    quantity: number
    amount: number
  }>
}

function groupProductsByTransaction(sales: ProductSale[]): GroupedTransaction[] {
  const map = new Map<string, GroupedTransaction>()

  for (const s of sales) {
    const existing = map.get(s.transaction_id)
    if (existing) {
      existing.itemCount++
      existing.total += s.amount
      existing.items.push({ id: s.id, product: s.product, quantity: s.quantity, amount: s.amount })
    } else {
      map.set(s.transaction_id, {
        transaction_id: s.transaction_id,
        created_at: s.created_at,
        itemCount: 1,
        total: s.amount,
        items: [{ id: s.id, product: s.product, quantity: s.quantity, amount: s.amount }],
      })
    }
  }

  return [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
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
    status: 'pending' | 'approved'
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
        status: s.status,
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
          status: s.status,
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
  role: BarbershopRole
  serviceSales: ServiceSale[]
  productSales: ProductSale[]
}

export default function VentasHoySection({ role, serviceSales, productSales }: Props) {
  const [filter, setFilter] = useState<'todos' | 'servicio' | 'producto'>('todos')
  const [expandedBarberIds, setExpandedBarberIds] = useState<Set<string>>(new Set())
  const [barberPage, setBarberPage] = useState(1)
  const [servicePagesPerBarber, setServicePagesPerBarber] = useState<Record<string, number>>({})
  const [expandedTransactionIds, setExpandedTransactionIds] = useState<Set<string>>(new Set())
  const [transactionPage, setTransactionPage] = useState(1)

  const ITEMS_PER_PAGE = 10

  const grouped = groupServicesByBarber(serviceSales)
  const groupedTransactions = role === 'barber' ? [] : groupProductsByTransaction(productSales)
  const totalServicios = serviceSales.reduce((s, r) => s + r.amount, 0)
  const totalProductos = role === 'barber' ? 0 : productSales.reduce((s, r) => s + r.amount, 0)
  const total = totalServicios + totalProductos

  const TABS = role === 'barber'
    ? [
        { key: 'servicio', label: `Tus servicios (${serviceSales.length})` },
      ] as const
    : [
        { key: 'todos', label: 'Todos' },
        { key: 'servicio', label: `Servicios (${serviceSales.length})` },
        { key: 'producto', label: `Productos (${productSales.length})` },
      ] as const

  const effectiveFilter = role === 'barber' ? 'servicio' : filter

  const showServices = effectiveFilter === 'todos' || effectiveFilter === 'servicio'
  const showProducts = role !== 'barber' && (effectiveFilter === 'todos' || effectiveFilter === 'producto')

  const totalCount = serviceSales.length + (role === 'barber' ? 0 : productSales.length)

  // Paginación de barberos
  const totalBarbersPages = Math.ceil(grouped.length / ITEMS_PER_PAGE)
  const barberStart = (barberPage - 1) * ITEMS_PER_PAGE
  const barberEnd = barberStart + ITEMS_PER_PAGE
  const paginatedBarbers = grouped.slice(barberStart, barberEnd)

  // Paginación de transacciones de productos
  const totalTransactionPages = Math.ceil(groupedTransactions.length / ITEMS_PER_PAGE)
  const txStart = (transactionPage - 1) * ITEMS_PER_PAGE
  const txEnd = txStart + ITEMS_PER_PAGE
  const paginatedTransactions = groupedTransactions.slice(txStart, txEnd)

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>
            {role === 'barber' ? 'Tu actividad de hoy' : 'Ventas de hoy'}
            {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
          </h2>
          {total > 0 && (
            <div className={styles.totals}>
              <span style={{ color: 'var(--green)' }}>{formatARS(total)}</span>
              {effectiveFilter === 'todos' && totalProductos > 0 && (
                <span className={styles.totalBreak}>
                  ({formatARS(totalServicios)} servicios + {formatARS(totalProductos)} productos)
                </span>
              )}
            </div>
          )}
          {role === 'barber' && (
            <p className={styles.contextHint}>Vista privada: solo se muestran tus servicios registrados hoy.</p>
          )}
        </div>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.key}
              className={effectiveFilter === t.key ? styles.tabActive : styles.tab}
              disabled={role === 'barber'}
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
                    <div className={styles.detailBlock}>
                      <div className={styles.detailHead}>
                        <span>Hora</span>
                        <span>Servicio</span>
                        <span>Cant.</span>
                        <span>Monto</span>
                      </div>
                      {paginatedServices.map(svc => (
                        <div key={svc.id} className={styles.detailRow}>
                          <span className={styles.detailTime}>{extractTime(svc.created_at)}</span>
                          <span className={styles.detailService}>{svc.service}</span>
                          <span className={styles.detailQty}>1</span>
                          <span className={styles.detailAmount}>
                            {formatARS(svc.amount)}
                            {svc.status === 'pending' && <span className={styles.pendingBadge}>Pendiente</span>}
                          </span>
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
          {showServices && showProducts && grouped.length > 0 && groupedTransactions.length > 0 && (
            <div className={styles.divider} />
          )}

          {/* ── Productos agrupados por transacción ── */}
          {showProducts && groupedTransactions.length > 0 && (
            <>
              <div className={styles.tableHead}>
                <span></span>
                <span>Venta</span>
                <span>Productos</span>
                <span>Total</span>
              </div>
              {paginatedTransactions.map(tx => (
                <div key={tx.transaction_id}>
                  <div
                    className={`${styles.tableRow} ${styles.tableRowProduct}`}
                    onClick={() => {
                      const newSet = new Set(expandedTransactionIds)
                      if (newSet.has(tx.transaction_id)) {
                        newSet.delete(tx.transaction_id)
                      } else {
                        newSet.add(tx.transaction_id)
                      }
                      setExpandedTransactionIds(newSet)
                    }}
                    style={{ cursor: tx.itemCount > 1 ? 'pointer' : 'default' }}
                  >
                    <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                      {tx.itemCount > 1
                        ? (expandedTransactionIds.has(tx.transaction_id) ? '▼' : '▶')
                        : ''}
                    </span>
                    <span style={{ fontWeight: 500, color: 'var(--cream)' }}>
                      {tx.itemCount === 1 ? tx.items[0].product : `Venta ${extractTime(tx.created_at)}`}
                    </span>
                    <span className={styles.countBadge}>×{tx.itemCount}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(tx.total)}</span>
                  </div>

                  {/* ── Detalle expandible de ítems ── */}
                  {tx.itemCount > 1 && expandedTransactionIds.has(tx.transaction_id) && (
                    <div className={styles.detailBlock}>
                      <div className={styles.detailHead}>
                        <span></span>
                        <span>Producto</span>
                        <span>Cant.</span>
                        <span>Monto</span>
                      </div>
                      {tx.items.map(item => (
                        <div key={item.id} className={styles.detailRow}>
                          <span></span>
                          <span className={styles.detailService}>{item.product}</span>
                          <span className={styles.detailQty}>×{item.quantity}</span>
                          <span className={styles.detailAmount}>{formatARS(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {totalTransactionPages > 1 && (
                <PaginationControls
                  currentPage={transactionPage}
                  totalPages={totalTransactionPages}
                  onPrevious={() => setTransactionPage(Math.max(1, transactionPage - 1))}
                  onNext={() => setTransactionPage(Math.min(totalTransactionPages, transactionPage + 1))}
                />
              )}
            </>
          )}

          {/* ── Empty states por tab ── */}
          {showServices && !showProducts && grouped.length === 0 && (
            <p className={styles.empty}>No hay servicios hoy.</p>
          )}
          {showProducts && !showServices && groupedTransactions.length === 0 && (
            <p className={styles.empty}>No hay productos hoy.</p>
          )}

        </div>
      )}
    </div>
  )
}
