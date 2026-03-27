import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import * as adminRepo from '@/repositories/admin.repository'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Admin — FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  trial: 'Trial',
  expired: 'Expirado',
}
const STATUS_COLOR: Record<string, string> = {
  active: 'var(--green)',
  trial: 'var(--gold)',
  expired: 'var(--red, #e05)',
}

export default async function AdminPage() {
  const supabase = createServiceClient()
  const now = new Date()

  const [stats, recentClients, monthExpenses] = await Promise.all([
    adminRepo.getSubscriptionStats(supabase),
    adminRepo.getRecentClients(supabase, 10),
    adminRepo.getExpensesForMonth(supabase, now.getFullYear(), now.getMonth() + 1),
  ])

  // Métricas de clientes
  const total = stats.length
  const activos = stats.filter(s => s.subscription_status === 'active').length
  const trialActivo = stats.filter(s => {
    if (s.subscription_status !== 'trial') return false
    const ends = s.trial_ends_at ? new Date(s.trial_ends_at) : new Date(0)
    return ends >= now
  }).length
  const trialVencido = stats.filter(s => {
    if (s.subscription_status !== 'trial') return false
    const ends = s.trial_ends_at ? new Date(s.trial_ends_at) : new Date(0)
    return ends < now
  }).length
  const expirados = stats.filter(s => s.subscription_status === 'expired').length

  // Métricas financieras
  const mrr = stats
    .filter(s => s.subscription_status === 'active')
    .reduce((sum, s) => sum + (s.subscription_amount ?? 11999), 0)
  const arr = mrr * 12
  const conversionRate = total > 0 ? Math.round((activos / total) * 100) : 0

  const gastosMes = monthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const gananciaNeta = mrr - gastosMes

  // Nuevos clientes por mes (últimos 6 meses)
  const monthlyGrowth: { label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    const count = stats.filter(s => {
      const created = new Date(s.created_at)
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth()
    }).length
    monthlyGrowth.push({ label, count })
  }
  const maxGrowth = Math.max(...monthlyGrowth.map(m => m.count), 1)

  const kpisClientes = [
    { label: 'Total registrados', value: total.toString(), color: 'var(--cream)' },
    { label: 'Activos (pagos)', value: activos.toString(), color: 'var(--green)' },
    { label: 'En trial activo', value: trialActivo.toString(), color: 'var(--gold)' },
    { label: 'Trial vencido', value: trialVencido.toString(), color: 'var(--muted)' },
    { label: 'Expirados', value: expirados.toString(), color: 'var(--red, #e05)' },
    { label: 'Conversión', value: `${conversionRate}%`, color: conversionRate >= 20 ? 'var(--green)' : 'var(--gold)' },
  ]

  const kpisFinanzas = [
    { label: 'MRR', value: formatARS(mrr), color: 'var(--green)' },
    { label: 'ARR estimado', value: formatARS(arr), color: 'var(--green)' },
    { label: 'Gastos del mes', value: formatARS(gastosMes), color: 'var(--red, #e05)' },
    { label: 'Ganancia neta', value: formatARS(gananciaNeta), color: gananciaNeta >= 0 ? 'var(--green)' : 'var(--red, #e05)' },
  ]

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Clientes */}
      <p className={styles.sectionLabel}>Clientes</p>
      <div className={styles.kpis6}>
        {kpisClientes.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Finanzas */}
      <p className={styles.sectionLabel}>Finanzas</p>
      <div className={styles.kpis4}>
        {kpisFinanzas.map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiValue} style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>
        {/* Crecimiento */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Nuevos clientes por mes</p>
          <div className={styles.barChart}>
            {monthlyGrowth.map(m => (
              <div key={m.label} className={styles.barCol}>
                <span className={styles.barValue}>{m.count}</span>
                <div
                  className={styles.bar}
                  style={{ height: `${Math.round((m.count / maxGrowth) * 100)}%` }}
                />
                <span className={styles.barLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gastos del mes */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>Gastos — {now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</p>
            <a href="/admin/gastos" className={styles.cardLink}>Ver todos</a>
          </div>
          {monthExpenses.length === 0 ? (
            <p className={styles.empty}>Sin gastos este mes</p>
          ) : (
            <div className={styles.expenseList}>
              {monthExpenses.map((e: any) => (
                <div key={e.id} className={styles.expenseRow}>
                  <div>
                    <span className={styles.expenseDesc}>{e.description}</span>
                    <span className={styles.expenseCat}>{e.category}</span>
                  </div>
                  <span className={styles.expenseAmount}>{formatARS(e.amount)}</span>
                </div>
              ))}
              <div className={styles.expenseTotal}>
                <span>Total</span>
                <span>{formatARS(gastosMes)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Últimos clientes */}
      <div className={styles.card} style={{ marginTop: 24 }}>
        <div className={styles.cardHeader}>
          <p className={styles.cardTitle}>Últimos clientes</p>
          <a href="/admin/clientes" className={styles.cardLink}>Ver todos</a>
        </div>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Barbería</span>
            <span>Estado</span>
            <span>Registrado</span>
            <span>Suscripto</span>
            <span>Renueva</span>
            <span>Monto</span>
          </div>
          {recentClients.map((c: any) => (
            <div key={c.id} className={styles.tableRow}>
              <span className={styles.clientName}>{c.name}</span>
              <span style={{ color: STATUS_COLOR[c.subscription_status] ?? 'var(--muted)' }}>
                {STATUS_LABEL[c.subscription_status] ?? c.subscription_status}
              </span>
              <span className={styles.muted}>{formatDate(c.created_at)}</span>
              <span className={styles.muted}>{formatDate(c.subscription_starts_at)}</span>
              <span className={styles.muted}>{formatDate(c.subscription_renews_at)}</span>
              <span className={styles.muted}>{c.subscription_amount ? formatARS(c.subscription_amount) : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
