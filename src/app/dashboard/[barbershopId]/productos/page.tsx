import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { getServerAuthContext } from '@/services/auth.service'
import { currentYM } from '@/lib/date'
import { redirect } from 'next/navigation'
import NuevoProductoForm from './NuevoProductoForm'
import ProductoRow from './ProductoRow'
import GraficoProductos from './GraficoProductos'
import GraficoBarrasMensuales from './GraficoBarrasMensuales'
import CriticalStockAlert from './CriticalStockAlert'
import KpiContainer from '../finanzas/KpiContainer'
import InfoTooltip from '../finanzas/InfoTooltip'
import CustomRangePicker from '../finanzas/CustomRangePicker'
import styles from './productos.module.css'

export const metadata: Metadata = { title: 'Productos — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISODate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  const parsed = new Date(y, (m ?? 1) - 1, d ?? 1)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function formatShortDate(date: string) {
  const [yyyy, mm, dd] = date.slice(0, 10).split('-')
  if (!yyyy || !mm || !dd) return date
  return `${dd}/${mm}/${yyyy}`
}

function formatLongDate(date: string) {
  const [yyyy, mm, dd] = date.slice(0, 10).split('-').map(Number)
  if (!yyyy || !mm || !dd) return date
  return new Date(yyyy, (mm ?? 1) - 1, dd ?? 1).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function ProductosPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>
}) {
  const { barbershopId } = await params
  const { periodo, desde, hasta } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context || !canAccess(context.role, 'manage_inventory')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const now = new Date()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayISO = toISODate(todayDate)
  const ym = currentYM()
  const [selY, selM] = ym.split('-').map(Number)
  const monthFromDate = new Date(selY, selM - 1, 1)
  const customFrom = parseISODate(desde)
  const customTo = parseISODate(hasta)

  const isBasePlan = (context.plan ?? 'Base').toLowerCase() === 'base'
  const basePlanMinDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 6, todayDate.getDate())
  let periodMode: 'mes' | 'ultima-semana' | 'custom' = 'mes'
  let fromDate = monthFromDate
  let toDate = todayDate
  let rangeAdjustedForPlan = false

  if (periodo === 'custom' && customFrom && customTo) {
    periodMode = 'custom'
    fromDate = customFrom <= customTo ? customFrom : customTo
    toDate = customFrom <= customTo ? customTo : customFrom
    if (toDate > todayDate) toDate = todayDate
    if (isBasePlan && fromDate < basePlanMinDate) {
      fromDate = basePlanMinDate
      rangeAdjustedForPlan = true
    }
    if (fromDate > toDate) {
      toDate = fromDate
      rangeAdjustedForPlan = true
    }
  }

  const from = toISODate(fromDate)
  const to = toISODate(toDate)
  const periodDescription = `Mostrando datos del ${formatShortDate(from)} al ${formatShortDate(to)}`

  const [{ data: products }, { data: recentSales }, { data: salesRangeWithName }, { data: salesRange }] = await Promise.all([
    supabase.from('products').select('id, name, cost_price, sale_price, stock, active').eq('barbershop_id', barbershopId).order('name'),
    supabase.from('product_sales')
      .select('id, quantity, sale_price, date, products(name)')
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('product_sales')
      .select('quantity, sale_price, products(name)')
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to),
    supabase.from('product_sales')
      .select('quantity, sale_price, date')
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to),
  ])

  const activeProducts = (products ?? []).filter(p => p.active)
  const totalStock     = activeProducts.length
  const criticalStock  = activeProducts.filter(p => p.stock < 5)
  const totalVentas    = (salesRangeWithName ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const valorInventario = activeProducts.reduce((s, p) => s + (p.cost_price * p.stock), 0)
  const gananciaPotencial = activeProducts.reduce((s, p) => s + ((p.sale_price - p.cost_price) * p.stock), 0)

  // Agregado por día dentro del rango para gráfico de barras
  const monthMap: Record<string, number> = {}
  for (const s of salesRange ?? []) {
    const key = s.date.slice(0, 10)
    monthMap[key] = (monthMap[key] ?? 0) + (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  const barData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoDate, ingresos]) => {
      const d = parseISODate(isoDate) ?? new Date(isoDate + 'T12:00:00')
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      return { mes: label, ingresos: Math.round(ingresos) }
    })

  // Aggregate for pie chart
  const pieMap: Record<string, { cantidad: number; ingresos: number }> = {}
  for (const s of salesRangeWithName ?? []) {
    const name = (s as { products?: Array<{ name: string }> }).products?.[0]?.name ?? 'Otro'
    if (!pieMap[name]) pieMap[name] = { cantidad: 0, ingresos: 0 }
    pieMap[name].cantidad += s.quantity ?? 1
    pieMap[name].ingresos += (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  const pieData = Object.entries(pieMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 8)

  type RecentSaleRow = {
    id: string
    quantity: number
    sale_price: number
    date: string
    products?: Array<{ name: string }>
  }
  const salesRows = (recentSales ?? []) as RecentSaleRow[]
  const salesByDateMap: Record<string, { total: number; items: RecentSaleRow[] }> = {}
  for (const sale of salesRows) {
    const dateKey = sale.date
    if (!salesByDateMap[dateKey]) {
      salesByDateMap[dateKey] = { total: 0, items: [] }
    }
    salesByDateMap[dateKey].total += (sale.sale_price ?? 0) * (sale.quantity ?? 1)
    salesByDateMap[dateKey].items.push(sale)
  }
  const salesByDate = Object.entries(salesByDateMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, group]) => ({ date, total: group.total, items: group.items }))

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Productos</h1>
        <p className={styles.subtitle}>{periodDescription}</p>
      </div>

      <NuevoProductoForm barbershopId={barbershopId} />

      <div className={styles.periodWrap}>
        <CustomRangePicker
          periodMode={periodMode}
          isBasePlan={isBasePlan}
          rangeAdjustedForPlan={rangeAdjustedForPlan}
          from={from}
          to={to}
          todayISO={todayISO}
          basePlanMinISO={isBasePlan ? toISODate(basePlanMinDate) : undefined}
        />
      </div>

      <CriticalStockAlert items={criticalStock} />

      {/* KPIs */}
      <KpiContainer
        grid="2x2"
        title="KPIs de Inventario"
        summary={`Ventas del período: ${formatARS(totalVentas)}`}
      >
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span className={styles.kpiLabelRow}>
              <span>Productos Activos</span>
              <InfoTooltip
                ariaLabel="Qué significa Productos Activos"
                content="Cantidad de productos habilitados para vender en este momento."
              />
            </span>
          </p>
          <p className={styles.kpiValue}>{totalStock}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span className={styles.kpiLabelRow}>
              <span>Ventas del Período</span>
              <InfoTooltip
                ariaLabel="Qué significa Ventas del Período"
                content="Ingresos por ventas de productos dentro del rango de fechas seleccionado."
              />
            </span>
          </p>
          <p className={`${styles.kpiValue} ${styles.kpiValuePositive}`}>{formatARS(totalVentas)}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span className={styles.kpiLabelRow}>
              <span>Valor Inventario</span>
              <InfoTooltip
                ariaLabel="Qué significa Valor Inventario"
                content="Valor de costo del stock actual: costo de compra por cantidad en stock."
              />
            </span>
          </p>
          <p className={`${styles.kpiValue} ${styles.kpiValueGold}`}>{formatARS(valorInventario)}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span className={styles.kpiLabelRow}>
              <span>Ganancia Potencial</span>
              <InfoTooltip
                ariaLabel="Qué significa Ganancia Potencial"
                content="Ganancia estimada si vendés todo el stock activo. Fórmula: (precio de venta - costo) * stock."
              />
            </span>
          </p>
          <p className={`${styles.kpiValue} ${styles.kpiValuePositive}`}>{formatARS(gananciaPotencial)}</p>
        </div>
      </KpiContainer>

      {/* Gráfico barras mensual (toggle) */}
      <GraficoBarrasMensuales
        data={barData}
        title={`Ingresos por productos — ${formatShortDate(from)} al ${formatShortDate(to)}`}
        emptyMessage="No hay ventas de productos en este rango para mostrar en barras."
      />

      {/* Gráfico torta de más vendidos */}
      <GraficoProductos
        data={pieData}
        title={`Más vendidos — ${formatShortDate(from)} al ${formatShortDate(to)}`}
        emptyMessage="No hay productos vendidos en este rango."
      />

      {/* Tabla de productos */}
      <div className={`${styles.table} ${styles.sectionGap}`}>
        <div className={styles.tableHead}>
          <span>Producto</span>
          <span>Costo</span>
          <span>Venta</span>
          <span>Margen</span>
          <span>Stock</span>
          <span></span>
        </div>
        {!products || products.length === 0 ? (
          <p className={styles.empty}>No hay productos todavía.</p>
        ) : products.map(p => (
          <ProductoRow key={p.id} barbershopId={barbershopId} product={p} />
        ))}
      </div>

      {/* Últimas ventas */}
      {salesByDate.length > 0 && (
        <div className={styles.histSection}>
          <h2 className={styles.histTitle}>Últimas ventas</h2>
          <div className={styles.histGroups}>
            {salesByDate.map((group, idx) => (
              <details key={group.date} className={styles.histDayGroup} open={idx === 0}>
                <summary className={styles.histDaySummary}>
                  <div>
                    <p className={styles.histDayDate}>{formatLongDate(group.date)}</p>
                    <p className={styles.histDayMeta}>{group.items.length} venta(s)</p>
                  </div>
                  <div className={styles.histDaySummaryRight}>
                    <span className={styles.histDayTotal}>{formatARS(group.total)}</span>
                    <span className={styles.histDayChevron} aria-hidden>▾</span>
                  </div>
                </summary>
                <div className={styles.histDayBody}>
                  <div className={styles.histDayTableHead}>
                    <span>Producto</span>
                    <span>Cantidad</span>
                    <span>Precio Unit.</span>
                    <span>Subtotal</span>
                  </div>
                  {group.items.map((s) => (
                    <div key={s.id} className={styles.histDayRow}>
                      <span>{s.products?.[0]?.name ?? '—'}</span>
                      <span className={styles.muted}>{s.quantity} u.</span>
                      <span className={styles.muted}>{formatARS(s.sale_price)}</span>
                      <span className={styles.histAmount}>{formatARS((s.sale_price ?? 0) * (s.quantity ?? 1))}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
