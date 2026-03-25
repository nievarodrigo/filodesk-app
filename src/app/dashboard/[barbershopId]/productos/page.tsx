import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NuevoProductoForm from './NuevoProductoForm'
import ProductoRow from './ProductoRow'
import GraficoProductos from './GraficoProductos'
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

  const last30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [{ data: products }, { data: recentSales }, { data: salesLast30 }] = await Promise.all([
    supabase.from('products').select('id, name, cost_price, sale_price, stock, active').eq('barbershop_id', barbershopId).order('name'),
    supabase.from('product_sales')
      .select('id, quantity, sale_price, date, products(name)')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('product_sales')
      .select('quantity, sale_price, products(name)')
      .eq('barbershop_id', barbershopId)
      .gte('date', last30),
  ])

  const totalStock  = (products ?? []).filter(p => p.active).length
  const lowStock    = (products ?? []).filter(p => p.active && p.stock <= 2)
  const totalVentas = (recentSales ?? []).reduce((s, r) => s + (r.sale_price * r.quantity), 0)

  // Aggregate for pie chart
  const pieMap: Record<string, { cantidad: number; ingresos: number }> = {}
  for (const s of salesLast30 ?? []) {
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
      </div>

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
