import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { today, startOfMonth as som } from '@/lib/date'
import DeleteVentaButton from './DeleteVentaButton'
import FiltroFechas from './FiltroFechas'
import GraficoIngresos from './GraficoIngresos'
import Paginacion from '@/components/dashboard/Paginacion'
import styles from './ventas.module.css'

export const metadata: Metadata = { title: 'Ventas — FiloDesk' }

const PAGE_SIZE = 20

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export default async function VentasPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ desde?: string; hasta?: string; tipo?: string; p?: string }>
}) {
  const { barbershopId } = await params
  const { desde, hasta, tipo = 'todos', p = '1' } = await searchParams

  const defaultDesde = som()
  const defaultHasta = today()

  const from = desde ?? defaultDesde
  const to   = hasta ?? defaultHasta
  const page = Math.max(1, Number(p) || 1)
  const rangeFrom = (page - 1) * PAGE_SIZE
  const rangeTo   = page * PAGE_SIZE - 1

  const supabase = await createClient()

  const [
    { data: sales,        count: salesCount },
    { data: productSales, count: productCount },
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('id, amount, date, notes, barbers(name, commission_pct), service_types(name)', { count: 'exact' })
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(rangeFrom, rangeTo),
    supabase
      .from('product_sales')
      .select('id, sale_price, date, quantity, products(name)', { count: 'exact' })
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(rangeFrom, rangeTo),
  ])

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

  const totalSalesPages   = Math.ceil(countServicios / PAGE_SIZE)
  const totalProductPages = Math.ceil(countProductos / PAGE_SIZE)

  // Últimos 6 meses para accesos rápidos
  const [curY, curM] = defaultDesde.split('-').map(Number)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(curY, curM - 1 - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { ym, label: monthLabel(ym) }
  })

  // Resumen por barbero (todos, sin paginar)
  const byBarber: Record<string, { name: string; count: number; total: number; commission: number }> = {}
  // Use paginated sales for byBarber (approximate, but good enough for UX)
  for (const sale of sales ?? []) {
    const name    = (sale as { barbers?: Array<{ name: string; commission_pct: number }> }).barbers?.[0]?.name ?? 'Sin asignar'
    const commPct = (sale as { barbers?: Array<{ name: string; commission_pct: number }> }).barbers?.[0]?.commission_pct ?? 0
    if (!byBarber[name]) byBarber[name] = { name, count: 0, total: 0, commission: 0 }
    byBarber[name].count++
    byBarber[name].total      += sale.amount ?? 0
    byBarber[name].commission += Math.round((sale.amount ?? 0) * commPct / 100)
  }

  const tipoTabs = [
    { key: 'todos',    label: `Todos (${countTotal})` },
    { key: 'servicio', label: `Servicios (${countServicios})` },
    { key: 'producto', label: `Productos (${countProductos})` },
  ]

  const baseHref = `?desde=${from}&hasta=${to}&tipo=${tipo}`

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
          <p className={styles.summaryValue} style={{ color: 'var(--green)' }}>{formatARS(totalPeriodo)}</p>
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
          <p className={styles.summaryValue} style={{ color: 'var(--gold)' }}>
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
      {Object.keys(byBarber).length > 0 && (tipo === 'todos' || tipo === 'servicio') && (
        <div className={styles.byBarber}>
          <h2 className={styles.subTitle}>Por barbero {page > 1 && <span className={styles.pagNota}>(pág. {page})</span>}</h2>
          <div className={styles.barberGrid}>
            {Object.values(byBarber).map(b => (
              <div key={b.name} className={styles.barberCard}>
                <p className={styles.barberName}>{b.name}</p>
                <p className={styles.barberStat}>{b.count} servicios · {formatARS(b.total)}</p>
                <p className={styles.barberComm}>Comisión: {formatARS(b.commission)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className={styles.tableSection}>
        <div className={styles.filterRow}>
          <h2 className={styles.subTitle}>Detalle</h2>
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

        {/* Servicios */}
        {(tipo === 'todos' || tipo === 'servicio') && (
          <>
            {tipo === 'todos' && (sales ?? []).length > 0 && (
              <p className={styles.tableGroupLabel}>Servicios</p>
            )}
            {(sales ?? []).length === 0 ? (
              tipo === 'servicio' && <div className={styles.empty}>No hay servicios en este período.</div>
            ) : (
              <>
                <div className={styles.table} style={{ marginBottom: tipo === 'todos' && (productSales ?? []).length > 0 ? '16px' : undefined }}>
                  <div className={styles.tableHeadService}>
                    <span>Fecha</span>
                    <span>Barbero</span>
                    <span>Servicio</span>
                    <span>Monto</span>
                    <span>Comisión</span>
                    <span>Notas</span>
                    <span></span>
                  </div>
                  {(sales as Array<{ id: string; amount: number; date: string; notes?: string; barbers?: Array<{ name: string; commission_pct: number }>; service_types?: Array<{ name: string }> }>).map(sale => {
                    const commission = sale.barbers?.[0]
                      ? Math.round(sale.amount * sale.barbers[0].commission_pct / 100)
                      : null
                    return (
                      <div key={sale.id} className={styles.tableRowService}>
                        <span className={styles.muted}>{sale.date}</span>
                        <span>{sale.barbers?.[0]?.name ?? '—'}</span>
                        <span>{sale.service_types?.[0]?.name ?? '—'}</span>
                        <span className={styles.amount}>{formatARS(sale.amount)}</span>
                        <span className={styles.muted}>{commission !== null ? formatARS(commission) : '—'}</span>
                        <span className={styles.muted}>{sale.notes ?? '—'}</span>
                        <DeleteVentaButton barbershopId={barbershopId} saleId={sale.id} />
                      </div>
                    )
                  })}
                </div>
                {tipo === 'servicio' && (
                  <Paginacion current={page} total={totalSalesPages} baseHref={baseHref} />
                )}
              </>
            )}
          </>
        )}

        {/* Productos */}
        {(tipo === 'todos' || tipo === 'producto') && (
          <>
            {tipo === 'todos' && (productSales ?? []).length > 0 && (
              <p className={styles.tableGroupLabel}>Productos</p>
            )}
            {(productSales ?? []).length === 0 ? (
              tipo === 'producto' && <div className={styles.empty}>No hay ventas de productos en este período.</div>
            ) : (
              <>
                <div className={styles.table}>
                  <div className={styles.tableHeadProduct}>
                    <span>Fecha</span>
                    <span>Producto</span>
                    <span>Cantidad</span>
                    <span>Monto</span>
                  </div>
                  {(productSales as Array<{ id: string; sale_price: number; date: string; quantity: number; products?: Array<{ name: string }> }>).map(ps => (
                    <div key={ps.id} className={styles.tableRowProduct}>
                      <span className={styles.muted}>{ps.date}</span>
                      <span>{ps.products?.[0]?.name ?? '—'}</span>
                      <span className={styles.muted}>{ps.quantity} u.</span>
                      <span className={styles.amount}>{formatARS((ps.sale_price ?? 0) * (ps.quantity ?? 1))}</span>
                    </div>
                  ))}
                </div>
                {tipo === 'producto' && (
                  <Paginacion current={page} total={totalProductPages} baseHref={baseHref} />
                )}
              </>
            )}
          </>
        )}

        {/* Paginación para "todos" */}
        {tipo === 'todos' && (countServicios > PAGE_SIZE || countProductos > PAGE_SIZE) && (
          <Paginacion
            current={page}
            total={Math.max(totalSalesPages, totalProductPages)}
            baseHref={baseHref}
          />
        )}

        {tipo === 'todos' && (sales ?? []).length === 0 && (productSales ?? []).length === 0 && (
          <div className={styles.empty}>No hay ventas en este período.</div>
        )}
      </div>
    </div>
  )
}
