'use client'

import { useEffect, useState, useTransition } from 'react'
import { deleteVenta } from '@/app/actions/venta'
import { deleteVentaProducto } from '@/app/actions/producto'
import { BarbershopRole } from '@/lib/definitions'
import styles from './ventashoy.module.css'

interface ServiceSale {
  id: string
  barber_id: string
  type: 'servicio'
  barber: string
  commission_pct: number
  service: string
  amount: number
  status: 'pending' | 'approved'
  created_at: string
  notes: string | null
}
interface ProductSale {
  id: string; type: 'producto'
  product: string; quantity: number
  unit_price: number
  unit_cost: number
  amount: number
  profit: number
  transaction_id: string
  created_at: string
}

interface GroupedTransaction {
  transaction_id: string
  created_at: string
  itemCount: number
  total: number
  totalProfit: number
  items: Array<{
    id: string
    product: string
    quantity: number
    unit_price: number
    unit_cost: number
    amount: number
    profit: number
  }>
}

function transactionGroupKey(s: ProductSale): string {
  if (s.transaction_id && s.transaction_id.trim().length > 0) return s.transaction_id
  const dt = s.created_at ? new Date(s.created_at) : null
  if (!dt || Number.isNaN(dt.getTime())) return s.id
  const yyyy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  const hh = String(dt.getUTCHours()).padStart(2, '0')
  const mi = String(dt.getUTCMinutes()).padStart(2, '0')
  return `ts-${yyyy}-${mm}-${dd}-${hh}-${mi}`
}

