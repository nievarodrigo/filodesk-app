import type { Metadata } from 'next'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { generatePayrollWhatsAppLink } from '@/lib/whatsapp'
import { getServerAuthContext } from '@/services/auth.service'
import { isFeatureEnabled } from '@/services/plan.service'
import { redirect } from 'next/navigation'
import NuevaNominaForm from './NuevaNominaForm'
import NominaActions from './NominaActions'
import styles from './nominas.module.css'

export const metadata: Metadata = { title: 'Nóminas — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatPeriod(start: string, end: string) {
  return `${start} al ${end}`
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
  const canExportData = isFeatureEnabled(context.plan, 'export_data')
  const payrollExportRows = (payrolls ?? []).map((payroll) => ({
    barbero: (Array.isArray(payroll.barbers) ? payroll.barbers?.[0]?.name : payroll.barbers?.name) ?? '—',
    periodo_inicio: payroll.period_start,
    periodo_fin: payroll.period_end,
    ventas_totales: payroll.total_sales,
    porcentaje_comision: payroll.commission_pct,
    comision_total: payroll.commission_amount,
    estado: payroll.status,
    pagada_en: payroll.paid_at ?? '',
  }))

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
        <ExportCsvButton
          data={payrollExportRows}
          filename={`nominas-${barbershopId}.csv`}
          enabled={canExportData}
          barbershopId={barbershopId}
        />
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
            <span>Compartir</span>
            <span></span>
          </div>
          {(payrolls as Array<{ id: string; period_start: string; period_end: string; total_sales: number; commission_pct: number; commission_amount: number; status: string; barbers?: Array<{ name: string }> | { name: string } }>).map(p => {
            const barberName = (Array.isArray(p.barbers) ? p.barbers?.[0]?.name : p.barbers?.name) ?? 'Barbero'
            const periodLabel = formatPeriod(p.period_start, p.period_end)
            const whatsappLink = generatePayrollWhatsAppLink(
              barberName,
              periodLabel,
              formatARS(p.commission_amount),
              `${formatARS(p.commission_amount)} (${p.commission_pct}%)`,
              formatARS(p.total_sales)
            )

            return (
              <div key={p.id} className={styles.tableRow}>
                <span style={{ fontWeight: 600 }}>{barberName}</span>
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
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.btnWhatsapp}
                  aria-label={`Compartir nómina de ${barberName} por WhatsApp`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.whatsappIcon}>
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.1-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 6.9 12.6l-.3.4.8 3-3-.8-.4.3A8.2 8.2 0 1 1 12 3.8Zm-3 4.4c-.3 0-.7.1-.9.4-.2.3-.9 1-.9 2.3 0 1 .3 2 1 3 .8.8 1.8 1.5 2.8 2 .4.2 1 .1 1.3-.2l.7-.8c.2-.2.4-.3.7-.2l1.7.6c.4.1.6.5.5.9-.2 1.1-.8 2-1.7 2.5-.5.3-1.1.4-1.7.3-1.4-.2-3.1-1-4.9-2.7-2.1-1.9-3.2-4-3.5-5.8-.1-.6.1-1.3.5-1.8.5-.7 1.1-1.1 1.8-1.1Z"
                    />
                  </svg>
                  WhatsApp
                </a>
                <NominaActions barbershopId={barbershopId} nominaId={p.id} status={p.status} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
