import type { Metadata } from 'next'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { currentYM } from '@/lib/date'
import { generatePayrollWhatsAppLink } from '@/lib/whatsapp'
import { getServerAuthContext } from '@/services/auth.service'
import { isFeatureEnabled } from '@/services/plan.service'
import { redirect } from 'next/navigation'
import KpiContainer from '../finanzas/KpiContainer'
import InfoTooltip from '../finanzas/InfoTooltip'
import CustomRangePicker from '../finanzas/CustomRangePicker'
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

function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISODate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  const parsed = new Date(y, (m ?? 1) - 1, d ?? 1)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function formatShortDate(date: string) {
  const [yyyy, mm, dd] = date.slice(0, 10).split('-')
  if (!yyyy || !mm || !dd) return date
  return `${dd}/${mm}/${yyyy}`
}

type PayrollBarberRelation = Array<{ name: string; phone: string | null }> | { name: string; phone: string | null }
type NominaRow = {
  id: string
  barber_id: string | null
  period_start: string
  period_end: string
  total_sales: number
  commission_pct: number
  commission_amount: number
  status: string
  paid_at: string | null
  created_at: string
  barbers?: PayrollBarberRelation
}

export default async function NominasPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ mes?: string; periodo?: string; desde?: string; hasta?: string }>
}) {
  const { barbershopId } = await params
  const { mes, periodo, desde, hasta } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context || !canAccess(context.role, 'manage_payroll')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const now = new Date()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayISO = toISODate(todayDate)
  const ym = mes ?? currentYM()
  const [selY, selM] = ym.split('-').map(Number)
  const monthFromDate = new Date(selY, selM - 1, 1)
  const monthToDate = new Date(selY, selM, 0)
  const weekFromDate = addDays(todayDate, -6)
  const customFrom = parseISODate(desde)
  const customTo = parseISODate(hasta)
  const isBasePlan = (context.plan ?? 'Base').toLowerCase() === 'base'
  const basePlanMinDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 6, todayDate.getDate())

  let periodMode: 'dia' | 'mes' | 'ultima-semana' | 'custom' = 'mes'
  let fromDate = monthFromDate
  let toDate = monthToDate
  let rangeAdjustedForPlan = false

  if (periodo === 'dia') {
    periodMode = 'dia'
    fromDate = todayDate
    toDate = todayDate
  } else if (periodo === 'ultima-semana') {
    periodMode = 'ultima-semana'
    fromDate = weekFromDate
    toDate = todayDate
  } else if (periodo === 'custom' && customFrom && customTo) {
    periodMode = 'custom'
    fromDate = customFrom <= customTo ? customFrom : customTo
    toDate = customFrom <= customTo ? customTo : customFrom
    if (toDate > todayDate) toDate = todayDate
    if (isBasePlan && fromDate < basePlanMinDate) {
      fromDate = basePlanMinDate
      rangeAdjustedForPlan = true
    }
    if (fromDate > toDate) {
      toDate = fromDate
      rangeAdjustedForPlan = true
    }
  }

  const from = toISODate(fromDate)
  const to = toISODate(toDate)
  const periodDescription = `Mostrando nóminas del ${formatShortDate(from)} al ${formatShortDate(to)}`

  const [curY, curM] = currentYM().split('-').map(Number)
  const months: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(curY, curM - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [{ data: barbers }, { data: payrolls }] = await Promise.all([
    supabase.from('barbers').select('id, name, commission_pct').eq('barbershop_id', barbershopId).eq('active', true).order('name'),
    supabase.from('payrolls')
      .select('id, barber_id, period_start, period_end, total_sales, commission_pct, commission_amount, status, paid_at, created_at, barbers(name, phone)')
      .eq('barbershop_id', barbershopId)
      .lte('period_start', to)
      .gte('period_end', from)
      .order('created_at', { ascending: false }),
  ])

  const totalCommissions = (payrolls ?? []).reduce((sum, payroll) => sum + (payroll.commission_amount ?? 0), 0)
  const pendingTotal = (payrolls ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + (p.commission_amount ?? 0), 0)
  const totalTeamSales = (payrolls ?? []).reduce((sum, payroll) => sum + (payroll.total_sales ?? 0), 0)
  const settledBarbers = new Set(
    (payrolls ?? [])
      .map((payroll) => payroll.barber_id)
      .filter((barberId): barberId is string => typeof barberId === 'string' && barberId.length > 0)
  ).size
  const canExportData = isFeatureEnabled(context.plan, 'export_data')
  const payrollExportRows = (payrolls ?? []).map((payroll) => {
    const b = payroll.barbers as PayrollBarberRelation | undefined
    const barbero = (Array.isArray(b) ? b[0]?.name : b?.name) ?? '—'
    return {
      barbero,
      periodo_inicio: payroll.period_start,
      periodo_fin: payroll.period_end,
      ventas_totales: payroll.total_sales,
      porcentaje_comision: payroll.commission_pct,
      comision_total: payroll.commission_amount,
      estado: payroll.status,
      pagada_en: payroll.paid_at ?? '',
    }
  })
  const payrollRows = (payrolls ?? []) as NominaRow[]
  const groupedPayrollMap = new Map<string, {
    barberName: string
    pendingTotal: number
    paidTotal: number
    items: NominaRow[]
  }>()
  for (const payroll of payrollRows) {
    const barber = payroll.barbers
    const barberName = (Array.isArray(barber) ? barber[0]?.name : barber?.name) ?? 'Barbero'
    const existing = groupedPayrollMap.get(barberName)
    if (existing) {
      existing.items.push(payroll)
      if (payroll.status === 'paid') existing.paidTotal += payroll.commission_amount ?? 0
      else existing.pendingTotal += payroll.commission_amount ?? 0
    } else {
      groupedPayrollMap.set(barberName, {
        barberName,
        pendingTotal: payroll.status === 'pending' ? payroll.commission_amount ?? 0 : 0,
        paidTotal: payroll.status === 'paid' ? payroll.commission_amount ?? 0 : 0,
        items: [payroll],
      })
    }
  }
  const groupedPayrolls = [...groupedPayrollMap.values()]
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    }))
    .sort((a, b) => a.barberName.localeCompare(b.barberName))

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

      <KpiContainer
        title="Resumen de Nóminas"
        summary={`${(payrolls ?? []).length} liquidaciones en el período`}
        grid="2x2"
      >
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span>Total Comisiones</span>
            <InfoTooltip
              ariaLabel="Qué significa Total Comisiones"
              content="Suma de todas las comisiones liquidadas en el período seleccionado."
            />
          </p>
          <p className={styles.kpiValue}>{formatARS(totalCommissions)}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span>Pendiente de Pago</span>
            <InfoTooltip
              ariaLabel="Qué significa Pendiente de Pago"
              content="Total de comisiones en nóminas que todavía tienen estado pendiente."
            />
          </p>
          <p className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{formatARS(pendingTotal)}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span>Ventas de Equipo</span>
            <InfoTooltip
              ariaLabel="Qué significa Ventas de Equipo"
              content="Suma del campo total_sales de todas las nóminas del período."
            />
          </p>
          <p className={styles.kpiValue}>{formatARS(totalTeamSales)}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>
            <span>Barberos Liquidados</span>
            <InfoTooltip
              ariaLabel="Qué significa Barberos Liquidados"
              content="Cantidad de barberos únicos con al menos una nómina en el rango actual."
            />
          </p>
          <p className={styles.kpiValue}>{settledBarbers}</p>
        </article>
      </KpiContainer>

      <NuevaNominaForm barbershopId={barbershopId} barbers={barbers ?? []} />

      <div className={styles.filtersWrap}>
        <div className={styles.monthNav}>
          <a
            href="?periodo=dia"
            className={periodMode === 'dia' ? styles.monthActive : styles.monthTab}
          >
            Hoy
          </a>
          <a
            href="?periodo=ultima-semana"
            className={periodMode === 'ultima-semana' ? styles.monthActive : styles.monthTab}
          >
            Última semana
          </a>
          {months.map((mo) => (
            <a
              key={mo}
              href={`?mes=${mo}`}
              className={periodMode === 'mes' && mo === ym ? styles.monthActive : styles.monthTab}
            >
              {monthLabel(mo)}
            </a>
          ))}
        </div>
        <CustomRangePicker
          periodMode={periodMode === 'dia' ? 'mes' : periodMode}
          isBasePlan={isBasePlan}
          rangeAdjustedForPlan={rangeAdjustedForPlan}
          from={from}
          to={to}
          todayISO={todayISO}
          basePlanMinISO={isBasePlan ? toISODate(basePlanMinDate) : undefined}
        />
      </div>
      <p className={styles.periodDescription}>{periodDescription}</p>

      {!payrolls || payrolls.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay nóminas liquidadas.</p>
          <p style={{ fontSize: '.82rem', marginTop: 6 }}>Hacé click en &quot;Liquidar nómina&quot; para calcular la comisión de un barbero.</p>
        </div>
      ) : (
        <div className={styles.payrollGroups}>
          {groupedPayrolls.map((group) => (
            <details key={group.barberName} className={styles.payrollGroup}>
              <summary className={styles.payrollSummary}>
                <div className={styles.payrollSummaryMain}>
                  <span className={styles.payrollBarberName}>{group.barberName}</span>
                  <span className={styles.payrollSummaryMeta}>{group.items.length} liquidaciones</span>
                </div>
                <div className={styles.payrollSummaryTotals}>
                  <span className={styles.payrollPending}>Pendiente: {formatARS(group.pendingTotal)}</span>
                  <span className={styles.payrollPaid}>Pagado: {formatARS(group.paidTotal)}</span>
                  <span className={styles.payrollChevron} aria-hidden>▾</span>
                </div>
              </summary>

              <div className={styles.groupTable}>
                <div className={styles.groupTableHead}>
                  <span>Fecha</span>
                  <span>Período</span>
                  <span>Ventas</span>
                  <span>Comisión</span>
                  <span>Estado</span>
                  <span>WhatsApp</span>
                  <span>Acciones</span>
                </div>
                {group.items.map((p) => {
                  const barberName = (Array.isArray(p.barbers) ? p.barbers?.[0]?.name : p.barbers?.name) ?? 'Barbero'
                  const barberPhone = (Array.isArray(p.barbers) ? p.barbers?.[0]?.phone : p.barbers?.phone) ?? null
                  const periodLabel = formatPeriod(p.period_start, p.period_end)
                  const whatsappLink = generatePayrollWhatsAppLink(
                    barberPhone,
                    barberName,
                    periodLabel,
                    formatARS(p.commission_amount),
                    `${formatARS(p.commission_amount)} (${p.commission_pct}%)`,
                    formatARS(p.total_sales)
                  )
                  const payrollDate = formatShortDate((p.paid_at ?? p.created_at ?? p.period_end).slice(0, 10))

                  return (
                    <div key={p.id} className={styles.groupTableRow}>
                      <span className={styles.dateCell}>{payrollDate}</span>
                      <span className={styles.periodCell}>{p.period_start} → {p.period_end}</span>
                      <span>{formatARS(p.total_sales)}</span>
                      <span className={styles.commissionCell}>{formatARS(p.commission_amount)}</span>
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
                        title={barberPhone ? `Abrir chat con ${barberName}` : 'Abrir WhatsApp para elegir contacto manualmente'}
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
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
