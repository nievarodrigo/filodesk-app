import type { Metadata } from 'next'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { currentYM } from '@/lib/date'
import type { SaleWithCommission, SaleWithBarber, SaleWithServiceType, ProductSaleWithProduct } from '@/lib/definitions'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { DollarSign, Package, PieChart, TrendingUp } from 'lucide-react'
import { getServerAuthContext } from '@/services/auth.service'
import { isFeatureEnabled } from '@/services/plan.service'
import { redirect } from 'next/navigation'
import ResumenMensual from './ResumenMensual'
import VentasPorBarbero from './VentasPorBarbero'
import DailyQuickView from './DailyQuickView'
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

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function diffDaysInclusive(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  const ms = end.getTime() - start.getTime()
  return Math.max(1, Math.floor(ms / 86400000) + 1)
}

function formatShortDate(date: string) {
  const [yyyy, mm, dd] = date.slice(0, 10).split('-')
  if (!yyyy || !mm || !dd) return date
  return `${dd}/${mm}/${yyyy}`
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default async function FinanzasPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ mes?: string; periodo?: string; desde?: string; hasta?: string }>
}) {
  const { barbershopId } = await params
  const { mes, periodo, desde, hasta } = await searchParams
  const hdrs = await headers()
  const userAgent = hdrs.get('user-agent') || ''
  const isMobile = /mobile/i.test(userAgent)
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
  const monthFromDate = new Date(selY, selM - 1, 1)
  const monthToDate = new Date(selY, selM, 0)
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekFromDate = addDays(todayDate, -7)

  const customFrom = parseISODate(desde)
  const customTo = parseISODate(hasta)

  const isBasePlan = (context.plan ?? 'Base').toLowerCase() === 'base'
  const basePlanMinDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 6, todayDate.getDate())

  let periodMode: 'mes' | 'ultima-semana' | 'custom' = 'mes'
  let fromDate = monthFromDate
  let toDate = monthToDate
  let rangeAdjustedForPlan = false

  if (periodo === 'ultima-semana') {
    periodMode = 'ultima-semana'
    fromDate = weekFromDate
    toDate = todayDate
  } else if (customFrom && customTo) {
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
  const todayISO = toISODate(todayDate)
  const rangeDays = diffDaysInclusive(fromDate, toDate)
  const prevToDate = addDays(fromDate, -1)
  const prevFromDate = addDays(prevToDate, -(rangeDays - 1))
  const prevFrom = toISODate(prevFromDate)
  const prevTo = toISODate(prevToDate)

  const isCurrentMonth = periodMode === 'mes' && ym === currentYM()
  const daysInMonth = new Date(selY, selM, 0).getDate()
  const dayOfMonth = isCurrentMonth ? now.getDate() : daysInMonth
  const periodDescription = periodMode === 'ultima-semana'
    ? `Última semana (${formatShortDate(from)} al ${formatShortDate(to)})`
    : periodMode === 'custom'
      ? `Rango personalizado (${formatShortDate(from)} al ${formatShortDate(to)})`
      : `Resumen y exportación de ${monthLabel(ym)}`

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
    { data: salesToday },
    { data: productSalesToday },
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
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).eq('status', 'approved').eq('date', todayISO),
    supabase.from('product_sales').select('sale_price, quantity').eq('barbershop_id', barbershopId).eq('date', todayISO),
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
  const isProjectionAvailable = periodMode === 'mes' && isCurrentMonth && proyeccion !== null
  const avgDailyProjection = dayOfMonth > 0 ? Math.round(ingresosMes / dayOfMonth) : 0

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
  const prodPrev = (productSalesPrev ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const prodDelta = pctChange(ingProductos, prodPrev)
  const totalServiciosPrev = (salesPrev ?? []).length
  const ticketPromedioPrev = totalServiciosPrev > 0 ? Math.round(ingPrev / totalServiciosPrev) : 0
  const ticketDelta = pctChange(ticketPromedio, ticketPromedioPrev)
  const margenOperativo = ingresosMes - gastosMes
  const margenOperativoPrev = ingPrev - gasPrev
  const margenOperativoDelta = pctChange(margenOperativo, margenOperativoPrev)
  const marginPct = ingresosMes > 0 ? Math.round((netoMes / ingresosMes) * 100) : 0
  const ventasHoyServicios = (salesToday ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const ventasHoyProductos = (productSalesToday ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const ventasHoy = ventasHoyServicios + ventasHoyProductos
  const serviciosHoy = (salesToday ?? []).length
  const efectivoHoy: number | null = null
  const transferenciaHoy: number | null = null
  const topExpenseCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const topCommissionBarbers = [...barberData]
    .sort((a, b) => b.comision - a.comision)
    .slice(0, 2)
  const canExportData = isFeatureEnabled(context.plan, 'export_data')
  const financeExportRows = [
    { tipo: 'Resumen', metrica: 'Mes', valor: monthLabel(ym) },
    { tipo: 'Resumen', metrica: 'Ingresos', valor: ingresosMes },
    { tipo: 'Resumen', metrica: 'Gastos', valor: gastosMes },
    { tipo: 'Resumen', metrica: 'Comisiones', valor: comisionesMes },
    { tipo: 'Resumen', metrica: 'Neto', valor: netoMes },
    { tipo: 'Resumen', metrica: 'Margen de ganancia', valor: `${marginPct}%` },
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

  const interactiveKpis = [
    { label: 'Ingresos', value: formatARS(ingresosMes), delta: ingDelta },
    { label: 'Gastos',   value: formatARS(gastosMes),   delta: gasDelta },
    { label: 'Comisiones', value: formatARS(comisionesMes), delta: null },
    { label: 'Neto',     value: formatARS(netoMes),     delta: null },
  ]

  const strategicKpis: Array<{
    label: string
    value: string
    detail: string
    delta: number | null
    Icon: LucideIcon
    valueClass?: string
  }> = [
    {
      label: 'Ingresos Brutos',
      value: formatARS(ingresosMes),
      detail: 'Ventas + servicios del período',
      delta: ingDelta,
      Icon: DollarSign,
      valueClass: styles.kpiValuePositive,
    },
    {
      label: 'Ticket Promedio (AOV)',
      value: formatARS(ticketPromedio),
      detail: `${totalServicios} ventas de servicio`,
      delta: ticketDelta,
      Icon: TrendingUp,
      valueClass: styles.kpiValueGold,
    },
    {
      label: 'Ventas de Productos',
      value: formatARS(ingProductos),
      detail: `${prodRanking.reduce((acc, prod) => acc + prod.cantidad, 0)} unidades vendidas`,
      delta: prodDelta,
      Icon: Package,
      valueClass: styles.kpiValuePositive,
    },
    {
      label: 'Margen Operativo (Estimado)',
      value: formatARS(margenOperativo),
      detail: 'Ingresos - gastos registrados',
      delta: margenOperativoDelta,
      Icon: PieChart,
      valueClass: margenOperativo >= 0 ? styles.kpiValuePositive : styles.kpiValueNegative,
    },
  ]

  const operationalKpis = [
    {
      label: 'Ticket Promedio',
      value: formatARS(ticketPromedio),
      valueClass: styles.kpiValueGold,
      detail: `${totalServicios} servicios realizados`,
      cardClass: '',
    },
    {
      label: 'Mejor Día',
      value: bestDay ? DIAS[bestDay.dow] : '—',
      valueClass: bestDay ? styles.kpiValuePositive : styles.kpiValueMuted,
      detail: bestDay
        ? `${formatARS(bestDay.avg)} promedio por ${DIAS[bestDay.dow].toLowerCase()}`
        : 'Sin datos suficientes',
      cardClass: '',
    },
    {
      label: 'Proyección',
      value: isProjectionAvailable ? formatARS(proyeccion) : 'N/A',
      valueClass: isProjectionAvailable ? styles.kpiValueGold : styles.kpiValueMuted,
      detail: isProjectionAvailable
        ? `Día ${dayOfMonth} de ${daysInMonth} al ritmo actual`
        : 'Proyección solo disponible en vista mensual',
      cardClass: styles.kpiCardForecast,
    },
    {
      label: 'Margen de Ganancia',
      value: `${marginPct}%`,
      valueClass: marginPct > 30 ? styles.kpiValuePositive : (marginPct >= 15 ? styles.kpiValueGold : styles.kpiValueNegative),
      detail: ingresosMes > 0
        ? `${formatARS(netoMes)} neto sobre ${formatARS(ingresosMes)} ingresados`
        : 'Sin ingresos para calcular',
      cardClass: '',
    },
  ]

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Finanzas</h1>
          <p className={styles.subtitle}>{periodDescription}</p>
        </div>
        <ExportCsvButton
          data={financeExportRows}
          filename={`finanzas-${barbershopId}-${ym}.csv`}
          enabled={canExportData}
          barbershopId={barbershopId}
        />
      </div>
      <div className={styles.periodNav}>
        <div className={styles.monthNav}>
          <a
            href="?periodo=ultima-semana"
            className={periodMode === 'ultima-semana' ? styles.monthActive : styles.monthTab}
          >
            Última semana
          </a>
          {months.map(mo => (
            <a key={mo} href={`?mes=${mo}`} className={periodMode === 'mes' && mo === ym ? styles.monthActive : styles.monthTab}>
              {monthLabel(mo)}
            </a>
          ))}
        </div>
        <details className={styles.customRangePicker}>
          <summary className={`${styles.customRangeTrigger} ${periodMode === 'custom' ? styles.customRangeTriggerActive : ''}`} aria-label="Rango personalizado">
            <svg viewBox="0 0 24 24" className={styles.calendarIcon} aria-hidden>
              <path d="M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <form className={styles.customRangeForm} method="get">
            <input type="hidden" name="periodo" value="custom" />
            <label className={styles.customRangeField}>
              <span>Desde</span>
              <input type="date" name="desde" defaultValue={from} max={toISODate(todayDate)} min={isBasePlan ? toISODate(basePlanMinDate) : undefined} />
            </label>
            <label className={styles.customRangeField}>
              <span>Hasta</span>
              <input type="date" name="hasta" defaultValue={to} max={toISODate(todayDate)} min={isBasePlan ? toISODate(basePlanMinDate) : undefined} />
            </label>
            <button type="submit" className={styles.customRangeSubmit}>Aplicar</button>
            {isBasePlan && (
              <p className={styles.customRangeHint}>Plan Base: máximo 6 meses de historial.</p>
            )}
            {rangeAdjustedForPlan && (
              <p className={styles.customRangeWarning}>Rango ajustado automáticamente al límite de 6 meses.</p>
            )}
          </form>
        </details>
      </div>
      <DailyQuickView
        salesToday={ventasHoy}
        servicesToday={serviciosHoy}
        cashToday={efectivoHoy}
        transferToday={transferenciaHoy}
      />
      <div className={styles.kpiBlock}>
        <div className={`${styles.kpis} ${styles.masterKpis}`}>
          {strategicKpis.map((kpi) => (
            <div key={kpi.label} className={`${styles.kpiCard} ${styles.masterKpiCard}`}>
              <div className={styles.masterKpiHeader}>
                <div className={styles.masterKpiIconWrap}>
                  <kpi.Icon className={styles.masterKpiIcon} aria-hidden />
                </div>
                <p className={styles.kpiLabel}>{kpi.label}</p>
              </div>
              <p className={`${styles.kpiValue} ${kpi.valueClass ?? ''}`}>{kpi.value}</p>
              <p className={styles.kpiMeta}>{kpi.detail}</p>
              {kpi.delta !== null && (
                <p className={`${styles.kpiDelta} ${kpi.delta >= 0 ? styles.kpiDeltaPositive : styles.kpiDeltaNegative}`}>
                  <span>{kpi.delta >= 0 ? '▲' : '▼'}</span>
                  <span>{Math.abs(kpi.delta)}%</span>
                  <span className={styles.kpiDeltaLong}>vs período anterior</span>
                  <span className={styles.kpiDeltaShort}>vs ant.</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.kpiBlock}>
      <div className={styles.kpis}>
        {interactiveKpis.map(k => (
          <details key={k.label} className={`${styles.kpiCard} ${styles.kpiInteractive}`} open={isMobile && k.label === 'Ingresos'}>
            <summary className={styles.kpiSummary}>
              <div>
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
              </div>
              <span className={styles.kpiChevron} aria-hidden>▾</span>
            </summary>
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
            <div className={styles.kpiExpand}>
              <div className={styles.kpiExpandInner}>
                {k.label === 'Ingresos' && (
                  <ul className={styles.kpiDrillList}>
                    <li className={styles.kpiDrillRow}>
                      <span className={styles.kpiDrillKey}>Servicios</span>
                      <span className={styles.kpiDrillValue}>{formatARS(ingServicios)}</span>
                    </li>
                    <li className={styles.kpiDrillRow}>
                      <span className={styles.kpiDrillKey}>Productos</span>
                      <span className={styles.kpiDrillValue}>{formatARS(ingProductos)}</span>
                    </li>
                  </ul>
                )}
                {k.label === 'Gastos' && (
                  <>
                    <ul className={styles.kpiDrillList}>
                      {topExpenseCategories.length > 0 ? topExpenseCategories.map(([cat, amt]) => (
                        <li key={cat} className={styles.kpiDrillRow}>
                          <span className={styles.kpiDrillKey}>{cat}</span>
                          <span className={styles.kpiDrillValue}>{formatARS(amt)}</span>
                        </li>
                      )) : (
                        <li className={styles.kpiDrillRow}>
                          <span className={styles.kpiDrillKey}>Sin gastos</span>
                          <span className={styles.kpiDrillValue}>—</span>
                        </li>
                      )}
                    </ul>
                    <Link href={`/dashboard/${barbershopId}/gastos`} className={styles.kpiActionLink}>
                      <span aria-hidden>+</span>
                      <span>Gestionar Gastos</span>
                    </Link>
                  </>
                )}
                {k.label === 'Comisiones' && (
                  <ul className={styles.kpiDrillList}>
                    {topCommissionBarbers.length > 0 ? topCommissionBarbers.map((barber) => (
                      <li key={barber.name} className={styles.kpiDrillRow}>
                        <span className={styles.kpiDrillKey}>{barber.name}</span>
                        <span className={styles.kpiDrillValue}>{formatARS(barber.comision)}</span>
                      </li>
                    )) : (
                      <li className={styles.kpiDrillRow}>
                        <span className={styles.kpiDrillKey}>Sin comisiones</span>
                        <span className={styles.kpiDrillValue}>—</span>
                      </li>
                    )}
                  </ul>
                )}
                {k.label === 'Neto' && (
                  <ul className={styles.kpiDrillList}>
                    <li className={styles.kpiDrillRow}>
                      <span className={styles.kpiDrillKey}>Fórmula</span>
                      <span className={styles.kpiDrillValue}>Ingresos - (Gastos + Comisiones)</span>
                    </li>
                    <li className={styles.kpiDrillRow}>
                      <span className={styles.kpiDrillKey}>Cálculo</span>
                      <span className={styles.kpiDrillValue}>{formatARS(ingresosMes)} - ({formatARS(gastosMes)} + {formatARS(comisionesMes)})</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
      </div>
      <div className={styles.kpiBlock}>
        <div className={styles.kpis}>
          {operationalKpis.map(k => (
            k.label === 'Proyección' ? (
              isProjectionAvailable ? (
                <details key={k.label} className={`${styles.kpiCard} ${styles.kpiInteractive} ${k.cardClass}`}>
                  <summary className={styles.kpiSummary}>
                    <div>
                      <p className={styles.kpiLabel}>{k.label}</p>
                      <p className={`${styles.kpiValue} ${k.valueClass}`}>{k.value}</p>
                    </div>
                    <span className={styles.kpiChevron} aria-hidden>▾</span>
                  </summary>
                  <p className={styles.kpiMeta}>{k.detail}</p>
                  <div className={styles.kpiExpand}>
                    <div className={styles.kpiExpandInner}>
                      <ul className={styles.kpiDrillList}>
                        <li className={styles.kpiDrillRow}>
                          <span className={styles.kpiDrillKey}>Fórmula</span>
                          <span className={styles.kpiDrillValue}>(Ingresos / Día actual) * Días del mes</span>
                        </li>
                        <li className={styles.kpiDrillRow}>
                          <span className={styles.kpiDrillKey}>Ingresos hoy</span>
                          <span className={styles.kpiDrillValue}>{formatARS(ingresosMes)}</span>
                        </li>
                        <li className={styles.kpiDrillRow}>
                          <span className={styles.kpiDrillKey}>Promedio diario</span>
                          <span className={styles.kpiDrillValue}>{formatARS(avgDailyProjection)}</span>
                        </li>
                        <li className={styles.kpiDrillRow}>
                          <span className={styles.kpiDrillKey}>Días del mes</span>
                          <span className={styles.kpiDrillValue}>{daysInMonth}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </details>
              ) : (
                <div key={k.label} className={`${styles.kpiCard} ${k.cardClass}`}>
                  <p className={styles.kpiLabel}>{k.label}</p>
                  <p className={`${styles.kpiValue} ${k.valueClass}`}>{k.value}</p>
                  <p className={styles.kpiMeta}>{k.detail}</p>
                </div>
              )
            ) : (
              <div key={k.label} className={`${styles.kpiCard} ${k.cardClass}`}>
                <p className={styles.kpiLabel}>{k.label}</p>
                <p className={`${styles.kpiValue} ${k.valueClass}`}>{k.value}</p>
                <p className={styles.kpiMeta}>{k.detail}</p>
              </div>
            )
          ))}
        </div>
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
