import type { Metadata } from 'next'
import Link from 'next/link'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { currentYM } from '@/lib/date'
import { generatePayrollWhatsAppLink } from '@/lib/whatsapp'
import { getServerAuthContext } from '@/services/auth.service'
import { isFeatureEnabled } from '@/services/plan.service'
import { redirect } from 'next/navigation'
import NuevoGastoForm from '../gastos/NuevoGastoForm'
import DeleteGastoButton from '../gastos/DeleteGastoButton'
import GraficoGastos from '../gastos/GraficoGastos'
import Paginacion from '@/components/dashboard/Paginacion'
import KpiContainer from '../finanzas/KpiContainer'
import InfoTooltip from '../finanzas/InfoTooltip'
import CustomRangePicker from '../finanzas/CustomRangePicker'
import NuevaNominaForm from '../nominas/NuevaNominaForm'
import NominaActions from '../nominas/NominaActions'
import gastosStyles from '../gastos/gastos.module.css'
import nominasStyles from '../nominas/nominas.module.css'
import styles from './egresos.module.css'

export const metadata: Metadata = { title: 'Egresos — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
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

function formatShortDate(date: string) {
  const [yyyy, mm, dd] = date.slice(0, 10).split('-')
  if (!yyyy || !mm || !dd) return date
  return `${dd}/${mm}/${yyyy}`
}

function diffDaysInclusive(fromISO: string, toISO: string) {
  const [fy, fm, fd] = fromISO.split('-').map(Number)
  const [ty, tm, td] = toISO.split('-').map(Number)
  const start = new Date(fy, (fm ?? 1) - 1, fd ?? 1)
  const end = new Date(ty, (tm ?? 1) - 1, td ?? 1)
  const ms = end.getTime() - start.getTime()
  return Math.max(1, Math.floor(ms / 86400000) + 1)
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

function formatPeriod(start: string, end: string) {
  return `${start} al ${end}`
}

const CATEGORY_TONE: Record<string, { card: string; fill: string; badge: string }> = {
  Alquiler:  { card: gastosStyles.catCardAlquiler,  fill: gastosStyles.catFillAlquiler,  badge: gastosStyles.catBadgeAlquiler },
  Productos: { card: gastosStyles.catCardProductos, fill: gastosStyles.catFillProductos, badge: gastosStyles.catBadgeProductos },
  Servicios: { card: gastosStyles.catCardServicios, fill: gastosStyles.catFillServicios, badge: gastosStyles.catBadgeServicios },
  Sueldos:   { card: gastosStyles.catCardSueldos,   fill: gastosStyles.catFillSueldos,   badge: gastosStyles.catBadgeSueldos },
  Otros:     { card: gastosStyles.catCardOtros,     fill: gastosStyles.catFillOtros,     badge: gastosStyles.catBadgeOtros },
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

export default async function EgresosPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{
    tab?: string
    // gastos params
    p?: string; periodo?: string; desde?: string; hasta?: string
    // nominas params
    mes?: string
  }>
}) {
  const { barbershopId } = await params
  const { tab, p = '1', periodo, desde, hasta, mes } = await searchParams

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)

  const canGastos = context && canAccess(context.role, 'manage_expenses')
  const canNominas = context && canAccess(context.role, 'manage_payroll')

  if (!canGastos && !canNominas) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const activeTab = tab === 'nominas' ? 'nominas' : 'gastos'

  const tabNav = (
    <div className={styles.pageTabs}>
      {canGastos && (
        <Link
          href={`/dashboard/${barbershopId}/egresos`}
          className={activeTab === 'gastos' ? styles.pageTabActive : styles.pageTab}
        >
          Gastos
        </Link>
      )}
      {canNominas && (
        <Link
          href={`/dashboard/${barbershopId}/egresos?tab=nominas`}
          className={activeTab === 'nominas' ? styles.pageTabActive : styles.pageTab}
        >
          Nóminas
        </Link>
      )}
    </div>
  )

  // ── GASTOS TAB ─────────────────────────────────────────────────────────────
  if (activeTab === 'gastos') {
    if (!canGastos) redirect(`/dashboard/${barbershopId}/egresos?tab=nominas`)

    const PAGE_SIZE = 20
    const page = Math.max(1, Number(p) || 1)
    const now = new Date()
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayISO = toISODate(todayDate)
    const ym = currentYM()
    const [selY, selM] = ym.split('-').map(Number)
    const monthFromDate = new Date(selY, selM - 1, 1)
    const customFrom = parseISODate(desde)
    const customTo = parseISODate(hasta)
    const isBasePlan = (context.plan ?? 'Base').toLowerCase() === 'base'
    const basePlanMinDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 6, todayDate.getDate())
    let periodMode: 'mes' | 'ultima-semana' | 'custom' = 'mes'
    let fromDate = monthFromDate
    let toDate = todayDate
    let rangeAdjustedForPlan = false

    if (periodo === 'custom' && customFrom && customTo) {
      periodMode = 'custom'
      fromDate = customFrom <= customTo ? customFrom : customTo
      toDate = customFrom <= customTo ? customTo : customFrom
      if (toDate > todayDate) toDate = todayDate
      if (isBasePlan && fromDate < basePlanMinDate) { fromDate = basePlanMinDate; rangeAdjustedForPlan = true }
      if (fromDate > toDate) { toDate = fromDate; rangeAdjustedForPlan = true }
    }

    const from = toISODate(fromDate)
    const to = toISODate(toDate)
    const periodDescription = `Mostrando datos del ${formatShortDate(from)} al ${formatShortDate(to)}`

    const [{ data: expenses, count: expenseCount }, { data: allExpenses }] = await Promise.all([
      supabase
        .from('expenses')
        .select('id, description, amount, category, date', { count: 'exact' })
        .eq('barbershop_id', barbershopId)
        .gte('date', from).lte('date', to)
        .order('date', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      supabase
        .from('expenses')
        .select('amount, category, date')
        .eq('barbershop_id', barbershopId)
        .gte('date', from).lte('date', to),
    ])

    const total = (allExpenses ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
    const totalPages = Math.ceil((expenseCount ?? 0) / PAGE_SIZE)
    const registros = allExpenses?.length ?? 0
    const daysInRange = diffDaysInclusive(from, to)
    const averageDaily = daysInRange > 0 ? total / daysInRange : 0

    const chartExpenses = (allExpenses ?? []).map((e: { date?: string; amount?: number; category?: string }) => ({
      fecha: e.date ?? '',
      amount: e.amount ?? 0,
      category: e.category ?? 'Otros',
    })).filter(e => e.fecha)

    const byCategory: Record<string, number> = {}
    for (const e of allExpenses ?? []) {
      const key = e.category ?? 'Otros'
      byCategory[key] = (byCategory[key] ?? 0) + (e.amount ?? 0)
    }
    const topCategoryEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] ?? null
    const majorExpenseThreshold = total > 0 ? total * 0.25 : Number.POSITIVE_INFINITY

    const expensesByCategoryMap: Record<string, Array<{ id: string; description: string; amount: number; category: string; date: string }>> = {}
    for (const e of expenses ?? []) {
      const key = e.category ?? 'Otros'
      if (!expensesByCategoryMap[key]) expensesByCategoryMap[key] = []
      expensesByCategoryMap[key].push({ id: e.id, description: e.description, amount: e.amount ?? 0, category: key, date: e.date })
    }
    const groupedExpenses = Object.entries(expensesByCategoryMap)
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => b.date.localeCompare(a.date)),
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
      }))
      .sort((a, b) => b.subtotal - a.subtotal)

    const paginationBaseHref = `?periodo=custom&desde=${from}&hasta=${to}`

    return (
      <div>
        <div className={styles.header}>
          <h1 className={styles.title}>Egresos</h1>
        </div>
        {tabNav}
        <div className={gastosStyles.header} style={{ marginBottom: 12 }}>
          <p className={gastosStyles.subtitle}>{periodDescription}</p>
        </div>
        <NuevoGastoForm barbershopId={barbershopId} />
        <div className={gastosStyles.periodWrap}>
          <CustomRangePicker
            periodMode={periodMode}
            isBasePlan={isBasePlan}
            rangeAdjustedForPlan={rangeAdjustedForPlan}
            from={from}
            to={to}
            todayISO={todayISO}
            basePlanMinISO={isBasePlan ? toISODate(basePlanMinDate) : undefined}
          />
        </div>
        <KpiContainer grid="2x2" title="Métricas de Gastos" summary={periodDescription}>
          <div className={gastosStyles.summaryCard}>
            <p className={gastosStyles.summaryLabel}>
              <span className={gastosStyles.summaryLabelRow}>
                <span>Gasto Total Periodo</span>
                <InfoTooltip ariaLabel="Qué significa Gasto Total Periodo" content="Suma de todos los egresos cargados dentro del rango seleccionado." />
              </span>
            </p>
            <p className={`${gastosStyles.summaryValue} ${gastosStyles.summaryValueDanger}`}>{formatARS(total)}</p>
          </div>
          <div className={gastosStyles.summaryCard}>
            <p className={gastosStyles.summaryLabel}>
              <span className={gastosStyles.summaryLabelRow}>
                <span>Promedio Diario</span>
                <InfoTooltip ariaLabel="Qué significa Promedio Diario" content="Quemado de caja diario. Fórmula: gasto total del período dividido por días del rango." />
              </span>
            </p>
            <p className={gastosStyles.summaryValue}>{formatARS(averageDaily)}</p>
          </div>
          <div className={gastosStyles.summaryCard}>
            <p className={gastosStyles.summaryLabel}>
              <span className={gastosStyles.summaryLabelRow}>
                <span>Categoría Principal</span>
                <InfoTooltip ariaLabel="Qué significa Categoría Principal" content="Categoría que más dinero consumió en el período y su monto total." />
              </span>
            </p>
            <p className={gastosStyles.summaryValue}>{topCategoryEntry ? topCategoryEntry[0] : '—'}</p>
            <p className={gastosStyles.summaryMeta}>{topCategoryEntry ? formatARS(topCategoryEntry[1]) : 'Sin datos'}</p>
          </div>
          <div className={gastosStyles.summaryCard}>
            <p className={gastosStyles.summaryLabel}>
              <span className={gastosStyles.summaryLabelRow}>
                <span>Registros</span>
                <InfoTooltip ariaLabel="Qué significa Registros" content="Cantidad total de gastos cargados dentro del período activo." />
              </span>
            </p>
            <p className={gastosStyles.summaryValue}>{registros}</p>
          </div>
        </KpiContainer>

        {chartExpenses.length > 0 && (
          <details className={gastosStyles.graphPanel}>
            <summary className={gastosStyles.graphPanelSummary}>
              <span>Tendencia de Gastos</span>
              <span className={gastosStyles.graphPanelChevron} aria-hidden>▾</span>
            </summary>
            <div className={gastosStyles.graphPanelBody}>
              <GraficoGastos data={chartExpenses} />
            </div>
          </details>
        )}

        {Object.keys(byCategory).length > 0 && (
          <div className={gastosStyles.catGrid}>
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
              const tone = CATEGORY_TONE[cat] ?? CATEGORY_TONE.Otros
              const pct = Math.round((amt / (total || 1)) * 100)
              return (
                <div key={cat} className={`${gastosStyles.catCard} ${tone.card}`}>
                  <p className={gastosStyles.catName}>
                    <span className={gastosStyles.summaryLabelRow}>
                      <span>{cat}</span>
                      <InfoTooltip ariaLabel={`Detalle de la categoría ${cat}`} content={`Esta categoría representa el ${pct}% de tus gastos totales.`} />
                    </span>
                  </p>
                  <p className={gastosStyles.catAmt}>{formatARS(amt)}</p>
                  <div className={gastosStyles.catBar}>
                    <progress className={`${gastosStyles.catBarFill} ${tone.fill}`} value={Math.min(100, pct)} max={100} aria-label={`Participación de ${cat} en gastos`} />
                  </div>
                  <p className={gastosStyles.catPct}>{pct}%</p>
                </div>
              )
            })}
          </div>
        )}

        <div className={gastosStyles.tableSection}>
          {!expenses || expenses.length === 0 ? (
            <div className={gastosStyles.empty}>No hay gastos en el rango seleccionado.</div>
          ) : (
            <div className={gastosStyles.categoryGroups}>
              {groupedExpenses.map((group, idx) => {
                const tone = CATEGORY_TONE[group.category] ?? CATEGORY_TONE.Otros
                return (
                  <details key={group.category} className={gastosStyles.categoryGroup} open={idx === 0}>
                    <summary className={gastosStyles.categorySummary}>
                      <span className={gastosStyles.categorySummaryLeft}>
                        <span className={`${gastosStyles.catBadge} ${tone.badge}`}>{group.category}</span>
                        <span className={gastosStyles.categoryCount}>{group.items.length} registro(s)</span>
                      </span>
                      <span className={gastosStyles.categorySummaryRight}>
                        <span className={gastosStyles.categorySubtotal}>{formatARS(group.subtotal)}</span>
                        <span className={gastosStyles.categoryChevron} aria-hidden>▾</span>
                      </span>
                    </summary>
                    <div className={gastosStyles.categoryBody}>
                      <div className={gastosStyles.categoryHead}>
                        <span>Fecha</span><span>Descripción</span>
                        <span className={gastosStyles.amountHeader}>Monto</span><span></span>
                      </div>
                      {group.items.map((item) => {
                        const isMajor = item.amount > majorExpenseThreshold
                        return (
                          <div key={item.id} className={`${gastosStyles.categoryRow} ${isMajor ? gastosStyles.expenseMajorRow : ''}`}>
                            <span className={gastosStyles.muted}>{item.date}</span>
                            <span>
                              {item.description}
                              {isMajor && <span className={gastosStyles.majorBadge}>Gasto Mayor</span>}
                            </span>
                            <span className={gastosStyles.amountValue}>{formatARS(item.amount)}</span>
                            <span className={gastosStyles.categoryAction}>
                              <DeleteGastoButton barbershopId={barbershopId} id={item.id} />
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                )
              })}
            </div>
          )}
          <Paginacion current={page} total={totalPages} baseHref={paginationBaseHref} />
        </div>
      </div>
    )
  }

  // ── NÓMINAS TAB ────────────────────────────────────────────────────────────
  if (!canNominas) redirect(`/dashboard/${barbershopId}/egresos`)

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
    periodMode = 'dia'; fromDate = todayDate; toDate = todayDate
  } else if (periodo === 'ultima-semana') {
    periodMode = 'ultima-semana'; fromDate = weekFromDate; toDate = todayDate
  } else if (periodo === 'custom' && customFrom && customTo) {
    periodMode = 'custom'
    fromDate = customFrom <= customTo ? customFrom : customTo
    toDate = customFrom <= customTo ? customTo : customFrom
    if (toDate > todayDate) toDate = todayDate
    if (isBasePlan && fromDate < basePlanMinDate) { fromDate = basePlanMinDate; rangeAdjustedForPlan = true }
    if (fromDate > toDate) { toDate = fromDate; rangeAdjustedForPlan = true }
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
      .lte('period_start', to).gte('period_end', from)
      .order('created_at', { ascending: false }),
  ])

  const totalCommissions = (payrolls ?? []).reduce((sum, p) => sum + (p.commission_amount ?? 0), 0)
  const pendingTotal = (payrolls ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + (p.commission_amount ?? 0), 0)
  const totalTeamSales = (payrolls ?? []).reduce((sum, p) => sum + (p.total_sales ?? 0), 0)
  const settledBarbers = new Set((payrolls ?? []).map(p => p.barber_id).filter((id): id is string => typeof id === 'string' && id.length > 0)).size
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
  const groupedPayrollMap = new Map<string, { barberName: string; pendingTotal: number; paidTotal: number; items: NominaRow[] }>()
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
    .map((group) => ({ ...group, items: group.items.sort((a, b) => b.created_at.localeCompare(a.created_at)) }))
    .sort((a, b) => a.barberName.localeCompare(b.barberName))

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Egresos</h1>
          {pendingTotal > 0 && (
            <p className={nominasStyles.pendingAlert}>{formatARS(pendingTotal)} pendiente de pago</p>
          )}
        </div>
        <ExportCsvButton
          data={payrollExportRows}
          filename={`nominas-${barbershopId}.csv`}
          enabled={canExportData}
          barbershopId={barbershopId}
        />
      </div>
      {tabNav}

      <KpiContainer title="Resumen de Nóminas" summary={`${(payrolls ?? []).length} liquidaciones en el período`} grid="2x2">
        <article className={nominasStyles.kpiCard}>
          <p className={nominasStyles.kpiLabel}><span>Total Comisiones</span><InfoTooltip ariaLabel="Qué significa Total Comisiones" content="Suma de todas las comisiones liquidadas en el período seleccionado." /></p>
          <p className={nominasStyles.kpiValue}>{formatARS(totalCommissions)}</p>
        </article>
        <article className={nominasStyles.kpiCard}>
          <p className={nominasStyles.kpiLabel}><span>Pendiente de Pago</span><InfoTooltip ariaLabel="Qué significa Pendiente de Pago" content="Total de comisiones en nóminas que todavía tienen estado pendiente." /></p>
          <p className={`${nominasStyles.kpiValue} ${nominasStyles.kpiValueDanger}`}>{formatARS(pendingTotal)}</p>
        </article>
        <article className={nominasStyles.kpiCard}>
          <p className={nominasStyles.kpiLabel}><span>Ventas de Equipo</span><InfoTooltip ariaLabel="Qué significa Ventas de Equipo" content="Suma del campo total_sales de todas las nóminas del período." /></p>
          <p className={nominasStyles.kpiValue}>{formatARS(totalTeamSales)}</p>
        </article>
        <article className={nominasStyles.kpiCard}>
          <p className={nominasStyles.kpiLabel}><span>Barberos Liquidados</span><InfoTooltip ariaLabel="Qué significa Barberos Liquidados" content="Cantidad de barberos únicos con al menos una nómina en el rango actual." /></p>
          <p className={nominasStyles.kpiValue}>{settledBarbers}</p>
        </article>
      </KpiContainer>

      <NuevaNominaForm barbershopId={barbershopId} barbers={barbers ?? []} />

      <div className={nominasStyles.filtersWrap}>
        <div className={nominasStyles.monthNav}>
          <a href="?tab=nominas&periodo=dia" className={periodMode === 'dia' ? nominasStyles.monthActive : nominasStyles.monthTab}>Hoy</a>
          <a href="?tab=nominas&periodo=ultima-semana" className={periodMode === 'ultima-semana' ? nominasStyles.monthActive : nominasStyles.monthTab}>Última semana</a>
          {months.map((mo) => (
            <a key={mo} href={`?tab=nominas&mes=${mo}`} className={periodMode === 'mes' && mo === ym ? nominasStyles.monthActive : nominasStyles.monthTab}>
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
      <p className={nominasStyles.periodDescription}>{periodDescription}</p>

      {!payrolls || payrolls.length === 0 ? (
        <div className={nominasStyles.empty}>
          <p>Todavía no hay nóminas liquidadas.</p>
          <p style={{ fontSize: '.82rem', marginTop: 6 }}>Hacé click en &quot;Liquidar nómina&quot; para calcular la comisión de un barbero.</p>
        </div>
      ) : (
        <div className={nominasStyles.payrollGroups}>
          {groupedPayrolls.map((group) => (
            <details key={group.barberName} className={nominasStyles.payrollGroup}>
              <summary className={nominasStyles.payrollSummary}>
                <div className={nominasStyles.payrollSummaryMain}>
                  <span className={nominasStyles.payrollBarberName}>{group.barberName}</span>
                  <span className={nominasStyles.payrollSummaryMeta}>{group.items.length} liquidaciones</span>
                </div>
                <div className={nominasStyles.payrollSummaryTotals}>
                  <span className={nominasStyles.payrollPending}>Pendiente: {formatARS(group.pendingTotal)}</span>
                  <span className={nominasStyles.payrollPaid}>Pagado: {formatARS(group.paidTotal)}</span>
                  <span className={nominasStyles.payrollChevron} aria-hidden>▾</span>
                </div>
              </summary>
              <div className={nominasStyles.groupTable}>
                <div className={nominasStyles.groupTableHead}>
                  <span>Fecha</span><span>Período</span><span>Ventas</span>
                  <span>Comisión</span><span>Estado</span><span>WhatsApp</span><span>Acciones</span>
                </div>
                {group.items.map((p) => {
                  const barberName = (Array.isArray(p.barbers) ? p.barbers?.[0]?.name : p.barbers?.name) ?? 'Barbero'
                  const barberPhone = (Array.isArray(p.barbers) ? p.barbers?.[0]?.phone : p.barbers?.phone) ?? null
                  const periodLabel = formatPeriod(p.period_start, p.period_end)
                  const whatsappLink = generatePayrollWhatsAppLink(
                    barberPhone, barberName, periodLabel,
                    formatARS(p.commission_amount),
                    `${formatARS(p.commission_amount)} (${p.commission_pct}%)`,
                    formatARS(p.total_sales)
                  )
                  const payrollDate = formatShortDate((p.paid_at ?? p.created_at ?? p.period_end).slice(0, 10))
                  return (
                    <div key={p.id} className={nominasStyles.groupTableRow}>
                      <span className={nominasStyles.dateCell}>{payrollDate}</span>
                      <span className={nominasStyles.periodCell}>{p.period_start} → {p.period_end}</span>
                      <span>{formatARS(p.total_sales)}</span>
                      <span className={nominasStyles.commissionCell}>{formatARS(p.commission_amount)}</span>
                      <span>
                        {p.status === 'paid'
                          ? <span className={nominasStyles.badgePaid}>Pagada</span>
                          : <span className={nominasStyles.badgePending}>Pendiente</span>
                        }
                      </span>
                      <a href={whatsappLink} target="_blank" rel="noreferrer"
                        className={nominasStyles.btnWhatsapp}
                        aria-label={`Compartir nómina de ${barberName} por WhatsApp`}
                        title={barberPhone ? `Abrir chat con ${barberName}` : 'Abrir WhatsApp para elegir contacto manualmente'}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className={nominasStyles.whatsappIcon}>
                          <path fill="currentColor" d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.1-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 6.9 12.6l-.3.4.8 3-3-.8-.4.3A8.2 8.2 0 1 1 12 3.8Zm-3 4.4c-.3 0-.7.1-.9.4-.2.3-.9 1-.9 2.3 0 1 .3 2 1 3 .8.8 1.8 1.5 2.8 2 .4.2 1 .1 1.3-.2l.7-.8c.2-.2.4-.3.7-.2l1.7.6c.4.1.6.5.5.9-.2 1.1-.8 2-1.7 2.5-.5.3-1.1.4-1.7.3-1.4-.2-3.1-1-4.9-2.7-2.1-1.9-3.2-4-3.5-5.8-.1-.6.1-1.3.5-1.8.5-.7 1.1-1.1 1.8-1.1Z" />
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
