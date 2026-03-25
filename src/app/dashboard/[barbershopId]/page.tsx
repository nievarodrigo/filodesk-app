import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { today, startOfMonth } from '@/lib/date'
import NetoCard from './NetoCard'
import NuevaVentaForm from './ventas/NuevaVentaForm'
import VenderProductoWidget from './VenderProductoWidget'
import VentasHoySection from './VentasHoySection'
import BarberosCard from './BarberosCard'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Dashboard — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()

  const todayDate  = today()
  const monthStart = startOfMonth()

  const [
    { data: barbers },
    { data: serviceTypes },
    { data: salesToday },
    { data: salesMonth },
    { data: recentSales },
    { data: products },
    { data: productSalesToday },
    { data: productSalesMonth },
    { data: expensesMonth },
    { data: salesMonthWithComm },
  ] = await Promise.all([
    supabase.from('barbers').select('id, name, commission_pct, active').eq('barbershop_id', barbershopId).order('name'),
    supabase.from('service_types').select('id, name, default_price').or(`barbershop_id.eq.${barbershopId},barbershop_id.is.null`).eq('active', true).order('name'),
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).eq('date', todayDate),
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).gte('date', monthStart),
    supabase.from('sales')
      .select('id, amount, date, notes, barbers(name, commission_pct), service_types(name)')
      .eq('barbershop_id', barbershopId)
      .eq('date', todayDate)
      .order('created_at', { ascending: false }),
    supabase.from('products')
      .select('id, name, sale_price, stock')
      .eq('barbershop_id', barbershopId)
      .eq('active', true)
      .gt('stock', 0)
      .order('name'),
    supabase.from('product_sales')
      .select('id, sale_price, quantity, products(name)')
      .eq('barbershop_id', barbershopId)
      .eq('date', todayDate)
      .order('created_at', { ascending: false }),
    supabase.from('product_sales')
      .select('sale_price, quantity')
      .eq('barbershop_id', barbershopId)
      .gte('date', monthStart),
    supabase.from('expenses')
      .select('amount')
      .eq('barbershop_id', barbershopId)
      .gte('date', monthStart),
    supabase.from('sales')
      .select('amount, barbers(commission_pct)')
      .eq('barbershop_id', barbershopId)
      .gte('date', monthStart),
  ])

  const totalServiciosHoy = (salesToday ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalProductosHoy = (productSalesToday ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const totalHoy = totalServiciosHoy + totalProductosHoy
  const totalMesServicios = (salesMonth ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalMesProductos = (productSalesMonth ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const totalMes = totalMesServicios + totalMesProductos
  const countHoy = (salesToday ?? []).length
  const totalGastosMes = (expensesMonth ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalComisionesMes = (salesMonthWithComm ?? []).reduce((s, r: any) => {
    const pct = r.barbers?.commission_pct ?? 0
    return s + Math.round((r.amount ?? 0) * pct / 100)
  }, 0)
  const netoMes = totalMes - totalGastosMes - totalComisionesMes

  const activeBarbers = (barbers ?? []).filter(b => b.active)

  const kpis = [
    { label: 'Servicios hoy',    value: countHoy.toString(),    color: 'var(--cream)' },
    { label: 'Ingresos hoy',     value: formatARS(totalHoy),    color: 'var(--green)' },
    { label: 'Ingresos del mes', value: formatARS(totalMes),    color: 'var(--gold)'  },
  ]

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Inicio</h1>
        <p className={styles.date}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })}
        </p>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {kpis.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
        <BarberosCard barbershopId={barbershopId} barbers={barbers ?? []} />
      </div>

      {/* Neto del mes */}
      <NetoCard
        neto={netoMes}
        ingresos={totalMes}
        comisiones={totalComisionesMes}
        gastos={totalGastosMes}
      />

      {/* Forms: servicio + producto lado a lado */}
      {activeBarbers.length === 0 ? (
        <div className={styles.noBarbers}>
          Agregá un barbero en <a href={`/dashboard/${barbershopId}/configuracion`} className={styles.link}>Barberos y Servicios</a> para empezar a registrar ventas.
        </div>
      ) : (
        <div className={styles.formRow}>
          <NuevaVentaForm
            barbershopId={barbershopId}
            barbers={activeBarbers}
            serviceTypes={serviceTypes ?? []}
            compact
          />
          <VenderProductoWidget
            barbershopId={barbershopId}
            products={products ?? []}
          />
        </div>
      )}

      {/* Ventas de hoy */}
      <VentasHoySection
        barbershopId={barbershopId}
        serviceSales={(recentSales ?? []).map((s: any) => ({
          id: s.id,
          type: 'servicio' as const,
          barber: s.barbers?.name ?? '—',
          service: s.service_types?.name ?? '—',
          amount: s.amount ?? 0,
          notes: s.notes ?? null,
        }))}
        productSales={(productSalesToday ?? []).map((s: any) => ({
          id: s.id,
          type: 'producto' as const,
          product: s.products?.name ?? '—',
          quantity: s.quantity ?? 1,
          amount: (s.sale_price ?? 0) * (s.quantity ?? 1),
        }))}
      />
    </div>
  )
}
