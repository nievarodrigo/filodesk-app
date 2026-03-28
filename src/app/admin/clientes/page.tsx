import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { type Barbershop } from '@/lib/definitions'
import * as adminRepo from '@/repositories/admin.repository'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Clientes — Admin FiloDesk' }

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
  active: 'Activo', trial: 'Trial', expired: 'Expirado',
}
const STATUS_COLOR: Record<string, string> = {
  active: 'var(--green)', trial: 'var(--gold)', expired: 'var(--red, #e05)',
}

export default async function AdminClientesPage() {
  const supabase = createServiceClient()
  const clients = await adminRepo.getRecentClients(supabase, 200)

  const activos = clients.filter(c => c.subscription_status === 'active').length
  const mrr = clients
    .filter(c => c.subscription_status === 'active')
    .reduce((s, c: Barbershop) => s + ((c.subscription_amount) ?? 11999), 0)

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <div className={styles.summary}>
          <span>{clients.length} registrados</span>
          <span className={styles.dot}>·</span>
          <span style={{ color: 'var(--green)' }}>{activos} activos</span>
          <span className={styles.dot}>·</span>
          <span style={{ color: 'var(--green)' }}>MRR {formatARS(mrr)}</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Barbería</span>
            <span>Estado</span>
            <span>Registrado</span>
            <span>Suscripto</span>
            <span>Renueva</span>
            <span>Método</span>
            <span>Monto</span>
          </div>
          {clients.map((c: Barbershop) => (
            <div key={c.id} className={styles.tableRow}>
              <span className={styles.name}>{c.name}</span>
              <span style={{ color: STATUS_COLOR[c.subscription_status] ?? 'var(--muted)', fontSize: '.82rem', fontWeight: 600 }}>
                {STATUS_LABEL[c.subscription_status] ?? c.subscription_status}
              </span>
              <span className={styles.muted}>{formatDate(c.created_at)}</span>
              <span className={styles.muted}>{formatDate(c.subscription_starts_at)}</span>
              <span className={styles.muted}>{formatDate(c.subscription_renews_at)}</span>
              <span className={styles.muted}>{c.subscription_payment_method ?? '—'}</span>
              <span className={styles.muted}>{c.subscription_amount ? formatARS(c.subscription_amount) : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
