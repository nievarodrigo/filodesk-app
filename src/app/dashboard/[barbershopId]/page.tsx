import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { today } from '@/lib/date'
import { type ServiceType, type Sale, type ProductSale, type BarbershopRole } from '@/lib/definitions'
import { getServerAuthContext } from '@/services/auth.service'
import NuevaVentaForm from './ventas/NuevaVentaForm'
import VenderProductoWidget from './VenderProductoWidget'
import VentasHoySection from './VentasHoySection'
import VentasPendientesWidget from './VentasPendientesWidget'
import BarberosCard from './BarberosCard'
import CollapsibleCard from './CollapsibleCard'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Dashboard — FiloDesk' }
export const revalidate = 0

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function normalizeIdentity(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveCurrentBarber(
  user: { id: string; email?: string; user_metadata?: { first_name?: string; last_name?: string } },
  barbers: Array<{ id: string; name: string; email?: string | null; user_id?: string | null; commission_pct: number; active: boolean }>
) {
  const userIdMatch = barbers.find((barber) => barber.user_id === user.id)
  if (userIdMatch) return userIdMatch

  const normalizedEmail = user.email?.trim().toLowerCase()
  if (normalizedEmail) {
    const emailMatch = barbers.find((barber) => barber.email?.trim().toLowerCase() === normalizedEmail)
    if (emailMatch) return emailMatch
  }

  const candidates = new Set<string>()
  const firstName = user.user_metadata?.first_name?.trim() ?? ''
  const lastName = user.user_metadata?.last_name?.trim() ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  if (fullName) candidates.add(normalizeIdentity(fullName))
  if (firstName) candidates.add(normalizeIdentity(firstName))

  const emailLocalPart = user.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
  if (emailLocalPart) candidates.add(normalizeIdentity(emailLocalPart))

  const matches = barbers.filter((barber) => candidates.has(normalizeIdentity(barber.name)))
  if (matches.length === 1) return matches[0]

  return null
}

type SaleWithBarber = {
  amount: number | null
  barbers: { commission_pct?: number | null } | Array<{ commission_pct?: number | null }> | null
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context) redirect('/dashboard')

  const todayDate = today()
  const monthStartDate = `${todayDate.slice(0, 8)}01`

  const [
    { data: barbershop },
    { data: barbers },
    { data: rawServiceTypes },
    { data: products },
  ] = await Promise.all([
    supabase.from('barbershops').select('name, subscription_renews_at, subscription_payment_method, plan_name').eq('id', barbershopId).single(),
    supabase.from('barbers').select('id, name, email, user_id, commission_pct, active').eq('barbershop_id', barbershopId).order('name'),
    supabase.from('service_types').select('id, name, default_price, barbershop_id').or(`barbershop_id.eq.${barbershopId},barbershop_id.is.null`).eq('active', true).order('name'),
    supabase.from('products')
      .select('id, name, sale_price, stock')
      .eq('barbershop_id', barbershopId)
      .eq('active', true)
      .gt('stock', 0)
      .order('name'),
  ])

  const currentBarber = context.role === 'barber'
    ? resolveCurrentBarber(session.user, (barbers ?? []).filter((barber) => barber.active))
    : null

  const salesBaseQuery = supabase
    .from('sales')
    .select('id, barber_id, amount, status, date, created_at, notes, barbers(name, commission_pct), service_types(name)')
    .eq('barbershop_id', barbershopId)
    .eq('date', todayDate)

  const salesTotalsQuery = supabase
    .from('sales')
    .select('amount, barber_id, barbers(name, commission_pct)')
    .eq('barbershop_id', barbershopId)
    .eq('date', todayDate)

  const scopedSalesQuery = context.role === 'barber'
    ? (currentBarber
        ? salesBaseQuery.eq('barber_id', currentBarber.id)
        : salesBaseQuery.eq('barber_id', '__no_barber_match__'))
    : salesBaseQuery

  const scopedSalesTotalsQuery = context.role === 'barber'
    ? (currentBarber
        ? salesTotalsQuery.eq('barber_id', currentBarber.id)
        : salesTotalsQuery.eq('barber_id', '__no_barber_match__'))
    : salesTotalsQuery

  const [
    { data: recentSales },
    { data: salesToday },
    { data: productSalesToday },
    { data: expensesToday },
    { data: salesMonth },
    { data: productSalesMonth },
    { data: expensesMonth },
  ] = await Promise.all([
    scopedSalesQuery.order('created_at', { ascending: false }),
    scopedSalesTotalsQuery,
    context.role === 'barber'
      ? Promise.resolve({ data: [] as ProductSale[] })
      : supabase.from('product_sales')
          .select('id, sale_price, quantity, transaction_id, created_at, products(name, cost_price)')
          .eq('barbershop_id', barbershopId)
          .eq('date', todayDate)
          .order('created_at', { ascending: false }),
    context.role === 'barber'
      ? Promise.resolve({ data: [] as Array<{ amount: number }> })
      : supabase.from('expenses').select('amount').eq('barbershop_id', barbershopId).eq('date', todayDate),
    context.role === 'barber'
      ? Promise.resolve({ data: [] as SaleWithBarber[] })
      : supabase
          .from('sales')
          .select('amount, barber_id, barbers(name, commission_pct)')
          .eq('barbershop_id', barbershopId)
          .gte('date', monthStartDate)
          .lte('date', todayDate),
    context.role === 'barber'
      ? Promise.resolve({ data: [] as ProductSale[] })
      : supabase
          .from('product_sales')
          .select('sale_price, quantity')
          .eq('barbershop_id', barbershopId)
          .gte('date', monthStartDate)
          .lte('date', todayDate),
    context.role === 'barber'
      ? Promise.resolve({ data: [] as Array<{ amount: number }> })
      : supabase
          .from('expenses')
          .select('amount')
          .eq('barbershop_id', barbershopId)
          .gte('date', monthStartDate)
          .lte('date', todayDate),
  ])

  // Deduplicar: si hay override propio, ocultar el global del mismo nombre
  const overrideNames = new Set((rawServiceTypes ?? []).filter((s): s is ServiceType => !!s.barbershop_id).map(s => s.name))
  const serviceTypes = (rawServiceTypes ?? []).filter((s): s is ServiceType => !!s.barbershop_id || !overrideNames.has(s.name))
  const salesTodayRows = (salesToday ?? []) as SaleWithBarber[]

  const totalServiciosHoy = salesTodayRows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalProductosHoy = (productSalesToday ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const productosVendidosHoy = (productSalesToday ?? []).reduce((s, r) => s + (r.quantity ?? 1), 0)
  const totalHoy = totalServiciosHoy + totalProductosHoy
  const countHoy = salesTodayRows.length

  const comisionesHoy = salesTodayRows.reduce((s, r) => {
    const pct = Array.isArray(r.barbers) ? r.barbers?.[0]?.commission_pct ?? 0 : r.barbers?.commission_pct ?? 0
    return s + Math.round((r.amount ?? 0) * (pct / 100))
  }, 0)
  const gastosHoy = (expensesToday ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const gananciaNeta = totalHoy - comisionesHoy - gastosHoy

  const salesMonthRows = (salesMonth ?? []) as SaleWithBarber[]
  const totalServiciosMes = salesMonthRows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalProductosMes = (productSalesMonth ?? []).reduce((s, r) => s + ((r.sale_price ?? 0) * (r.quantity ?? 1)), 0)
  const comisionesMes = salesMonthRows.reduce((s, r) => {
    const pct = Array.isArray(r.barbers) ? r.barbers?.[0]?.commission_pct ?? 0 : r.barbers?.commission_pct ?? 0
    return s + Math.round((r.amount ?? 0) * (pct / 100))
  }, 0)
  const gastosMes = (expensesMonth ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const gananciaNetaMes = totalServiciosMes + totalProductosMes - comisionesMes - gastosMes

  const activeBarbers = (barbers ?? []).filter(b => b.active)
  const visibleBarbers = context.role === 'barber' && currentBarber ? [currentBarber] : activeBarbers

  const barberAverageTicket = countHoy > 0 ? Math.round(totalServiciosHoy / countHoy) : 0
  const showBarberWelcome = context.role === 'barber' && !!currentBarber && countHoy === 0
  const kpis = context.role === 'barber'
    ? [
        { label: 'Tus servicios de hoy', value: countHoy.toString(), color: 'var(--cream)' },
        { label: 'Tu facturación del día', value: formatARS(totalServiciosHoy), color: 'var(--green)' },
        { label: 'Tu comisión del día', value: formatARS(comisionesHoy), color: 'var(--gold)' },
        { label: 'Tu ticket promedio', value: countHoy > 0 ? formatARS(barberAverageTicket) : '—', color: 'var(--cream)' },
      ]
    : [
        { label: 'Servicios hoy', value: countHoy.toString(), color: 'var(--cream)' },
        { label: 'Ingresos hoy', value: formatARS(totalHoy), color: 'var(--green)' },
        { label: 'Comisiones hoy', value: formatARS(comisionesHoy), color: 'var(--gold)' },
        { label: 'Productos vendidos hoy', value: productosVendidosHoy.toString(), color: 'var(--cream)' },
        { label: 'Ganancia neta hoy', value: formatARS(gananciaNeta), color: gananciaNeta >= 0 ? 'var(--green)' : 'var(--red)', highlight: true },
      ]

  const netKpi = context.role === 'barber' ? null : kpis.find((k) => k.label === 'Ganancia neta hoy')
  const secondaryKpis = context.role === 'barber'
    ? kpis
    : (() => {
        const byLabel = new Map(kpis.map((k) => [k.label, k]))
        return [
          byLabel.get('Ingresos hoy'),
          byLabel.get('Servicios hoy'),
          byLabel.get('Comisiones hoy'),
          byLabel.get('Productos vendidos hoy'),
        ].filter((k): k is NonNullable<typeof k> => !!k)
      })()
  const netMonthKpi = context.role === 'barber'
    ? null
    : { label: 'Ganancia neta mes', value: formatARS(gananciaNetaMes), color: gananciaNetaMes >= 0 ? 'var(--green)' : 'var(--red)' }

  const planName = context.plan
  const subscriptionMessage = (() => {
    if (barbershop?.subscription_renews_at) {
      // 'checkout_pro' = pago manual único (MP checkout)
      // cualquier otro valor = suscripción automática de MP (débito recurrente)
      const isAutomatic = barbershop.subscription_payment_method !== null &&
                          barbershop.subscription_payment_method !== 'checkout_pro'
      const date = new Date(barbershop.subscription_renews_at)
      const formattedDate = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
      const renewalText = isAutomatic
        ? `Se renueva el ${formattedDate}`
        : `Vence el ${formattedDate}`
      return { planName, renewalText }
    }
    return { planName, renewalText: null }
  })()

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Inicio</h1>
        <div>
          <p className={styles.date}>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })}
          </p>
          <p style={{ fontSize: '.95rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--gold)' }}>Plan {subscriptionMessage.planName}</span>
            {context.role === 'owner' && context.plan === 'Base' && (
              <a href={`/suscripcion?barbershopId=${barbershopId}`} className={styles.planBadge}>
                Mejorar plan
              </a>
            )}
            {subscriptionMessage.renewalText && (
              <>
                <span style={{ color: 'var(--muted)' }}>|</span>
                <span style={{ color: 'var(--muted)' }}>{subscriptionMessage.renewalText}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <CollapsibleCard
        storageKey={`${barbershopId}:inicio:kpis`}
        title="Resumen del dia"
      >
        {context.role === 'barber' || !netKpi ? (
          <div className={styles.kpis}>
            {kpis.map(k => (
              <div key={k.label} className={`${styles.kpiCard}${k.highlight ? ` ${styles.kpiCardHighlight}` : ''}`}>
                <p className={styles.kpiLabel}>{k.label}</p>
                <p className={`${styles.kpiValue}${k.highlight ? ` ${styles.kpiValueHighlight}` : ''}`} style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.kpisSplit}>
            <div className={`${styles.kpiCard} ${styles.kpiCardHero}`}>
              <div className={styles.kpiHeroSplit}>
                {netMonthKpi && (
                  <div className={styles.kpiHeroCol}>
                    <p className={styles.kpiLabel}>{netMonthKpi.label}</p>
                    <p className={`${styles.kpiValue} ${styles.kpiValueHero}`} style={{ color: netMonthKpi.color }}>
                      {netMonthKpi.value}
                    </p>
                  </div>
                )}
                <div className={`${styles.kpiHeroCol} ${styles.kpiHeroColRight}`}>
                  <p className={styles.kpiLabel}>{netKpi.label}</p>
                  <p className={`${styles.kpiValue} ${styles.kpiValueHero}`} style={{ color: netKpi.color }}>
                    {netKpi.value}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.kpisSecondary}>
              {secondaryKpis.map((k) => (
                <div key={k.label} className={styles.kpiCard}>
                  <p className={styles.kpiLabel}>{k.label}</p>
                  <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleCard>

      {context.role !== 'barber' && (
        <BarberosCard barbershopId={barbershopId} barbers={barbers ?? []} />
      )}

      <VentasPendientesWidget
        barbershopId={barbershopId}
        role={context.role as BarbershopRole}
      />

      {showBarberWelcome && (
        <section className={styles.welcomeBanner}>
          <p className={styles.welcomeEyebrow}>Primer ingreso</p>
          <h2 className={styles.welcomeTitle}>
            ¡Bienvenido al equipo de {barbershop?.name ?? 'tu barbería'}!
          </h2>
          <p className={styles.welcomeText}>
            Ya podés empezar a registrar tus ventas aquí mismo. Tu historial y tus comisiones se irán actualizando a medida que cargues tu actividad.
          </p>
        </section>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 className={styles.title} style={{ fontSize: '1.1rem', marginBottom: 16 }}>
          {context.role === 'barber' ? 'Tu herramienta de trabajo' : 'Registro rápido'}
        </h2>
        {/* Forms: servicio + producto lado a lado */}
        {context.role === 'barber' && !currentBarber ? (
          <div className={styles.noBarbers}>
            Tu usuario todavía no está vinculado a un barbero activo. Pedile al dueño que revise tu perfil en Equipo o Barberos y Servicios.
          </div>
        ) : activeBarbers.length === 0 ? (
          <div className={styles.noBarbers}>
            Agregá un barbero en <a href={`/dashboard/${barbershopId}/barberosyservicios`} className={styles.link}>Barberos y Servicios</a> para empezar a registrar ventas.
          </div>
        ) : (
          <div className={styles.formRow}>
            <NuevaVentaForm
              barbershopId={barbershopId}
              barbers={visibleBarbers}
              serviceTypes={serviceTypes ?? []}
              compact
              showOnboardingHint={context.role === 'barber'}
            />
            <VenderProductoWidget
              barbershopId={barbershopId}
              products={products ?? []}
            />
          </div>
        )}
      </div>

      <CollapsibleCard
        storageKey={`${barbershopId}:inicio:ventas-hoy`}
        title={context.role === 'barber' ? 'Tu actividad de hoy' : 'Ventas de hoy'}
        collapseOnMobile
      >
        <VentasHoySection
          barbershopId={barbershopId}
          role={context.role as BarbershopRole}
          serviceSales={(recentSales ?? []).map((s: Sale) => {
            const barberName = (s.barbers && typeof s.barbers === 'object')
              ? (Array.isArray(s.barbers) ? s.barbers[0]?.name : s.barbers.name)
              : 'Sin nombre'
            const serviceName = (s.service_types && typeof s.service_types === 'object')
              ? (Array.isArray(s.service_types) ? s.service_types[0]?.name : s.service_types.name)
              : 'Sin servicio'
            return {
              id: s.id,
              barber_id: s.barber_id ?? '',
              type: 'servicio' as const,
              barber: barberName ?? '—',
              commission_pct: (() => {
                if (!s.barbers || typeof s.barbers !== 'object') return 0
                const pct = Array.isArray(s.barbers) ? s.barbers[0]?.commission_pct : s.barbers.commission_pct
                return Number(pct ?? 0)
              })(),
              service: serviceName ?? '—',
              amount: s.amount ?? 0,
              status: s.status ?? 'approved',
              created_at: s.created_at ?? '',
              notes: s.notes ?? null,
            }
          })}
          productSales={(productSalesToday ?? []).map((s: ProductSale) => {
            const productData = (s.products && typeof s.products === 'object')
              ? (Array.isArray(s.products) ? s.products[0] : s.products)
              : null
            const productName = productData?.name ?? 'Sin producto'
            const unitCost = Number(productData?.cost_price ?? 0)
            const quantity = s.quantity ?? 1
            const unitPrice = s.sale_price ?? 0
            return {
              id: s.id,
              type: 'producto' as const,
              product: productName ?? '—',
              quantity,
              unit_price: unitPrice,
              unit_cost: unitCost,
              amount: unitPrice * quantity,
              profit: (unitPrice - unitCost) * quantity,
              transaction_id: s.transaction_id ?? '',
              created_at: s.created_at ?? '',
            }
          })}
        />
      </CollapsibleCard>
    </div>
  )
}
