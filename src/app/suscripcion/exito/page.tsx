import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'

export default async function SuscripcionExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string }>
}) {
  const { barbershopId } = await searchParams

  if (barbershopId) {
    const supabase = await createClient()
    await subscriptionService.activateByBarbershopId(supabase, barbershopId)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '40px 36px', maxWidth: 440, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>
          ¡Suscripción activada!
        </h1>
        <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          Ya podés usar FiloDesk sin límites. El pago se renueva automáticamente cada mes.
        </p>
        <Link
          href={barbershopId ? `/dashboard/${barbershopId}` : '/dashboard'}
          style={{
            background: 'var(--gold)', color: 'var(--bg)', borderRadius: 10,
            padding: '14px 24px', fontWeight: 700, fontSize: '1rem',
            textDecoration: 'none', display: 'block',
          }}
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
