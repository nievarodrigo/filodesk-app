import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NuevoProductoForm from './NuevoProductoForm'
import ProductoRow from './ProductoRow'
import GraficoProductos from './GraficoProductos'
import GraficoBarrasMensuales from './GraficoBarrasMensuales'
import styles from './productos.module.css'

export const metadata: Metadata = { title: 'Productos — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default async function ProductosPage({
  params,
}: { params: Promise<{ barbershopId: string }> }) {
  const { barbershopId } = await params
  const supabase = await createClient()

  const last90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
  const last6m = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10)

  const [{ data: products }, { data: recentSales }, { data: salesLast90 }, { data: salesLast6m }] = await Promise.all([
    supabase.from('products').select('id, name, cost_price, sale_price, stock, active').eq('barbershop_id', barbershopId).order('name'),
    supabase.from('product_sales')
      .select('id, quantity, sale_price, date, products(name)')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('product_sales')
      .select('quantity, sale_price, products(name)')
      .eq('barbershop_id', barbershopId)
      .gte('date', last90),
    supabase.from('product_sales')
      .select('quantity, sale_price, date')
      .eq('barbershop_id', barbershopId)
      .gte('date', last6m),
  ])

  const activeProducts = (products ?? []).filter(p => p.active)
  const totalStock     = activeProducts.length
  const lowStock       = activeProducts.filter(p => p.stock <= 2)
  const totalVentas    = (recentSales ?? []).reduce((s, r) => s + (r.sale_price * r.quantity), 0)
  const valorInventario = activeProducts.reduce((s, p) => s + (p.cost_price * p.stock), 0)

  // Agregado mensual para gráfico de barras
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const monthMap: Record<string, number> = {}
  for (const s of salesLast6m ?? []) {
    const key = s.date.slice(0, 7) // "2025-03"
    monthMap[key] = (monthMap[key] ?? 0) + (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  const barData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, ingresos]) => {
      const [, m] = ym.split('-')
      return { mes: MESES[Number(m) - 1], ingresos: Math.round(ingresos) }
    })

  // Aggregate for pie chart
  const pieMap: Record<string, { cantidad: number; ingresos: number }> = {}
  for (const s of salesLast90 ?? []) {
    const name = (s as any).products?.name ?? 'Otro'
    if (!pieMap[name]) pieMap[name] = { cantidad: 0, ingresos: 0 }
    pieMap[name].cantidad += s.quantity ?? 1
    pieMap[name].ingresos += (s.sale_price ?? 0) * (s.quantity ?? 1)
  }
  const pieData = Object.entries(pieMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 8)

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Productos</h1>
      </div>

      <NuevoProductoForm barbershopId={barbershopId} />

      {/* Alertas stock bajo */}
      {lowStock.length > 0 && (
        <div className={styles.alertLow} style={{ marginTop: 16 }}>
          ⚠ Stock bajo: {lowStock.map(p => `${p.name} (${p.stock})`).join(', ')}
        </div>
      )}

      {/* KPIs */}
      <div className={styles.kpis} style={{ marginTop: 16 }}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Productos activos</p>
          <p className={styles.kpiValue}>{totalStock}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Ventas recientes</p>
          <p className={styles.kpiValue} style={{ color: 'var(--green)' }}>{formatARS(totalVentas)}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Valor en stock</p>
          <p className={styles.kpiValue} style={{ color: 'var(--gold)' }}>{formatARS(valorInventario)}</p>
        </div>
      </div>

      {/* Gráfico barras mensual (toggle) */}
      {barData.length > 0 && <GraficoBarrasMensuales data={barData} />}

      {/* Gráfico torta de más vendidos */}
      {pieData.length > 0 && <GraficoProductos data={pieData} />}

      {/* Tabla de productos */}
      <div className={styles.table} style={{ marginTop: 16 }}>
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
      {recentSales && recentSales.length > 0 && (
        <div className={styles.histSection}>
          <h2 className={styles.histTitle}>Últimas ventas</h2>
          <div className={styles.histTable}>
            {(recentSales as any[]).map(s => (
              <div key={s.id} className={styles.histRow}>
                <span className={styles.muted}>{s.date}</span>
                <span>{s.products?.name ?? '—'}</span>
                <span className={styles.muted}>{s.quantity} u.</span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatARS(s.sale_price * s.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