function groupProductsByTransaction(sales: ProductSale[]): GroupedTransaction[] {
  const map = new Map<string, GroupedTransaction>()

  for (const s of sales) {
    const key = transactionGroupKey(s)
    const existing = map.get(key)
    if (existing) {
      existing.itemCount++
      existing.total += s.amount
      existing.totalProfit += s.profit
      existing.items.push({ id: s.id, product: s.product, quantity: s.quantity, unit_price: s.unit_price, unit_cost: s.unit_cost, amount: s.amount, profit: s.profit })
    } else {
      map.set(key, {
        transaction_id: key,
        created_at: s.created_at,
        itemCount: 1,
        total: s.amount,
        totalProfit: s.profit,
        items: [{ id: s.id, product: s.product, quantity: s.quantity, unit_price: s.unit_price, unit_cost: s.unit_cost, amount: s.amount, profit: s.profit }],
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
    <div className={styles.paginationControls}>
      <button
        className={styles.paginationButton}
        onClick={onPrevious}
        disabled={currentPage === 1}
      >
        &lt;
      </button>
      <span className={styles.paginationText}>{currentPage} / {totalPages}</span>
      <button
        className={styles.paginationButton}
        onClick={onNext}
        disabled={currentPage === totalPages}
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
  totalCommission: number
  services: Array<{
    id: string
    service: string
    amount: number
    commission: number
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
      existing.totalCommission += Math.round(s.amount * ((s.commission_pct ?? 0) / 100))
      existing.services.push({
        id: s.id,
        service: s.service,
        amount: s.amount,
        commission: Math.round(s.amount * ((s.commission_pct ?? 0) / 100)),
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
        totalCommission: Math.round(s.amount * ((s.commission_pct ?? 0) / 100)),
        services: [{
          id: s.id,
          service: s.service,
          amount: s.amount,
          commission: Math.round(s.amount * ((s.commission_pct ?? 0) / 100)),
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
  barbershopId: string
  role: BarbershopRole
  serviceSales: ServiceSale[]
  productSales: ProductSale[]
}

export default function VentasHoySection({ barbershopId, role, serviceSales, productSales }: Props) {
  const [serviceSalesState, setServiceSalesState] = useState(serviceSales)
  const [productSalesState, setProductSalesState] = useState(productSales)
  const [filter, setFilter] = useState<'todos' | 'servicio' | 'producto'>('todos')
  const [expandedBarberIds, setExpandedBarberIds] = useState<Set<string>>(new Set())
  const [barberPage, setBarberPage] = useState(1)
  const [servicePagesPerBarber, setServicePagesPerBarber] = useState<Record<string, number>>({})
  const [transactionPage, setTransactionPage] = useState(1)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null)
  const [deletingProductSaleId, setDeletingProductSaleId] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isDeletingProduct, startDeleteProductTransition] = useTransition()

  useEffect(() => {
    if (!isDeleting) setServiceSalesState(serviceSales)
  }, [serviceSales, isDeleting])

  useEffect(() => {
    if (!isDeletingProduct) setProductSalesState(productSales)
  }, [productSales, isDeletingProduct])

  const BARBERS_ITEMS_PER_PAGE = 5
  const SERVICES_ITEMS_PER_PAGE = 5
  const PRODUCT_ITEMS_PER_PAGE = 5

  const grouped = groupServicesByBarber(serviceSalesState)
  const groupedTransactions = role === 'barber' ? [] : groupProductsByTransaction(productSalesState)
  const totalServicios = serviceSalesState.reduce((s, r) => s + r.amount, 0)
  const totalProductos = role === 'barber' ? 0 : productSalesState.reduce((s, r) => s + r.amount, 0)
  const total = totalServicios + totalProductos

  const TABS = role === 'barber'
    ? [
        { key: 'servicio', label: `Tus servicios (${serviceSalesState.length})` },
      ] as const
    : [
        { key: 'todos', label: 'Todos' },
        { key: 'servicio', label: `Servicios (${serviceSalesState.length})` },
        { key: 'producto', label: `Productos (${productSalesState.length})` },
      ] as const

  const effectiveFilter = role === 'barber' ? 'servicio' : filter

  const showServices = effectiveFilter === 'todos' || effectiveFilter === 'servicio'
  const showProducts = role !== 'barber' && (effectiveFilter === 'todos' || effectiveFilter === 'producto')
  const splitDesktopColumns = role !== 'barber'
    && effectiveFilter === 'todos'
    && showServices
    && showProducts
    && grouped.length > 0
    && groupedTransactions.length > 0

  const totalCount = serviceSalesState.length + (role === 'barber' ? 0 : productSalesState.length)

  // Paginación de barberos
  const totalBarbersPages = Math.ceil(grouped.length / BARBERS_ITEMS_PER_PAGE)
  const barberStart = (barberPage - 1) * BARBERS_ITEMS_PER_PAGE
  const barberEnd = barberStart + BARBERS_ITEMS_PER_PAGE
  const paginatedBarbers = grouped.slice(barberStart, barberEnd)

  // Paginación de transacciones de productos
  const totalTransactionPages = Math.ceil(groupedTransactions.length / PRODUCT_ITEMS_PER_PAGE)
  const txStart = (transactionPage - 1) * PRODUCT_ITEMS_PER_PAGE
  const txEnd = txStart + PRODUCT_ITEMS_PER_PAGE
  const paginatedTransactions = groupedTransactions.slice(txStart, txEnd)

  useEffect(() => {
    if (barberPage > totalBarbersPages) {
      setBarberPage(Math.max(1, totalBarbersPages))
    }
  }, [barberPage, totalBarbersPages])

  useEffect(() => {
    if (transactionPage > totalTransactionPages) {
      setTransactionPage(Math.max(1, totalTransactionPages))
    }
  }, [transactionPage, totalTransactionPages])

  function handleDeleteService(saleId: string, serviceName: string) {
    if (role === 'barber') return
    const ok = window.confirm(`¿Eliminar "${serviceName}" de ventas de hoy? Esta acción no se puede deshacer.`)
    if (!ok) return

    setDeleteError(null)
    const previous = serviceSalesState
    setDeletingSaleId(saleId)
    setServiceSalesState((current) => current.filter((sale) => sale.id !== saleId))

    startDeleteTransition(async () => {
      try {
        const result = await deleteVenta(barbershopId, saleId)
        if (result?.error) {
          setServiceSalesState(previous)
          setDeleteError(result.error)
        }
      } catch {
        setServiceSalesState(previous)
        setDeleteError('No se pudo eliminar el servicio. Intentá de nuevo.')
      } finally {
        setDeletingSaleId(null)
      }
    })
  }

  function handleDeleteProductSale(productSaleId: string, productName: string) {
    if (role === 'barber') return
    const ok = window.confirm(`¿Eliminar "${productName}" de ventas de productos? Esta acción no se puede deshacer.`)
    if (!ok) return

    setDeleteError(null)
    const previous = productSalesState
    setDeletingProductSaleId(productSaleId)
    setProductSalesState((current) => current.filter((sale) => sale.id !== productSaleId))

    startDeleteProductTransition(async () => {
      try {
        const result = await deleteVentaProducto(barbershopId, productSaleId)
        if (result?.error) {
          setProductSalesState(previous)
          setDeleteError(result.error)
        }
      } catch {
        setProductSalesState(previous)
        setDeleteError('No se pudo eliminar la venta de producto. Intentá de nuevo.')
      } finally {
        setDeletingProductSaleId(null)
      }
    })
  }

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
              <span className={styles.totalsValue}>{formatARS(total)}</span>
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
        <div className={`${styles.table} ${splitDesktopColumns ? styles.tableSplit : ''}`}>
          {deleteError && (
            <p className={styles.errorBox}>{deleteError}</p>
          )}

          {/* ── Servicios agrupados por barbero ── */}
          {showServices && grouped.length > 0 && (
            <section className={`${styles.categoryBlock} ${styles.categoryBlockService} ${splitDesktopColumns ? styles.categoryPane : ''}`}>
              <div className={`${styles.categoryHeader} ${styles.categoryHeaderService}`}>
                <span className={styles.categoryTitle}>
                  <span className={`${styles.categoryIcon} ${styles.categoryIconService}`} aria-hidden />
                  Servicios de barberos
                </span>
                <span className={styles.categoryMeta}>{serviceSalesState.length}</span>
              </div>
              <div className={`${styles.tableHead} ${styles.tableHeadService}`}>
                <span></span>
                <span>Barbero</span>
                <span>Servicios</span>
                <span>Comisión</span>
                <span>Total</span>
              </div>
              {paginatedBarbers.map(g => {
                const requestedServicePage = servicePagesPerBarber[g.barber_id] || 1
                const totalServicePages = Math.ceil(g.services.length / SERVICES_ITEMS_PER_PAGE)
                const servicePage = Math.min(requestedServicePage, Math.max(1, totalServicePages))
                const serviceStart = (servicePage - 1) * SERVICES_ITEMS_PER_PAGE
                const serviceEnd = serviceStart + SERVICES_ITEMS_PER_PAGE
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
                  >
                    <span className={styles.rowChevron}>
                      {expandedBarberIds.has(g.barber_id) ? '▼' : '▶'}
                    </span>
                    <span className={styles.rowPrimaryText}>
                      <span className={`${styles.rowTypeTag} ${styles.rowTypeTagService}`}>Servicio</span>
                      {g.barber}
                    </span>
                    <span className={styles.countBadge}>×{g.serviceCount}</span>
                    <span className={styles.rowAccent}>{formatARS(g.totalCommission)}</span>
                    <span className={styles.rowAmount}>{formatARS(g.total)}</span>
                  </div>

                  {/* ── Detalle expandible de servicios ── */}
                  {expandedBarberIds.has(g.barber_id) && (
                    <div className={styles.detailBlock}>
                      <div className={`${styles.detailHead} ${styles.innerHeadShared}`}>
                        <span>Hora</span>
                        <span>Servicio</span>
                        <span>Cant.</span>
                        <span>Comisión</span>
                        <span>Total</span>
                        <span></span>
                      </div>
                      {paginatedServices.map(svc => (
                        <div key={svc.id} className={`${styles.detailRow} ${styles.detailRowCard}`}>
                          <span className={styles.detailTime} data-label="Hora">{extractTime(svc.created_at)}</span>
                          <span className={styles.detailService} data-label="Servicio">
                            <span className={styles.detailServiceName}>{svc.service}</span>
                            {svc.notes && (
                              <details className={styles.notePill}>
                                <summary title={svc.notes}>nota</summary>
                                <div className={styles.notePopover}>{svc.notes}</div>
                              </details>
                            )}
                          </span>
                          <span className={styles.detailQty} data-label="Cant.">1</span>
                          <span className={styles.detailAccent} data-label="Comisión">{formatARS(svc.commission)}</span>
                          <span className={styles.detailAmount} data-label="Total">
                            {formatARS(svc.amount)}
                            {svc.status === 'pending' && <span className={styles.pendingBadge}>Pendiente</span>}
                          </span>
                          <span className={styles.detailAction} data-label="">
                            {role !== 'barber' && (
                              <button
                                type="button"
                                className={styles.deleteServiceBtn}
                                onClick={() => handleDeleteService(svc.id, svc.service)}
                                disabled={isDeleting && deletingSaleId === svc.id}
                                aria-label={`Eliminar servicio ${svc.service}`}
                              >
                                {isDeleting && deletingSaleId === svc.id ? 'Eliminando…' : 'Eliminar'}
                              </button>
                            )}
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
            </section>
          )}

          {/* ── Separador si hay ambos ── */}
          {!splitDesktopColumns && showServices && showProducts && grouped.length > 0 && groupedTransactions.length > 0 && (
            <div className={styles.divider} />
          )}

          {/* ── Productos agrupados por transacción ── */}
          {showProducts && groupedTransactions.length > 0 && (
            <section className={`${styles.categoryBlock} ${styles.categoryBlockProduct} ${splitDesktopColumns ? styles.categoryPane : ''}`}>
              <div className={`${styles.categoryHeader} ${styles.categoryHeaderProduct}`}>
                <span className={styles.categoryTitle}>
                  <span className={`${styles.categoryIcon} ${styles.categoryIconProduct}`} aria-hidden />
                  Ventas de productos
                </span>
                <span className={styles.categoryMeta}>{productSalesState.length}</span>
              </div>
              <div className={`${styles.tableHead} ${styles.tableHeadProduct}`}>
                <span></span>
                <span>Transacción</span>
                <span>Productos</span>
                <span>Ganancia</span>
                <span>Total</span>
              </div>
              {paginatedTransactions.map(tx => (
                <details key={tx.transaction_id} className={styles.productTransaction}>
                  <summary className={`${styles.tableRow} ${styles.tableRowProduct} ${styles.productTransactionSummary}`}>
                    <span className={styles.rowChevronProduct} aria-hidden>▶</span>
                    <span className={styles.transactionLabel}>
                      <span className={`${styles.rowTypeTag} ${styles.rowTypeTagProduct}`}>Producto</span>
                      <span className={styles.transactionPrefix}>Venta</span> {extractTime(tx.created_at)}
                    </span>
                    <span className={styles.countBadge}>×{tx.itemCount}</span>
                    <span className={styles.transactionAccent}>{formatARS(tx.totalProfit)}</span>
                    <span className={styles.transactionTotal}>
                      <span>{formatARS(tx.total)}</span>
                    </span>
                  </summary>
                  <div className={styles.detailBlock}>
                    <div className={`${styles.productDetailHead} ${styles.innerHeadShared}`}>
                      <span>Producto</span>
                      <span>Cant.</span>
                      <span>Precio Unit.</span>
                      <span>Ganancia</span>
                      <span>Total</span>
                      <span></span>
                    </div>
                    {tx.items.map(item => (
                      <div key={item.id} className={`${styles.productDetailRow} ${styles.detailRowCard}`}>
                        <span className={styles.detailService} data-label="Producto">{item.product}</span>
                        <span className={styles.detailQty} data-label="Cant.">×{item.quantity}</span>
                        <span className={styles.detailAmountMuted} data-label="Precio Unit.">{formatARS(item.unit_price)}</span>
                        <span className={styles.detailAccent} data-label="Ganancia">{formatARS(item.profit)}</span>
                        <span className={styles.detailAmount} data-label="Total">
                          {formatARS(item.amount)}
                        </span>
                        <span className={styles.detailAction} data-label="">
                          <button
                            type="button"
                            className={styles.deleteServiceBtn}
                            onClick={() => handleDeleteProductSale(item.id, item.product)}
                            disabled={isDeletingProduct && deletingProductSaleId === item.id}
                            aria-label={`Eliminar venta de producto ${item.product}`}
                          >
                            {isDeletingProduct && deletingProductSaleId === item.id ? 'Eliminando…' : 'Eliminar'}
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
              {totalTransactionPages > 1 && (
                <PaginationControls
                  currentPage={transactionPage}
                  totalPages={totalTransactionPages}
                  onPrevious={() => setTransactionPage(Math.max(1, transactionPage - 1))}
                  onNext={() => setTransactionPage(Math.min(totalTransactionPages, transactionPage + 1))}
                />
              )}
            </section>
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
