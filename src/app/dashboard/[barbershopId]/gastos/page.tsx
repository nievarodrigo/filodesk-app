import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { today as todayAR, currentYM } from '@/lib/date'
import NuevoGastoForm from './NuevoGastoForm'
import DeleteGastoButton from './DeleteGastoButton'
import GraficoGastos from './GraficoGastos'
import Paginacion from '@/components/dashboard/Paginacion'
import styles from './gastos.module.css'

export const metadata: Metadata = { title: 'Gastos — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

const CATEGORY_COLORS: Record<string, string> = {
  Alquiler:  'var(--gold)',
  Productos: '#5ecf87',
  Servicios: '#7eb8f7',
  Sueldos:   '#e07070',
  Otros:     'var(--muted)',
}

export default async function GastosPage({
  params,
  searchParams,
}: {
  params: Promise<{ barbershopId: string }>
  searchParams: Promise<{ mes?: string; p?: string }>
}) {
  const { barbershopId } = await params
  const { mes, p = '1' } = await searchParams
  const PAGE_SIZE = 20
  const page = Math.max(1, Number(p) || 1)

  const ym  = mes ?? currentYM()
  const from = `${ym}-01`
  const [y, m] = ym.split('-').map(Number)
  const to = `${y}-${String(m).padStart(2,'0')}-${new Date(y, m, 0).getDate()}`

  const supabase = await createClient()
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

  // Chart data: flat list of { fecha, amount, category }
  const chartExpenses = (allExpenses ?? []).map(e => ({
    fecha:    (e as any).date ?? '',
    amount:   e.amount ?? 0,
    category: e.category ?? 'Otros',
  })).filter(e => e.fecha)

  // Agrupado por categoría
  const byCategory: Record<string, number> = {}
  for (const e of allExpenses ?? []) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
  }

  // Meses para navegación
  const [curY, curM] = currentYM().split('-').map(Number)
  const months: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(curY, curM - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Gastos</h1>
      </div>
      <NuevoGastoForm barbershopId={barbershopId} />

      {/* Selector de mes */}
      <div className={styles.monthNav}>
        {months.map(mo => (
          <a key={mo} href={`?mes=${mo}`} className={mo === ym ? styles.monthActive : styles.monthTab}>
            {monthLabel(mo)}
          </a>
        ))}
      </div>

      {/* Resumen */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total del mes</p>
          <p className={styles.summaryValue} style={{ color: 'var(--red)' }}>{formatARS(total)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Gastos registrados</p>
          <p className={styles.summaryValue}>{(expenses ?? []).length}</p>
        </div>
      </div>

      {/* Gráfico */}
      {chartExpenses.length > 0 && <GraficoGastos data={chartExpenses} />}

      {/* Por categoría */}
      {Object.keys(byCategory).length > 0 && (
        <div className={styles.catGrid}>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className={styles.catCard} style={{ borderTopColor: CATEGORY_COLORS[cat] ?? 'var(--muted)' }}>
              <p className={styles.catName}>{cat}</p>
              <p className={styles.catAmt}>{formatARS(amt)}</p>
              <div className={styles.catBar}>
                <div className={styles.catBarFill} style={{ width: `${Math.round(amt / total * 100)}%`, background: CATEGORY_COLORS[cat] ?? 'var(--muted)' }} />
              </div>
              <p className={styles.catPct}>{Math.round(amt / total * 100)}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className={styles.tableSection}>
        {!expenses || expenses.length === 0 ? (
          <div className={styles.empty}>No hay gastos en {monthLabel(ym)}.</div>
        ) : (
          <div className={styles.table} style={{ marginBottom: 0 }}>
            <div className={styles.tableHead}>
              <span>Fecha</span>
              <span>Descripción</span>
              <span>Categoría</span>
              <span style={{ textAlign: 'right' }}>Monto</span>
              <span></span>
            </div>
            {(expenses ?? []).map(e => (
              <div key={e.id} className={styles.tableRow}>
                <span className={styles.muted}>{e.date}</span>
                <span>{e.description}</span>
                <span>
                  <span className={styles.catBadge} style={{ color: CATEGORY_COLORS[e.category] ?? 'var(--muted)', borderColor: CATEGORY_COLORS[e.category] ?? 'var(--muted)' }}>
                    {e.category}
                  </span>
                </span>
                <span style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>{formatARS(e.amount)}</span>
                <DeleteGastoButton barbershopId={barbershopId} id={e.id} />
              </div>
            ))}
          </div>
        )}
        <Paginacion current={page} total={totalPages} baseHref={`?mes=${ym}`} />
      </div>
    </div>
  )
}
