import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { today } from '@/lib/date'
import { type ServiceType, type Sale, type ProductSale } from '@/lib/definitions'
import NuevaVentaForm from './ventas/NuevaVentaForm'
import VenderProductoWidget from './VenderProductoWidget'
import VentasHoySection from './VentasHoySection'
import BarberosCard from './BarberosCard'
import CollapsibleCard from './CollapsibleCard'
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

  const todayDate = today()

  const [
    { data: barbers },
    { data: rawServiceTypes },
    { data: salesToday },
    { data: recentSales },
    { data: products },
    { data: productSalesToday },
    { data: expensesToday },
  ] = await Promise.all([
    supabase.from('barbers').select('id, name, commission_pct, active').eq('barbershop_id', barbershopId).order('name'),
    supabase.from('service_types').select('id, name, default_price, barbershop_id').or(`barbershop_id.eq.${barbershopId},barbershop_id.is.null`).eq('active', true).order('name'),
    supabase.from('sales').select('amount').eq('barbershop_id', barbershopId).eq('date', todayDate),
    supabase.from('sales')
      .select('id, barber_id, amount, date, created_at, notes, barbers(name, commission_pct), service_types(name)')
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
    supabase.from('expenses').select('amount').eq('barbershop_id', barbershopId).eq('date', todayDate),
  ])

  // Deduplicar: si hay override propio, ocultar el global del mismo nombre
  const overrideNames = new Set((rawServiceTypes ?? []).filter((s): s is ServiceType => !!s.barbershop_id).map(s => s.name))
  const serviceTypes = (rawServiceTypes ?? []).filter((s): s is ServiceType => !!s.barbershop_id || !overrideNames.has(s.name))

  const totalServiciosHoy = (salesToday ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalProductosHoy = (productSalesToday ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const totalHoy = totalServiciosHoy + totalProductosHoy
  const countHoy = (salesToday ?? []).length

  const comisionesHoy = (recentSales ?? []).reduce((s, r: Sale) => {
    const pct = Array.isArray(r.barbers) ? r.barbers?.[0]?.commission_pct ?? 0 : r.barbers?.commission_pct ?? 0
    return s + Math.round((r.amount ?? 0) * (pct / 100))
  }, 0)
  const gastosHoy = (expensesToday ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const gananciaNeta = totalHoy - comisionesHoy - gastosHoy

  const activeBarbers = (barbers ?? []).filter(b => b.active)

  const kpis = [
    { label: 'Servicios hoy',     value: countHoy.toString(),    color: 'var(--cream)' },
    { label: 'Ingresos hoy',      value: formatARS(totalHoy),    color: 'var(--green)' },
    { label: 'Comisiones hoy',    value: formatARS(comisionesHoy), color: 'var(--gold)' },
    { label: 'Ganancia neta hoy', value: formatARS(gananciaNeta), color: gananciaNeta >= 0 ? 'var(--green)' : 'var(--red)' },
  ]

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Inicio</h1>
        <p className={styles.date}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })}
        </p>
      </div>

      <CollapsibleCard
        storageKey={`${barbershopId}:inicio:kpis`}
        title="Resumen del dia"
      >
        <div className={styles.kpis}>
          {kpis.map(k => (
            <div key={k.label} className={styles.kpiCard}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      <BarberosCard barbershopId={barbershopId} barbers={barbers ?? []} />

      <CollapsibleCard
        storageKey={`${barbershopId}:inicio:registro`}
        title="Registro rapido"
        collapseOnMobile
      >
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
      </CollapsibleCard>

      <CollapsibleCard
        storageKey={`${barbershopId}:inicio:ventas-hoy`}
        title="Ventas de hoy"
        collapseOnMobile
      >
        <VentasHoySection
          serviceSales={(recentSales ?? []).map((s: Sale) => ({
            id: s.id,
            barber_id: s.barber_id ?? '',
            type: 'servicio' as const,
            barber: (Array.isArray(s.barbers) ? s.barbers?.[0]?.name : s.barbers?.name) ?? '—',
            service: (Array.isArray(s.service_types) ? s.service_types?.[0]?.name : s.service_types?.name) ?? '—',
            amount: s.amount ?? 0,
            created_at: s.created_at ?? '',
            notes: s.notes ?? null,
          }))}
          productSales={(productSalesToday ?? []).map((s: ProductSale) => ({
            id: s.id,
            type: 'producto' as const,
            product: (Array.isArray(s.products) ? s.products?.[0]?.name : s.products?.name) ?? '—',
            quantity: s.quantity ?? 1,
            amount: (s.sale_price ?? 0) * (s.quantity ?? 1),
          }))}
        />
      </CollapsibleCard>
    </div>
  )
}
