import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { approveSubscription } from '@/app/actions/admin'
import styles from '../clientes/page.module.css'

export const metadata: Metadata = { title: 'Pagos Pendientes — Admin FiloDesk' }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default async function AdminPagosPage() {
  const supabase = createServiceClient()

  // 1. Obtener pagos pendientes de validación
  // Unimos con barbershops para tener el nombre
  const { data: pending, error } = await supabase
    .from('subscriptions')
    .select('*, barbershops(name)')
    .eq('status', 'pending_validation')
    .order('created_at', { ascending: false })

  if (error) return <div>Error cargando pagos: {error.message}</div>

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Pagos Pendientes</h1>
        <div className={styles.summary}>
          <span>{pending?.length || 0} esperando aprobación</span>
          <span className={styles.dot}>·</span>
          <span style={{ color: 'var(--gold)' }}>Transferencias bancarias</span>
        </div>
      </div>

      <div className={styles.card}>
        {(!pending || pending.length === 0) ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
            No hay pagos pendientes de validación. ¡Buen trabajo!
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Barbería</span>
              <span>Monto</span>
              <span>Fecha Solicitud</span>
              <span>Vence</span>
              <span>Método</span>
              <span>Acción</span>
            </div>
            {pending.map((p: any) => (
              <div key={p.id} className={styles.tableRow}>
                <span className={styles.name}>{p.barbershops.name}</span>
                <span style={{ fontWeight: 700, color: 'var(--cream)' }}>{formatARS(p.amount)}</span>
                <span className={styles.muted}>{formatDate(p.created_at)}</span>
                <span className={styles.muted}>{formatDate(p.ends_at)}</span>
                <span style={{ fontSize: '.75rem', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  {p.payment_method === 'bank_transfer' ? 'Transferencia' : p.payment_method}
                </span>
                <span>
                  <form action={async () => {
                    'use server'
                    await approveSubscription(p.id)
                  }}>
                    <button
                      type="submit"
                      style={{
                        background: 'var(--green)',
                        color: '#0e0e0e',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontSize: '.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      Aprobar
                    </button>
                  </form>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
