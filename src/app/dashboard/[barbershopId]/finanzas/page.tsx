import type { Metadata } from 'next'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { currentYM } from '@/lib/date'
import type { SaleWithCommission, SaleWithBarber, SaleWithServiceType, ProductSaleWithProduct } from '@/lib/definitions'
import { getServerAuthContext } from '@/services/auth.service'
import { isFeatureEnabled } from '@/services/plan.service'
import { redirect } from 'next/navigation'
import ResumenMensual from './ResumenMensual'
import VentasPorBarbero from './VentasPorBarbero'
import styles from './finanzas.module.css'

export const metadata: Metadata = { title: 'Finanzas — FiloDesk' }
export const dynamic = 'force-dynamic'

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// Helpers para normalizar acceso a relaciones de Supabase
function getBarber(barbers: unknown): { name?: string; commission_pct?: number } | null {
  if (Array.isArray(barbers)) return barbers[0] || null
  return barbers as { name?: string; commission_pct?: number } || null
}

function getServiceType(service_types: unknown): { name?: string } | null {
  if (Array.isArray(service_types)) return service_types[0] || null
  return service_types as { name?: string } || null
}

function getProduct(products: unknown): { name?: string } | null {
  if (Array.isArray(products)) return products[0] || null
  return products as { name?: string } || null
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default async function FinanzasPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const { barbershopId } = await params
  const { mes } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context || !canAccess(context.role, 'view_finance')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const now = new Date()

  const ym = mes ?? currentYM()
  const [selY, selM] = ym.split('-').map(Number)
  const from = `${ym}-01`
  const to   = `${selY}-${String(selM).padStart(2, '0')}-${new Date(selY, selM, 0).getDate()}`

  const isCurrentMonth = ym === currentYM()
  const daysInMonth    = new Date(selY, selM, 0).getDate()
  const dayOfMonth     = isCurrentMonth ? now.getDate() : daysInMonth

  const prevD     = new Date(selY, selM - 2, 1)
  const prevYM    = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`
  const prevFrom  = `${prevYM}-01`
  const prevTo    = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}-${new Date(prevD.getFullYear(), prevD.getMonth() + 1, 0).getDate()}`

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)

  const [curY, curM] = currentYM().split('-').map(Number)
  const months: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(curY, curM - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [
    { data: salesMonth },
    { data: salesMonthWithComm },
    { data: salesMonthDates },
    { data: productSalesMonth },
    { data: expensesMonth },
    { data: salesPrev },
    { data: productSalesPrev },
    { data: expensesPrev },
    { data: salesAll6m },
    { data: productSalesAll6m },
    { data: expensesAll6m },
    { data: barberSalesMonth },
    { data: prodSalesMonth },
    { data: serviceCountMonth },
  ] = await Promise.all([
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).eq('status', 'approved').gte('date', from).lte('date', to),
    supabase.from('sales').select('amount, barbers(commission_pct)').eq('barbershop_id', barbershopId).eq('status', 'approved').gte('date', from).lte('date', to),
    supabase.from('sales').select('amount, date').eq('barbershop_id', barbershopId).eq('status', 'approved').gte('date', from).lte('date', to),
    supabase.from('product_sales').select('sale_price, quantity').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('expenses').select('amount, category').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).eq('status', 'approved').gte('date', prevFrom).lte('date', prevTo),
    supabase.from('product_sales').select('sale_price, quantity').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    supabase.from('expenses').select('amount').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    supabase.from('sales').select('amount, date').eq('barbershop_id', barbershopId).eq('status', 'approved').gte('date', sixMonthsAgo),
    supabase.from('product_sales').select('sale_price, quantity, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    supabase.from('expenses').select('amount, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    supabase.from('sales').select('amount, barber_id, barbers(name, commission_pct)').eq('barbershop_id', barbershopId).eq('status', 'approved').gte('date', from).lte('date', to),
    supabase.from('product_sales').select('quantity, sale_price, products(name)').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('sales').select('amount, service_types(name)').eq('barbershop_id', barbershopId).eq('status', 'approved').gte('date', from).lte('date', to),
  ])

  const ingServicios = (salesMonth ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const ingProductos = (productSalesMonth ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const ingresosMes  = ingServicios + ingProductos
  const gastosMes    = (expensesMonth ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const comisionesMes = (salesMonthWithComm ?? [] as SaleWithCommission[]).reduce((s, r) => {
    const barber = getBarber(r.barbers)
    const pct = barber?.commission_pct ?? 0
    const amount = r.amount ?? 0
    return s + Math.round(amount * pct / 100)
  }, 0)
  const netoMes = ingresosMes - gastosMes - comisionesMes

  const ingPrev = (salesPrev ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
    + (productSalesPrev ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const gasPrev = (expensesPrev ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)

  const totalServicios = (salesMonth ?? []).length
  const ticketPromedio = totalServicios > 0 ? Math.round(ingServicios / totalServicios) : 0

  const dayTotals: Record<number, { total: number; days: Set<string> }> = {}
  for (const s of salesMonthDates ?? []) {
    const d = new Date(s.date + 'T12:00:00')
    const dow = d.getDay()
    if (!dayTotals[dow]) dayTotals[dow] = { total: 0, days: new Set() }
    dayTotals[dow].total += s.amount ?? 0
    dayTotals[dow].days.add(s.date)
  }
  const dayAvgs = Object.entries(dayTotals)
    .map(([dow, v]) => ({ dow: Number(dow), avg: Math.round(v.total / v.days.size), total: v.total }))
    .sort((a, b) => b.avg - a.avg)
  const bestDay = dayAvgs[0] ?? null

  const proyeccion = isCurrentMonth && dayOfMonth > 1
    ? Math.round(ingresosMes / dayOfMonth * daysInMonth)
    : null

  const trendMap: Record<string, { ingresos: number; gastos: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    trendMap[key] = { ingresos: 0, gastos: 0 }
  }
  for (const s of salesAll6m ?? []) {
    const key = s.date.slice(0, 7)
    if (trendMap[key]) trendMap[key].ingresos += s.amount ?? 0
  }
  for (const s of productSalesAll6m ?? []) {
    const key = s.date.slice(0, 7)
    if (trendMap[key]) trendMap[key].ingresos += (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  for (const e of expensesAll6m ?? []) {
    const key = e.date.slice(0, 7)
    if (trendMap[key]) trendMap[key].gastos += e.amount ?? 0
  }
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ymk, v]) => ({ mes: MESES[Number(ymk.split('-')[1]) - 1], ingresos: Math.round(v.ingresos), gastos: Math.round(v.gastos) }))

  const barberMap: Record<string, { name: string; total: number; pct: number }> = {}
  for (const s of barberSalesMonth ?? [] as SaleWithBarber[]) {
    const barber = getBarber(s.barbers)
    // Saltar si no hay datos de barbero
    if (!barber || !barber.name) continue
    const id = s.barber_id
    if (!barberMap[id]) barberMap[id] = { name: barber.name, total: 0, pct: barber.commission_pct ?? 0 }
    barberMap[id].total += s.amount ?? 0
  }
  const barberData = Object.values(barberMap)
    .map(b => ({ name: b.name, total: Math.round(b.total), comision: Math.round(b.total * b.pct / 100) }))
    .sort((a, b) => b.total - a.total)

  const svcMap: Record<string, { count: number; total: number }> = {}
  for (const s of serviceCountMonth ?? [] as SaleWithServiceType[]) {
    const serviceType = getServiceType(s.service_types)
    const name = serviceType?.name ?? 'Otro'
    if (!svcMap[name]) svcMap[name] = { count: 0, total: 0 }
    svcMap[name].count += 1
    svcMap[name].total += s.amount ?? 0
  }
  const svcRanking = Object.entries(svcMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const pieMap: Record<string, { cantidad: number; ingresos: number }> = {}
  for (const s of prodSalesMonth ?? [] as ProductSaleWithProduct[]) {
    const product = getProduct(s.products)
    const name = product?.name ?? 'Otro'
    if (!pieMap[name]) pieMap[name] = { cantidad: 0, ingresos: 0 }
    pieMap[name].cantidad += s.quantity ?? 1
    pieMap[name].ingresos += (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  const prodRanking = Object.entries(pieMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 6)

  const catMap: Record<string, number> = {}
  for (const e of expensesMonth ?? []) {
    const cat = e.category ?? 'Otros'
    catMap[cat] = (catMap[cat] ?? 0) + (e.amount ?? 0)
  }

  const ingDelta = pctChange(ingresosMes, ingPrev)
  const gasDelta = pctChange(gastosMes, gasPrev)
  const canExportData = isFeatureEnabled(context.plan, 'export_data')
  const financeExportRows = [
    { tipo: 'Resumen', metrica: 'Mes', valor: monthLabel(ym) },
    { tipo: 'Resumen', metrica: 'Ingresos', valor: ingresosMes },
    { tipo: 'Resumen', metrica: 'Gastos', valor: gastosMes },
    { tipo: 'Resumen', metrica: 'Comisiones', valor: comisionesMes },
    { tipo: 'Resumen', metrica: 'Neto', valor: netoMes },
    { tipo: 'Resumen', metrica: 'Ticket promedio', valor: ticketPromedio },
    ...barberData.map((barber) => ({
      tipo: 'Barbero',
      nombre: barber.name,
      ventas: barber.total,
      comision: barber.comision,
    })),
    ...svcRanking.map((service) => ({
      tipo: 'Servicio',
      nombre: service.name,
      cantidad: service.count,
      ingresos: service.total,
    })),
    ...prodRanking.map((product) => ({
      tipo: 'Producto',
      nombre: product.name,
      cantidad: product.cantidad,
      ingresos: product.ingresos,
    })),
  ]

  const kpis = [
    { label: 'Ingresos', value: formatARS(ingresosMes), delta: ingDelta },
    { label: 'Gastos',   value: formatARS(gastosMes),   delta: gasDelta },
    { label: 'Comisiones', value: formatARS(comisionesMes), delta: null },
    { label: 'Neto',     value: formatARS(netoMes),     delta: null },
  ]

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Finanzas</h1>
          <p className={styles.subtitle}>Resumen y exportación del mes actual</p>
        </div>
        <ExportCsvButton
          data={financeExportRows}
          filename={`finanzas-${barbershopId}-${ym}.csv`}
          enabled={canExportData}
          barbershopId={barbershopId}
        />
      </div>
      <div className={styles.monthNav}>
        {months.map(mo => (
          <a key={mo} href={`?mes=${mo}`} className={mo === ym ? styles.monthActive : styles.monthTab}>
            {monthLabel(mo)}
          </a>
        ))}
      </div>
      <div className={styles.kpis}>
        {kpis.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={`${styles.kpiValue} ${
              k.label === 'Ingresos'
                ? styles.kpiValuePositive
                : k.label === 'Gastos'
                  ? styles.kpiValueNegative
                  : k.label === 'Comisiones'
                    ? styles.kpiValueMuted
                    : (netoMes >= 0 ? styles.kpiValuePositive : styles.kpiValueNegative)
            }`}>{k.value}</p>
            {k.delta !== null && (
              <p className={`${styles.kpiDelta} ${
                k.label === 'Gastos'
                  ? (k.delta > 0 ? styles.kpiDeltaNegative : styles.kpiDeltaPositive)
                  : (k.delta >= 0 ? styles.kpiDeltaPositive : styles.kpiDeltaNegative)
              }`}>
                <span>{k.delta >= 0 ? '▲' : '▼'}</span>
                <span>{Math.abs(k.delta)}%</span>
                <span className={styles.kpiDeltaLong}>vs mes anterior</span>
                <span className={styles.kpiDeltaShort}>vs mes ant.</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Ticket promedio</p>
          <p className={styles.statValue}>{formatARS(ticketPromedio)}</p>
          <p className={styles.statDetail}>{totalServicios} servicios realizados</p>
        </div>
        {bestDay && (
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Mejor día</p>
            <p className={styles.statValue}>{DIAS[bestDay.dow]}</p>
            <p className={styles.statDetail}>{formatARS(bestDay.avg)} promedio por {DIAS[bestDay.dow].toLowerCase()}</p>
          </div>
        )}
        {proyeccion !== null && (
          <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
            <p className={styles.statLabel}>Proyección del mes</p>
            <p className={`${styles.statValue} ${styles.statValueHighlight}`}>{formatARS(proyeccion)}</p>
            <p className={styles.statDetail}>Día {dayOfMonth} de {daysInMonth} — al ritmo actual</p>
          </div>
        )}
      </div>
      <div className={styles.section}>
        <ResumenMensual data={trendData} />
      </div>
      <div className={styles.twoCol}>
        <div>
          <VentasPorBarbero data={barberData} />
        </div>
        <div className={styles.panelCard}>
          <p className={styles.panelTitle}>Gastos por categoría</p>
          {Object.keys(catMap).length === 0 ? (
            <p className={styles.panelEmpty}>Sin gastos este mes.</p>
          ) : (
            <div className={styles.categoryList}>
              {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} className={styles.categoryRow}>
                  <div className={styles.categoryHeader}>
                    <span className={styles.categoryName}>{cat}</span>
                    <span className={styles.categoryAmount}>{formatARS(amt)}</span>
                  </div>
                  <div className={styles.categoryBarContainer}>
                    <progress
                      className={`${styles.categoryBarFill} ${
                        cat === 'Alquiler'
                          ? styles.categoryFillAlquiler
                          : cat === 'Productos'
                            ? styles.categoryFillProductos
                            : cat === 'Servicios'
                              ? styles.categoryFillServicios
                              : cat === 'Sueldos'
                                ? styles.categoryFillSueldos
                                : styles.categoryFillOtros
                      }`}
                      value={Math.min(100, Math.round((amt / (gastosMes || 1)) * 100))}
                      max={100}
                      aria-label={`Participación de ${cat} en gastos`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.twoCol}>
        {svcRanking.length > 0 && (
          <div className={styles.panelCard}>
            <p className={styles.panelTitle}>Top servicios</p>
            <div className={styles.rankingList}>
              {svcRanking.map((svc, i) => (
                <div key={svc.name} className={styles.rankingRow}>
                  <div className={styles.rankingLeft}>
                    <span className={styles.rankingPos}>#{i + 1}</span>
                    <span className={styles.rankingName}>{svc.name}</span>
                  </div>
                  <div className={styles.rankingMetrics}>
                    <span className={styles.rankingQty}>{svc.count} servicios</span>
                    <span className={styles.rankingAmount}>{formatARS(svc.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {prodRanking.length > 0 && (
          <div className={styles.panelCard}>
            <p className={styles.panelTitle}>Top productos</p>
            <div className={styles.rankingList}>
              {prodRanking.map((prod, i) => (
                <div key={prod.name} className={styles.rankingRow}>
                  <div className={styles.rankingLeft}>
                    <span className={styles.rankingPos}>#{i + 1}</span>
                    <span className={styles.rankingName}>{prod.name}</span>
                  </div>
                  <div className={styles.rankingMetrics}>
                    <span className={styles.rankingQty}>{prod.cantidad} unidades</span>
                    <span className={styles.rankingAmount}>{formatARS(prod.ingresos)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
