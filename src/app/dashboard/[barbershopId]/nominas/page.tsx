import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { getServerAuthContext } from '@/services/auth.service'
import { redirect } from 'next/navigation'
import NuevaNominaForm from './NuevaNominaForm'
import NominaActions from './NominaActions'
import styles from './nominas.module.css'

export const metadata: Metadata = { title: 'Nóminas — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default async function NominasPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context || !canAccess(context.role, 'manage_payroll')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const [{ data: barbers }, { data: payrolls }] = await Promise.all([
    supabase.from('barbers').select('id, name, commission_pct').eq('barbershop_id', barbershopId).eq('active', true).order('name'),
    supabase.from('payrolls')
      .select('id, period_start, period_end, total_sales, commission_pct, commission_amount, status, paid_at, barbers(name)')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false }),
  ])

  const pendingTotal = (payrolls ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + (p.commission_amount ?? 0), 0)

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Nóminas</h1>
          {pendingTotal > 0 && (
            <p className={styles.pendingAlert}>
              {formatARS(pendingTotal)} pendiente de pago
            </p>
          )}
        </div>
      </div>
      <NuevaNominaForm barbershopId={barbershopId} barbers={barbers ?? []} />

      {!payrolls || payrolls.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay nóminas liquidadas.</p>
          <p style={{ fontSize: '.82rem', marginTop: 6 }}>Hacé click en &quot;Liquidar nómina&quot; para calcular la comisión de un barbero.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Barbero</span>
            <span>Período</span>
            <span>Ventas</span>
            <span>Comisión</span>
            <span>Estado</span>
            <span></span>
          </div>
          {(payrolls as Array<{ id: string; period_start: string; period_end: string; total_sales: number; commission_amount: number; status: string; barbers?: Array<{ name: string }> | { name: string } }>).map(p => (
            <div key={p.id} className={styles.tableRow}>
              <span style={{ fontWeight: 600 }}>{(Array.isArray(p.barbers) ? p.barbers?.[0]?.name : p.barbers?.name) ?? '—'}</span>
              <span className={styles.muted} style={{ fontSize: '.82rem' }}>
                {p.period_start} → {p.period_end}
              </span>
              <span>{formatARS(p.total_sales)}</span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{formatARS(p.commission_amount)}</span>
              <span>
                {p.status === 'paid' ? (
                  <span className={styles.badgePaid}>Pagada</span>
                ) : (
                  <span className={styles.badgePending}>Pendiente</span>
                )}
              </span>
              <NominaActions barbershopId={barbershopId} nominaId={p.id} status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
