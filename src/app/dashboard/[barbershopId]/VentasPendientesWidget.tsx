import { createClient } from '@/lib/supabase/server'
import { approveVenta, deleteVenta } from '@/app/actions/venta'

interface Props {
  barbershopId: string
  role: 'owner' | 'manager' | 'barber'
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function VentasPendientesWidget({ barbershopId, role }: Props) {
  if (role === 'barber') return null

  const supabase = await createClient()
  const { data: pendingSales } = await supabase
    .from('sales')
    .select('id, amount, created_at, barbers(name), service_types(name)')
    .eq('barbershop_id', barbershopId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(6)

  const pendingCount = pendingSales?.length ?? 0
  if (pendingCount === 0) return null

  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid rgba(212, 168, 42, 0.22)',
        borderLeft: '4px solid var(--gold)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cream)' }}>
          Tenés {pendingCount} ventas por confirmar
        </h2>
        <p style={{ fontSize: '.84rem', color: 'var(--muted)' }}>
          Aprobá o rechazá los registros pendientes antes de que impacten en finanzas y nóminas.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(pendingSales ?? []).map((sale) => {
          const b = sale.barbers as { name: string } | { name: string }[] | null
          const st = sale.service_types as { name: string } | { name: string }[] | null
          const barberName = (Array.isArray(b) ? b[0]?.name : b?.name) ?? 'Barbero'
          const serviceName = (Array.isArray(st) ? st[0]?.name : st?.name) ?? 'Servicio'

          return (
            <div
              key={sale.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--card)',
                border: '1px solid var(--border)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: '.9rem', color: 'var(--cream)', fontWeight: 600 }}>
                  {barberName ?? 'Barbero'} - {serviceName ?? 'Servicio'}
                </p>
                <p style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                  {formatARS(sale.amount ?? 0)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <form action={async () => {
                  'use server'
                  await approveVenta(barbershopId, sale.id)
                }}>
                  <button
                    type="submit"
                    style={{
                      minHeight: 44,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(94, 207, 135, 0.32)',
                      background: 'rgba(94, 207, 135, 0.12)',
                      color: 'var(--green)',
                      fontSize: '.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Aprobar ✓
                  </button>
                </form>

                <form action={async () => {
                  'use server'
                  await deleteVenta(barbershopId, sale.id)
                }}>
                  <button
                    type="submit"
                    style={{
                      minHeight: 44,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(224, 112, 112, 0.26)',
                      background: 'rgba(224, 112, 112, 0.1)',
                      color: 'var(--red)',
                      fontSize: '.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Rechazar
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
