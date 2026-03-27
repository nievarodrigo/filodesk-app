import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string; status?: string }>
}) {
  const { barbershopId: rawBarbershopId, status: paymentStatus } = await searchParams
  const barbershopId = rawBarbershopId?.split('?')[0]

  if (barbershopId && paymentStatus === 'approved') {
    const supabase = createServiceClient()
    await subscriptionService.activateOneMonthPayment(supabase, barbershopId)
  }

  const approved = paymentStatus === 'approved'

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
        {approved ? (
          <>
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>
              ¡Pago acreditado!
            </h1>
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Tu acceso a FiloDesk está activo por 30 días. Cuando se venza, podés renovarlo o activar el débito automático.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>
              Pago pendiente
            </h1>
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Tu pago está siendo procesado. Puede tardar unos minutos en acreditarse.
            </p>
          </>
        )}
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
