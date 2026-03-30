import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { currentYM } from '@/lib/date'
import { getServerAuthContext } from '@/services/auth.service'
import { redirect } from 'next/navigation'
import NuevoGastoForm from './NuevoGastoForm'
import DeleteGastoButton from './DeleteGastoButton'
import GraficoGastos from './GraficoGastos'
import Paginacion from '@/components/dashboard/Paginacion'
import KpiContainer from '../finanzas/KpiContainer'
import InfoTooltip from '../finanzas/InfoTooltip'
import CustomRangePicker from '../finanzas/CustomRangePicker'
import styles from './gastos.module.css'

export const metadata: Metadata = { title: 'Gastos — FiloDesk' }

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

const CATEGORY_TONE: Record<string, {
  card: string
  fill: string
  badge: string
}> = {
  Alquiler:  { card: styles.catCardAlquiler,  fill: styles.catFillAlquiler,  badge: styles.catBadgeAlquiler },
  Productos: { card: styles.catCardProductos, fill: styles.catFillProductos, badge: styles.catBadgeProductos },
  Servicios: { card: styles.catCardServicios, fill: styles.catFillServicios, badge: styles.catBadgeServicios },
  Sueldos:   { card: styles.catCardSueldos,   fill: styles.catFillSueldos,   badge: styles.catBadgeSueldos },
  Otros:     { card: styles.catCardOtros,     fill: styles.catFillOtros,     badge: styles.catBadgeOtros },
}

