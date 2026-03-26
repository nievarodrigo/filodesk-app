import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createMPSubscription } from '@/app/actions/subscription'
import Image from 'next/image'

const plans = [
  {
    name: 'Base',
    price: '$11.999',
    period: 'ARS/mes',
    features: ['Barberos ilimitados', 'Comisiones automáticas', 'Ganancia neta en tiempo real', 'Control de stock y gastos'],
    available: true,
  },
  {
    name: 'Pro',
    price: '$19.999',
    period: 'ARS/mes',
    features: ['Todo lo del plan Base', 'Roles: Dueño, Encargado, Barbero', 'Historial completo', 'Reportes exportables'],
    available: false,
  },
  {
    name: 'Premium IA',
    price: '$29.999',
    period: 'ARS/mes',
    features: ['Todo lo del plan Pro', 'Predicción de demanda', 'Alertas de ingresos', 'Asistente IA'],
    available: false,
  },
]

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string }>
}) {
  const { barbershopId } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  if (!barbershopId) redirect('/dashboard')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('name, subscription_status, trial_ends_at')
    .eq('id', barbershopId)
    .single()

  if (!barbershop) redirect('/dashboard')
  if (barbershop.subscription_status === 'active') redirect(`/dashboard/${barbershopId}`)

  const trialEnd = barbershop.trial_ends_at
    ? new Date(barbershop.trial_ends_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    : null

  const action = createMPSubscription.bind(null, barbershopId)

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '32px 20px', gap: 32,
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <Image src="/logo-dark.png"  alt="FiloDesk" width={100} height={100} className="logo-dark"  style={{ borderRadius: 16 }} />
          <Image src="/logo-light.png" alt="FiloDesk" width={100} height={100} className="logo-light" style={{ borderRadius: 16 }} />
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>
          {barbershop.subscription_status === 'trial' ? 'Tu período de prueba terminó' : 'Suscripción vencida'}
        </h1>
        <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6, maxWidth: 420 }}>
          {trialEnd ? `Tu prueba gratuita venció el ${trialEnd}.` : 'Tu suscripción está vencida.'}{' '}
          Elegí un plan para seguir usando FiloDesk en <strong style={{ color: 'var(--cream)' }}>{barbershop.name}</strong>.
        </p>
      </div>

      {/* Planes */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        width: '100%', maxWidth: 860,
      }}>
        {plans.map((plan) => (
          <div key={plan.name} style={{
            background: 'var(--surface)', border: `1px solid ${plan.available ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: 14, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16,
            opacity: plan.available ? 1 : 0.6, position: 'relative',
          }}>
            {plan.available && (
              <div style={{
                position: 'absolute', top: -1, left: -1, right: -1, height: 3,
                background: 'var(--gold)', borderRadius: '14px 14px 0 0',
              }} />
            )}
            {!plan.available && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '2px 10px',
                fontSize: '.68rem', fontWeight: 700, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.5px',
              }}>
                Próximamente
              </div>
            )}

            <div>
              <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: plan.available ? 'var(--gold)' : 'var(--muted)', marginBottom: 6 }}>
                {plan.name}
              </p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>
                {plan.price} <span style={{ fontSize: '.85rem', fontWeight: 400, color: 'var(--muted)' }}>{plan.period}</span>
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: '.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: plan.available ? 'var(--gold)' : 'var(--border)', flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.available ? (
              <form action={action}>
                <button type="submit" style={{
                  width: '100%', background: 'var(--gold)', color: 'var(--bg)',
                  border: 'none', borderRadius: 8, padding: '11px 20px',
                  fontSize: '.9rem', fontWeight: 700, cursor: 'pointer',
                }}>
                  Suscribirme
                </button>
              </form>
            ) : (
              <button disabled style={{
                width: '100%', background: 'transparent', color: 'var(--muted)',
                border: '1px solid var(--border)', borderRadius: 8, padding: '11px 20px',
                fontSize: '.9rem', fontWeight: 600, cursor: 'not-allowed',
              }}>
                Próximamente
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Métodos de pago */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 4 }}>
          Procesado por Mercado Pago — aceptamos:
        </p>
        <p style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 500 }}>
          Tarjeta de crédito · Tarjeta de débito · Lemon · Naranja X · Transferencia bancaria
        </p>
        <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 6 }}>
          No necesitás tener cuenta en Mercado Pago
        </p>
      </div>

    </div>
  )
}
