import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { currentYM } from '@/lib/date'
import type { SaleWithCommission, SaleWithBarber, SaleWithServiceType, ProductSaleWithProduct } from '@/lib/definitions'
import ResumenMensual from './ResumenMensual'
import VentasPorBarbero from './VentasPorBarbero'
import RankingSelector from './RankingSelector'
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

const CATEGORY_COLORS: Record<string, string> = {
  Alquiler: 'var(--gold)', Productos: '#5ecf87', Servicios: '#7eb8f7', Sueldos: '#e07070', Otros: 'var(--muted)',
}

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

  const now = new Date()

  // ── Selected month range ─────────────────────────────────────
  const ym = mes ?? currentYM()
  const [selY, selM] = ym.split('-').map(Number)
  const from = `${ym}-01`
  const to   = `${selY}-${String(selM).padStart(2, '0')}-${new Date(selY, selM, 0).getDate()}`

  const isCurrentMonth = ym === currentYM()
  const daysInMonth    = new Date(selY, selM, 0).getDate()
  const dayOfMonth     = isCurrentMonth ? now.getDate() : daysInMonth

  // Previous month range
  const prevD     = new Date(selY, selM - 2, 1)
  const prevYM    = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`
  const prevFrom  = `${prevYM}-01`
  const prevTo    = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}-${new Date(prevD.getFullYear(), prevD.getMonth() + 1, 0).getDate()}`

  // 6 months for trend chart (always from current date)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)

  // Month tabs
  const [curY, curM] = currentYM().split('-').map(Number)
  const months: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(curY, curM - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // ── Queries ──────────────────────────────────────────────────
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
    // Selected month
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('sales').select('amount, barbers(commission_pct)').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('sales').select('amount, date').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('product_sales').select('sale_price, quantity').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    supabase.from('expenses').select('amount, category').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    // Previous month
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    supabase.from('product_sales').select('sale_price, quantity').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    supabase.from('expenses').select('amount').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    // Last 6 months (trend)
    supabase.from('sales').select('amount, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    supabase.from('product_sales').select('sale_price, quantity, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    supabase.from('expenses').select('amount, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    // Barber sales (selected month)
    supabase.from('sales').select('amount, barber_id, barbers(name, commission_pct)').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    // Products (selected month)
    supabase.from('product_sales').select('quantity, sale_price, products(name)').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
    // Service types (for ranking)
    supabase.from('sales').select('amount, service_types(name)').eq('barbershop_id', barbershopId).gte('date', from).lte('date', to),
  ])

  // ── Month totals ─────────────────────────────────────────────
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

  // ── Previous month totals ────────────────────────────────────
  const ingPrev = (salesPrev ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
    + (productSalesPrev ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const gasPrev = (expensesPrev ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)

  // ── Ticket promedio ──────────────────────────────────────────
  const totalServicios = (salesMonth ?? []).length
  const ticketPromedio = totalServicios > 0 ? Math.round(ingServicios / totalServicios) : 0

  // ── Mejor día de la semana ───────────────────────────────────
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

  // ── Proyección del mes ───────────────────────────────────────
  const proyeccion = isCurrentMonth && dayOfMonth > 1 && dayOfMonth !== 0
    ? Math.round(ingresosMes / dayOfMonth * daysInMonth)
    : null

  // ── Trend chart ──────────────────────────────────────────────
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

  // ── Ventas por barbero ───────────────────────────────────────
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

  // ── Ranking servicios ────────────────────────────────────────
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

  // ── Servicios (pie format) ───────────────────────────────────
  const svcPieData = Object.entries(svcMap)
    .map(([name, v]) => ({ name, cantidad: v.count, ingresos: v.total }))
    .sort((a, b) => b.ingresos - a.ingresos)

  // ── Productos (pie) ──────────────────────────────────────────
  const pieMap: Record<string, { cantidad: number; ingresos: number }> = {}
  for (const s of prodSalesMonth ?? [] as ProductSaleWithProduct[]) {
    const product = getProduct(s.products)
    const name = product?.name ?? 'Otro'
    if (!pieMap[name]) pieMap[name] = { cantidad: 0, ingresos: 0 }
    pieMap[name].cantidad += s.quantity ?? 1
    pieMap[name].ingresos += (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  const pieData = Object.entries(pieMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.ingresos - a.ingresos)

  const prodRanking = pieData.slice(0, 6)

  // ── Gastos por categoría ─────────────────────────────────────
  const catMap: Record<string, number> = {}
  for (const e of expensesMonth ?? []) {
    const cat = e.category ?? 'Otros'
    catMap[cat] = (catMap[cat] ?? 0) + (e.amount ?? 0)
  }

  // ── Deltas ───────────────────────────────────────────────────
  const ingDelta = pctChange(ingresosMes, ingPrev)
  const gasDelta = pctChange(gastosMes, gasPrev)

  const kpis = [
    { label: 'Ingresos', value: formatARS(ingresosMes), color: 'var(--green)', delta: ingDelta },
    { label: 'Gastos',   value: formatARS(gastosMes),   color: 'var(--red)',   delta: gasDelta },
    { label: 'Comisiones', value: formatARS(comisionesMes), color: 'var(--muted)', delta: null },
    { label: 'Neto',     value: formatARS(netoMes),     color: netoMes >= 0 ? 'var(--green)' : 'var(--red)', delta: null },
  ]

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Finanzas</h1>
      </div>

      {/* Month selector */}
      <div className={styles.monthNav}>
        {months.map(mo => (
          <a key={mo} href={`?mes=${mo}`} className={mo === ym ? styles.monthActive : styles.monthTab}>
            {monthLabel(mo)}
          </a>
        ))}
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {kpis.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
            {k.delta !== null && (
              <p className={styles.kpiDelta} style={{ color: k.label === 'Gastos' ? (k.delta > 0 ? 'var(--red)' : 'var(--green)') : (k.delta >= 0 ? 'var(--green)' : 'var(--red)') }}>
                {k.delta >= 0 ? '▲' : '▼'} {Math.abs(k.delta)}% vs mes anterior
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Stats row: ticket promedio + mejor día + proyección */}
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
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Proyección del mes</p>
            <p className={styles.statValue} style={{ color: 'var(--gold)' }}>{formatARS(proyeccion)}</p>
            <p className={styles.statDetail}>Día {dayOfMonth} de {daysInMonth} — al ritmo actual</p>
          </div>
        )}
      </div>

      {/* Trend chart */}
      <div className={styles.section}>
        <ResumenMensual data={trendData} />
      </div>

      {/* Two columns: barberos + gastos por categoría */}
      <div className={styles.twoCol}>
        <div>
          <VentasPorBarbero data={barberData} />
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>
            Gastos por categoría
          </p>
          {Object.keys(catMap).length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Sin gastos este mes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '.85rem', color: CATEGORY_COLORS[cat] ?? 'var(--muted)', fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: '.85rem', color: 'var(--text)', fontWeight: 600 }}>{formatARS(amt)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--hover)', overflow: 'hidden' }}>
                    <div style={{ width: `${gastosMes > 0 ? Math.round(amt / gastosMes * 100) : 0}%`, height: '100%', borderRadius: 3, background: CATEGORY_COLORS[cat] ?? 'var(--muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ranking selector + chart */}
      <RankingSelector
        svcRanking={svcRanking}
        prodRanking={prodRanking}
        svcPieData={svcPieData}
        prodPieData={pieData}
        formatARS={formatARS}
      />
    </div>
  )
}
