import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { today, startOfMonth as som } from '@/lib/date'
import FiltroFechas from './FiltroFechas'
import GraficoIngresos from './GraficoIngresos'
import BarberMobileAccordion from './BarberMobileAccordion'
import Paginacion from '@/components/dashboard/Paginacion'
import styles from './ventas.module.css'

export const metadata: Metadata = { title: 'Ventas — FiloDesk' }

const PAGE_SIZE_DESKTOP = 10
const PAGE_SIZE_PRODUCTS_MOBILE = 5
const PAGE_SIZE_BARBERS = 5

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatShortDate(date: string) {
  const [yyyy, mm, dd] = date.slice(0, 10).split('-')
  if (!yyyy || !mm || !dd) return date
  return `${dd}-${mm}-${yyyy.slice(-2)}`
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function formatShortTime(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

type ProductSaleRow = {
  id: string
  sale_price: number
  date: string
  quantity: number
  created_at?: string
  transaction_id?: string | null
  products?: Array<{ name: string }> | { name: string }
}

type GroupedProductTransaction = {
  key: string
  date: string
  createdAt: string
  total: number
  itemCount: number
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

type ServiceSaleRow = {
  id: string
  amount: number
  status: string
  date: string
  created_at?: string
  notes?: string
  barbers?: Array<{ name: string; commission_pct: number }> | { name: string; commission_pct: number }
  service_types?: Array<{ name: string }> | { name: string }
}

function transactionGroupKey(sale: ProductSaleRow) {
  if (sale.transaction_id && sale.transaction_id.trim().length > 0) return sale.transaction_id
  const dt = sale.created_at ? new Date(sale.created_at) : null
  if (!dt || Number.isNaN(dt.getTime())) return `fallback-${sale.id}`
  const yyyy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  const hh = String(dt.getUTCHours()).padStart(2, '0')
  const mi = String(dt.getUTCMinutes()).padStart(2, '0')
  return `ts-${yyyy}-${mm}-${dd}-${hh}-${mi}`
}

function groupProductSales(rows: ProductSaleRow[]): GroupedProductTransaction[] {
  const map = new Map<string, GroupedProductTransaction>()
  for (const row of rows) {
    const key = transactionGroupKey(row)
    const productName = (Array.isArray(row.products) ? row.products?.[0]?.name : row.products?.name)?.trim() || 'Producto eliminado'
    const quantity = row.quantity ?? 1
    const unitPrice = row.sale_price ?? 0
    const subtotal = unitPrice * quantity
    const existing = map.get(key)
    if (existing) {
      existing.itemCount += 1
      existing.total += subtotal
      existing.items.push({ id: row.id, productName, quantity, unitPrice, subtotal })
      continue
    }
    map.set(key, {
      key,
      date: row.date,
      createdAt: row.created_at ?? row.date,
      total: subtotal,
      itemCount: 1,
      items: [{ id: row.id, productName, quantity, unitPrice, subtotal }],
    })
  }
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export default async function VentasPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ desde?: string; hasta?: string; tipo?: string; pb?: string; pp?: string; p?: string }>
}) {
  const { barbershopId } = await params
  const { desde, hasta, tipo = 'todos', pb, pp, p } = await searchParams

  const defaultDesde = som()
  const defaultHasta = today()

  const from = desde ?? defaultDesde
  const to   = hasta ?? defaultHasta
  const barberPage = Math.max(1, Number(pb ?? p ?? '1') || 1)
  const productPage = Math.max(1, Number(pp ?? p ?? '1') || 1)
  const salesDesktopRangeFrom = (barberPage - 1) * PAGE_SIZE_DESKTOP
  const salesDesktopRangeTo   = barberPage * PAGE_SIZE_DESKTOP - 1
  const productDesktopRangeFrom = (productPage - 1) * PAGE_SIZE_DESKTOP
  const productDesktopRangeTo   = productPage * PAGE_SIZE_DESKTOP - 1
  const mobileProductRangeFrom = (productPage - 1) * PAGE_SIZE_PRODUCTS_MOBILE
  const mobileProductRangeTo   = productPage * PAGE_SIZE_PRODUCTS_MOBILE - 1

  const supabase = await createClient()

  const [
    { data: sales,        count: salesCount },
    { data: salesForBarbers },
    { data: productSales, count: productCount },
    { data: productSalesMobile },
    { data: barbershopPlan },
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('id, amount, status, date, created_at, notes, barbers(name, commission_pct), service_types(name)', { count: 'exact' })
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(salesDesktopRangeFrom, salesDesktopRangeTo),
    supabase
      .from('sales')
      .select('id, amount, status, date, created_at, notes, barbers(name, commission_pct), service_types(name)')
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('product_sales')
      .select('id, sale_price, date, quantity, created_at, transaction_id, products(name)', { count: 'exact' })
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(productDesktopRangeFrom, productDesktopRangeTo),
    supabase
      .from('product_sales')
      .select('id, sale_price, date, quantity, created_at, transaction_id, products(name)')
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(mobileProductRangeFrom, mobileProductRangeTo),
    supabase.from('barbershops').select('plan_name').eq('id', barbershopId).single(),
  ])

  const showStatus = (barbershopPlan?.plan_name ?? 'Base').toLowerCase() !== 'base'

  const salesForBarbersRows = (salesForBarbers as ServiceSaleRow[]) ?? []

  // Totals for the full period (not paginated) — separate count queries
  const [{ data: allSalesTotals }, { data: allProdTotals }] = await Promise.all([
    supabase.from('sales').select('amount, date').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('product_sales').select('sale_price, quantity, date').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
  ])

  const totalServicios = (allSalesTotals ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalProductos = (allProdTotals ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const totalPeriodo   = totalServicios + totalProductos
  const countServicios = salesCount ?? 0
  const countProductos = productCount ?? 0
  const countTotal     = (allSalesTotals ?? []).length + (allProdTotals ?? []).length
  const ticketPromedio = (allSalesTotals ?? []).length > 0 ? totalServicios / (allSalesTotals ?? []).length : 0

  // Daily data for chart — only when range is ≤ 62 days to keep it readable
  const chartData = (() => {
    const map: Record<string, { servicios: number; productos: number }> = {}
    for (const s of allSalesTotals ?? []) {
      const d = (s as { date?: string }).date ?? ''
      if (!map[d]) map[d] = { servicios: 0, productos: 0 }
      map[d].servicios += s.amount ?? 0
    }
    for (const p of allProdTotals ?? []) {
      const d = (p as { date?: string }).date ?? ''
      if (!map[d]) map[d] = { servicios: 0, productos: 0 }
      map[d].productos += (p.sale_price ?? 0) * (p.quantity ?? 1)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, v]) => ({ fecha, ...v }))
  })()

  const totalProductPagesDesktop = Math.ceil(countProductos / PAGE_SIZE_DESKTOP)
  const totalProductPagesMobile = Math.ceil((productCount ?? 0) / PAGE_SIZE_PRODUCTS_MOBILE)
  const groupedProductSalesDesktop = groupProductSales((productSales ?? []) as ProductSaleRow[])
  const groupedProductSalesMobile = groupProductSales((productSalesMobile ?? []) as ProductSaleRow[])
  const hasProductRowsDesktop = (productSales?.length ?? 0) > 0
  const hasProductRowsMobile = (productSalesMobile?.length ?? 0) > 0

  // Últimos 6 meses para accesos rápidos
  const [curY, curM] = defaultDesde.split('-').map(Number)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(curY, curM - 1 - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { ym, label: monthLabel(ym) }
  })

  const tipoTabs = [
    { key: 'todos',    label: `Todos (${countTotal})` },
    { key: 'servicio', label: `Servicios (${countServicios})` },
    { key: 'producto', label: `Productos (${countProductos})` },
  ]

  const baseHref = `?desde=${from}&hasta=${to}&tipo=${tipo}`
  const barbersBaseHref = `${baseHref}&pp=${productPage}`
  const productsBaseHref = `${baseHref}&pb=${barberPage}`

  const salesGroupedByBarberAll = (() => {
    const grouped: Record<string, { barberName: string; count: number; total: number; commission: number; sales: ServiceSaleRow[] }> = {}
    for (const sale of salesForBarbersRows) {
      const barberName = (Array.isArray(sale.barbers) ? sale.barbers?.[0]?.name : sale.barbers?.name) ?? 'Sin asignar'
      const barber = Array.isArray(sale.barbers) ? sale.barbers?.[0] : sale.barbers
      const commission = barber ? Math.round((sale.amount ?? 0) * (barber.commission_pct ?? 0) / 100) : 0
      if (!grouped[barberName]) grouped[barberName] = { barberName, count: 0, total: 0, commission: 0, sales: [] }
      grouped[barberName].count += 1
      grouped[barberName].total += sale.amount ?? 0
      grouped[barberName].commission += commission
      grouped[barberName].sales.push(sale)
    }
    return Object.values(grouped).sort((a, b) => b.total - a.total)
  })()

  const totalBarberPages = Math.ceil(salesGroupedByBarberAll.length / PAGE_SIZE_BARBERS)
  const salesGroupedByBarber = salesGroupedByBarberAll.slice(
    (barberPage - 1) * PAGE_SIZE_BARBERS,
    barberPage * PAGE_SIZE_BARBERS
  )

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Ventas</h1>
      </div>

      <FiltroFechas
        barbershopId={barbershopId}
        desde={from}
        hasta={to}
        tipo={tipo}
        months={months}
      />

      {/* Resumen del período */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total del período</p>
          <p className={`${styles.summaryValue} ${styles.summaryValuePositive}`}>{formatARS(totalPeriodo)}</p>
          {totalServicios > 0 && totalProductos > 0 && (
            <p className={styles.summaryBreak}>{formatARS(totalServicios)} serv. + {formatARS(totalProductos)} prod.</p>
          )}
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Servicios</p>
          <p className={styles.summaryValue}>{countServicios}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Ticket promedio</p>
          <p className={`${styles.summaryValue} ${styles.summaryValueGold}`}>
            {ticketPromedio > 0 ? formatARS(ticketPromedio) : '—'}
          </p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Productos vendidos</p>
          <p className={styles.summaryValue}>{countProductos}</p>
        </div>
      </div>

      {/* Gráfico de ingresos */}
      {chartData.length > 0 && <GraficoIngresos data={chartData} />}

      {/* Resumen por barbero */}
      {salesGroupedByBarberAll.length > 0 && (tipo === 'todos' || tipo === 'servicio') && (
        <div className={styles.byBarber}>
          <h2 className={styles.subTitle}>Actividad por Barbero {barberPage > 1 && <span className={styles.pagNota}>(pág. {barberPage})</span>}</h2>
          <div className={styles.barberGrid}>
            {salesGroupedByBarber.map(group => (
              <div key={group.barberName} className={styles.barberCard}>
                <p className={styles.barberName}>{group.barberName}</p>
                <p className={styles.barberStat}>{group.count} servicios · {formatARS(group.total)}</p>
                <p className={styles.barberComm}>Comisión: {formatARS(group.commission)}</p>
              </div>
            ))}
          </div>

          <BarberMobileAccordion groups={salesGroupedByBarber} showStatus={showStatus} />
          <Paginacion current={barberPage} total={totalBarberPages} baseHref={barbersBaseHref} paramKey="pb" />
        </div>
      )}

      {/* Tabla */}
      <div className={styles.tableSection}>
        <div className={styles.filterRow}>
          <h2 className={styles.subTitle}>Ventas de Productos</h2>
          <div className={styles.filterTabs}>
            {tipoTabs.map(t => (
              <a
                key={t.key}
                href={`?desde=${from}&hasta=${to}&tipo=${t.key}`}
                className={tipo === t.key ? styles.filterTabActive : styles.filterTab}
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
        <p className={`${styles.pagNota} ${styles.desktopRecordsHint}`}>Se muestran hasta 10 registros por tipo y por página.</p>

        {/* Servicios */}
        {(tipo === 'todos' || tipo === 'servicio') && (
          <>
            {tipo === 'todos' && salesGroupedByBarber.length > 0 && (
              <p className={styles.tableGroupLabel}>Servicios</p>
            )}
            {salesGroupedByBarber.length === 0 ? (
              tipo === 'servicio' && <div className={styles.empty}>No hay servicios en este período.</div>
            ) : (
              <div className={`${styles.serviceAccordionList} ${tipo === 'todos' && (productSales ?? []).length > 0 ? styles.serviceTableGap : ''}`}>
                {salesGroupedByBarber.map(group => (
                  <details key={`svc-group-${group.barberName}`} className={styles.accordionGroup}>
                    <summary className={styles.accordionHeader}>
                      <div className={styles.accordionHeaderTop}>
                        <span className={styles.accordionBarber}>{group.barberName}</span>
                        <span className={styles.accordionMeta}>×{group.count} · {formatARS(group.total)}</span>
                      </div>
                    </summary>
                    <div className={styles.accordionBody}>
                      <div className={styles.serviceTxHead}>
                        <span>Hora</span>
                        <span>Servicio</span>
                        <span>Cantidad</span>
                        <span>Monto</span>
                      </div>
                      {group.sales.map(sale => {
                        const serviceName = (Array.isArray(sale.service_types) ? sale.service_types?.[0]?.name : sale.service_types?.name) ?? '—'
                        const isPending = sale.status === 'pending'
                        return (
                          <div key={sale.id} className={styles.serviceTxRow}>
                            <span data-label="Hora">{formatShortDate(sale.date)} · {formatShortTime(sale.created_at ?? sale.date)}</span>
                            <span data-label="Servicio">{serviceName}</span>
                            <span data-label="Cantidad">1</span>
                            <span className={styles.amount} data-label="Monto">
                              {formatARS(sale.amount)}
                              {showStatus && isPending && (
                                <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pendiente</span>
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </>
        )}

        {/* Productos */}
        {(tipo === 'todos' || tipo === 'producto') && (
          <>
            {tipo === 'todos' && (hasProductRowsDesktop || hasProductRowsMobile) && (
              <p className={styles.tableGroupLabel}>Productos vendidos</p>
            )}
            {(!hasProductRowsDesktop && !hasProductRowsMobile) ? (
              tipo === 'producto' && <div className={styles.empty}>No hay ventas de productos en este período.</div>
            ) : (
              <>
                <div className={styles.desktopProductTable}>
                  <div className={styles.table}>
                    {groupedProductSalesDesktop.map(tx => (
                      <details key={tx.key} className={styles.productAccordionItem}>
                        <summary className={styles.productAccordionHeader}>
                          <span className={styles.productAccordionDate}>📦 {formatShortDate(tx.date)} · {formatShortTime(tx.createdAt)}</span>
                          <span className={styles.productAccordionCount}>{tx.itemCount} item(s)</span>
                          <span className={styles.productAccordionTotal}>{formatARS(tx.total)}</span>
                        </summary>
                        <div className={styles.productAccordionBody}>
                          <div className={styles.productAccordionTableHead}>
                            <span>Producto</span>
                            <span>Cantidad</span>
                            <span>Precio Unit.</span>
                            <span>Subtotal</span>
                          </div>
                          {tx.items.map(item => (
                            <div key={item.id} className={styles.productAccordionRow}>
                              <span data-label="Producto">{item.productName}</span>
                              <span data-label="Cantidad">{item.quantity} u.</span>
                              <span data-label="Precio Unit.">{formatARS(item.unitPrice)}</span>
                              <span className={styles.amount} data-label="Subtotal">{formatARS(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>

                <div className={styles.productAccordion}>
                  {groupedProductSalesMobile.map(tx => (
                    <details key={tx.key} className={styles.productAccordionItem}>
                      <summary className={styles.productAccordionHeader}>
                        <span className={styles.productAccordionDate}>📦 {formatShortDate(tx.date)} · {formatShortTime(tx.createdAt)}</span>
                        <span className={styles.productAccordionCount}>{tx.itemCount} item(s)</span>
                        <span className={styles.productAccordionTotal}>{formatARS(tx.total)}</span>
                      </summary>
                      <div className={styles.productAccordionBody}>
                        <div className={styles.productAccordionTableHead}>
                          <span>Producto</span>
                          <span>Cantidad</span>
                          <span>Precio Unit.</span>
                          <span>Subtotal</span>
                        </div>
                        {tx.items.map(item => (
                          <div key={item.id} className={styles.productAccordionRow}>
                            <span data-label="Producto">{item.productName}</span>
                            <span data-label="Cantidad">{item.quantity} u.</span>
                            <span data-label="Precio Unit.">{formatARS(item.unitPrice)}</span>
                            <span className={styles.amount} data-label="Subtotal">{formatARS(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>

                {tipo === 'producto' && (
                  <>
                    <div className={styles.desktopPagination}>
                      {countProductos > PAGE_SIZE_DESKTOP && (
                      <Paginacion current={productPage} total={totalProductPagesDesktop} baseHref={productsBaseHref} paramKey="pp" />
                      )}
                    </div>
                    <div className={styles.mobilePagination}>
                      {countProductos > PAGE_SIZE_PRODUCTS_MOBILE && (
                      <Paginacion current={productPage} total={totalProductPagesMobile} baseHref={productsBaseHref} paramKey="pp" />
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {tipo === 'todos' && (sales ?? []).length === 0 && !hasProductRowsDesktop && !hasProductRowsMobile && (
          <div className={styles.empty}>No hay ventas en este período.</div>
        )}
      </div>
    </div>
  )
}
