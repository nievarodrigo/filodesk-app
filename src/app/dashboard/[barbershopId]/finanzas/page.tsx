import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth } from '@/lib/date'
import ResumenMensual from './ResumenMensual'
import VentasPorBarbero from './VentasPorBarbero'
import GraficoProductos from '../productos/GraficoProductos'
import styles from './finanzas.module.css'

export const metadata: Metadata = { title: 'Finanzas — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default async function FinanzasPage({
  params,
}: { params: Promise<{ barbershopId: string }> }) {
  const { barbershopId } = await params
  const supabase = await createClient()

  const now = new Date()
  const monthStart = startOfMonth()

  // Previous month range
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevEnd   = new Date(now.getFullYear(), now.getMonth(), 0)
  const prevFrom  = prevStart.toISOString().slice(0, 10)
  const prevTo    = prevEnd.toISOString().slice(0, 10)

  // 6 months ago for trend chart
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)
  const last90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

  const [
    { data: salesMonth },
    { data: salesMonthWithComm },
    { data: productSalesMonth },
    { data: expensesMonth },
    { data: salesPrev },
    { data: productSalesPrev },
    { data: expensesPrev },
    { data: salesAll6m },
    { data: productSalesAll6m },
    { data: expensesAll6m },
    { data: barbers },
    { data: barberSalesMonth },
    { data: prodSalesLast90 },
  ] = await Promise.all([
    // Current month
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).gte('date', monthStart),
    supabase.from('sales').select('amount, barbers(commission_pct)').eq('barbershop_id', barbershopId).gte('date', monthStart),
    supabase.from('product_sales').select('sale_price, quantity').eq('barbershop_id', barbershopId).gte('date', monthStart),
    supabase.from('expenses').select('amount, category').eq('barbershop_id', barbershopId).gte('date', monthStart),
    // Previous month
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    supabase.from('product_sales').select('sale_price, quantity').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    supabase.from('expenses').select('amount').eq('barbershop_id', barbershopId).gte('date', prevFrom).lte('date', prevTo),
    // Last 6 months (for trend)
    supabase.from('sales').select('amount, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    supabase.from('product_sales').select('sale_price, quantity, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    supabase.from('expenses').select('amount, date').eq('barbershop_id', barbershopId).gte('date', sixMonthsAgo),
    // Barbers
    supabase.from('barbers').select('id, name, commission_pct').eq('barbershop_id', barbershopId).eq('active', true),
    supabase.from('sales').select('amount, barber_id, barbers(name, commission_pct)').eq('barbershop_id', barbershopId).gte('date', monthStart),
    // Products (last 90 days for pie)
    supabase.from('product_sales').select('quantity, sale_price, products(name)').eq('barbershop_id', barbershopId).gte('date', last90),
  ])

  // ── Current month totals ───────────────────────────────────────
  const ingServicios = (salesMonth ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const ingProductos = (productSalesMonth ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const ingresosMes  = ingServicios + ingProductos
  const gastosMes    = (expensesMonth ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const comisionesMes = (salesMonthWithComm ?? []).reduce((s, r: any) => {
    const pct = r.barbers?.commission_pct ?? 0
    return s + Math.round((r.amount ?? 0) * pct / 100)
  }, 0)
  const netoMes = ingresosMes - gastosMes - comisionesMes

  // ── Previous month totals ──────────────────────────────────────
  const ingPrev  = (salesPrev ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
    + (productSalesPrev ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const gasPrev  = (expensesPrev ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)

  // ── Monthly trend chart ────────────────────────────────────────
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const trendMap: Record<string, { ingresos: number; gastos: number }> = {}

  // Init last 6 months
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
    .map(([ym, v]) => ({
      mes: MESES[Number(ym.split('-')[1]) - 1],
      ingresos: Math.round(v.ingresos),
      gastos: Math.round(v.gastos),
    }))

  // ── Ventas por barbero ─────────────────────────────────────────
  const barberMap: Record<string, { name: string; total: number; pct: number }> = {}
  for (const s of barberSalesMonth ?? []) {
    const b = (s as any).barbers
    if (!b) continue
    const id = s.barber_id
    if (!barberMap[id]) barberMap[id] = { name: b.name, total: 0, pct: b.commission_pct ?? 0 }
    barberMap[id].total += s.amount ?? 0
  }
  const barberData = Object.values(barberMap)
    .map(b => ({ name: b.name, total: Math.round(b.total), comision: Math.round(b.total * b.pct / 100) }))
    .sort((a, b) => b.total - a.total)

  // ── Productos más vendidos (pie) ───────────────────────────────
  const pieMap: Record<string, { cantidad: number; ingresos: number }> = {}
  for (const s of prodSalesLast90 ?? []) {
    const name = (s as any).products?.name ?? 'Otro'
    if (!pieMap[name]) pieMap[name] = { cantidad: 0, ingresos: 0 }
    pieMap[name].cantidad += s.quantity ?? 1
    pieMap[name].ingresos += (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  const pieData = Object.entries(pieMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 8)

  // ── Gastos por categoría ───────────────────────────────────────
  const CATEGORY_COLORS: Record<string, string> = {
    Alquiler: '#c9a84c', Productos: '#5ecf87', Servicios: '#7eb8f7', Sueldos: '#e07070', Otros: '#7a7060',
  }
  const catMap: Record<string, number> = {}
  for (const e of expensesMonth ?? []) {
    const cat = e.category ?? 'Otros'
    catMap[cat] = (catMap[cat] ?? 0) + (e.amount ?? 0)
  }

  // ── Deltas ─────────────────────────────────────────────────────
  const ingDelta = pctChange(ingresosMes, ingPrev)
  const gasDelta = pctChange(gastosMes, gasPrev)

  const kpis = [
    { label: 'Ingresos del mes', value: formatARS(ingresosMes), color: 'var(--green)', delta: ingDelta },
    { label: 'Gastos del mes',   value: formatARS(gastosMes),   color: 'var(--red)',   delta: gasDelta },
    { label: 'Comisiones',       value: formatARS(comisionesMes), color: 'var(--muted)', delta: null },
    { label: 'Neto del mes',     value: formatARS(netoMes),     color: netoMes >= 0 ? 'var(--green)' : 'var(--red)', delta: null },
  ]

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Finanzas</h1>
        <p className={styles.subtitle}>
          {now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })}
        </p>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {kpis.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
            {k.delta !== null && (
              <p className={styles.kpiDelta} style={{ color: k.label === 'Gastos del mes' ? (k.delta > 0 ? 'var(--red)' : 'var(--green)') : (k.delta >= 0 ? 'var(--green)' : 'var(--red)') }}>
                {k.delta >= 0 ? '▲' : '▼'} {Math.abs(k.delta)}% vs mes anterior
              </p>
            )}
          </div>
        ))}
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
        <div style={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>
            Gastos por categoría — mes actual
          </p>
          {Object.keys(catMap).length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Sin gastos este mes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '.85rem', color: CATEGORY_COLORS[cat] ?? '#7a7060', fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: '.85rem', color: 'var(--text)', fontWeight: 600 }}>{formatARS(amt)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#2a2a2a', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round(amt / gastosMes * 100)}%`, height: '100%', borderRadius: 3, background: CATEGORY_COLORS[cat] ?? '#7a7060' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Productos más vendidos */}
      {pieData.length > 0 && (
        <div className={styles.section}>
          <GraficoProductos data={pieData} />
        </div>
      )}
    </div>
  )
}