export default async function GastosPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ p?: string; periodo?: string; desde?: string; hasta?: string }>
}) {
  const { barbershopId } = await params
  const { p = '1', periodo, desde, hasta } = await searchParams
  const PAGE_SIZE = 20
  const page = Math.max(1, Number(p) || 1)

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context || !canAccess(context.role, 'manage_expenses')) {
    redirect(`/dashboard/${barbershopId}`)
  }

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
  const periodDescription = `Mostrando datos del ${formatShortDate(from)} al ${formatShortDate(to)}`

  const [{ data: expenses, count: expenseCount }, { data: allExpenses }] = await Promise.all([
    supabase
      .from('expenses')
      .select('id, description, amount, category, date', { count: 'exact' })
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase
      .from('expenses')
      .select('amount, category, date')
      .eq('barbershop_id', barbershopId)
      .gte('date', from)
      .lte('date', to),
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

  const expensesByCategoryMap: Record<string, Array<{
    id: string
    description: string
    amount: number
    category: string
    date: string
  }>> = {}
  for (const e of expenses ?? []) {
    const key = e.category ?? 'Otros'
    if (!expensesByCategoryMap[key]) expensesByCategoryMap[key] = []
    expensesByCategoryMap[key].push({
      id: e.id,
      description: e.description,
      amount: e.amount ?? 0,
      category: key,
      date: e.date,
    })
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
        <h1 className={styles.title}>Gastos</h1>
        <p className={styles.subtitle}>{periodDescription}</p>
      </div>
      <NuevoGastoForm barbershopId={barbershopId} />

      <div className={styles.periodWrap}>
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

      <KpiContainer
        grid="2x2"
        title="Métricas de Gastos"
        summary={periodDescription}
      >
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>
            <span className={styles.summaryLabelRow}>
              <span>Gasto Total Periodo</span>
              <InfoTooltip
                ariaLabel="Qué significa Gasto Total Periodo"
                content="Suma de todos los egresos cargados dentro del rango seleccionado."
              />
            </span>
          </p>
          <p className={`${styles.summaryValue} ${styles.summaryValueDanger}`}>{formatARS(total)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>
            <span className={styles.summaryLabelRow}>
              <span>Promedio Diario</span>
              <InfoTooltip
                ariaLabel="Qué significa Promedio Diario"
                content="Quemado de caja diario. Fórmula: gasto total del período dividido por días del rango."
              />
            </span>
          </p>
          <p className={styles.summaryValue}>{formatARS(averageDaily)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>
            <span className={styles.summaryLabelRow}>
              <span>Categoría Principal</span>
              <InfoTooltip
                ariaLabel="Qué significa Categoría Principal"
                content="Categoría que más dinero consumió en el período y su monto total."
              />
            </span>
          </p>
          <p className={styles.summaryValue}>{topCategoryEntry ? topCategoryEntry[0] : '—'}</p>
          <p className={styles.summaryMeta}>{topCategoryEntry ? formatARS(topCategoryEntry[1]) : 'Sin datos'}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>
            <span className={styles.summaryLabelRow}>
              <span>Registros</span>
              <InfoTooltip
                ariaLabel="Qué significa Registros"
                content="Cantidad total de gastos cargados dentro del período activo."
              />
            </span>
          </p>
          <p className={styles.summaryValue}>{registros}</p>
        </div>
      </KpiContainer>

      {chartExpenses.length > 0 && (
        <details className={styles.graphPanel}>
          <summary className={styles.graphPanelSummary}>
            <span>Tendencia de Gastos</span>
            <span className={styles.graphPanelChevron} aria-hidden>▾</span>
          </summary>
          <div className={styles.graphPanelBody}>
            <GraficoGastos data={chartExpenses} />
          </div>
        </details>
      )}

      {Object.keys(byCategory).length > 0 && (
        <div className={styles.catGrid}>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
            const tone = CATEGORY_TONE[cat] ?? CATEGORY_TONE.Otros
            const pct = Math.round((amt / (total || 1)) * 100)
            return (
              <div key={cat} className={`${styles.catCard} ${tone.card}`}>
                <p className={styles.catName}>
                  <span className={styles.summaryLabelRow}>
                    <span>{cat}</span>
                    <InfoTooltip
                      ariaLabel={`Detalle de la categoría ${cat}`}
                      content={`Esta categoría representa el ${pct}% de tus gastos totales.`}
                    />
                  </span>
                </p>
                <p className={styles.catAmt}>{formatARS(amt)}</p>
                <div className={styles.catBar}>
                  <progress
                    className={`${styles.catBarFill} ${tone.fill}`}
                    value={Math.min(100, pct)}
                    max={100}
                    aria-label={`Participación de ${cat} en gastos`}
                  />
                </div>
                <p className={styles.catPct}>{pct}%</p>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.tableSection}>
        {!expenses || expenses.length === 0 ? (
          <div className={styles.empty}>No hay gastos en el rango seleccionado.</div>
        ) : (
          <div className={styles.categoryGroups}>
            {groupedExpenses.map((group, idx) => {
              const tone = CATEGORY_TONE[group.category] ?? CATEGORY_TONE.Otros
              return (
                <details key={group.category} className={styles.categoryGroup} open={idx === 0}>
                  <summary className={styles.categorySummary}>
                    <span className={styles.categorySummaryLeft}>
                      <span className={`${styles.catBadge} ${tone.badge}`}>{group.category}</span>
                      <span className={styles.categoryCount}>{group.items.length} registro(s)</span>
                    </span>
                    <span className={styles.categorySummaryRight}>
                      <span className={styles.categorySubtotal}>{formatARS(group.subtotal)}</span>
                      <span className={styles.categoryChevron} aria-hidden>▾</span>
                    </span>
                  </summary>
                  <div className={styles.categoryBody}>
                    <div className={styles.categoryHead}>
                      <span>Fecha</span>
                      <span>Descripción</span>
                      <span className={styles.amountHeader}>Monto</span>
                      <span></span>
                    </div>
                    {group.items.map((item) => {
                      const isMajor = item.amount > majorExpenseThreshold
                      return (
                        <div key={item.id} className={`${styles.categoryRow} ${isMajor ? styles.expenseMajorRow : ''}`}>
                          <span className={styles.muted}>{item.date}</span>
                          <span>
                            {item.description}
                            {isMajor && <span className={styles.majorBadge}>Gasto Mayor</span>}
                          </span>
                          <span className={styles.amountValue}>{formatARS(item.amount)}</span>
                          <span className={styles.categoryAction}>
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
