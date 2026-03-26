import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createMPSubscription } from '@/app/actions/subscription'

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
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '40px 36px', maxWidth: 440, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem' }}>✂️</div>

        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>
            {barbershop.subscription_status === 'trial'
              ? 'Tu período de prueba terminó'
              : 'Suscripción vencida'}
          </h1>
          <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            {trialEnd
              ? `Tu prueba gratuita venció el ${trialEnd}.`
              : 'Tu suscripción está vencida.'
            }{' '}
            Suscribite para seguir usando FiloDesk en <strong style={{ color: 'var(--cream)' }}>{barbershop.name}</strong>.
          </p>
        </div>

        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 20px',
        }}>
          <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 6 }}>Plan Base</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>
            $11.999 <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)' }}>ARS/mes</span>
          </p>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 6 }}>Cancelás cuando querés</p>
        </div>

        <form action={action}>
          <button
            type="submit"
            style={{
              width: '100%', background: 'var(--gold)', color: 'var(--bg)',
              border: 'none', borderRadius: 10, padding: '14px 24px',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Suscribirme con Mercado Pago
          </button>
        </form>

        <p style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
          Pagás con tarjeta de crédito, débito o transferencia
        </p>
      </div>
    </div>
  )
}
