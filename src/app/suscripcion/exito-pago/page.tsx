import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import * as subscriptionService from '@/services/subscription.service'

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string; status?: string; payment_id?: string; external_reference?: string }>
}) {
  const { barbershopId: rawBarbershopId, status: paymentStatus, payment_id: paymentId, external_reference: externalRef } = await searchParams
  // barbershopId puede venir en la URL o extraerse del external_reference ("barbershopId:intentId")
  const barbershopId = rawBarbershopId?.split('?')[0] ?? externalRef?.split(':')[0]

  let approved = false
  const supabase = createServiceClient()

  // SECURITY: Verificar el pago real contra MercadoPago con idempotencia garantizada
  // MP redirige con: payment_id + external_reference (que incluye intentId)
  if (barbershopId && paymentStatus === 'approved' && paymentId && externalRef) {
    // Parsear external_reference = "barbershopId:intentId"
    const [refBarbershop, intentId] = externalRef.split(':')

    // Validar que el external_reference coincide
    if (refBarbershop !== barbershopId || !intentId) {
      console.warn('[exito-pago] malformed external_reference:', externalRef)
      approved = false
    } else {
      // Verificar contra MP y nuestra BD
      const verification = await subscriptionService.verifyCheckoutPayment(
        supabase,
        paymentId,
        intentId,
        barbershopId
      )

      if (verification.error) {
        console.warn('[exito-pago] payment verification failed:', verification.error)
        approved = false
      } else {
        // Pago verificado exitosamente — activar suscripción
        await subscriptionService.activatePayment(supabase, barbershopId, verification.months, verification.planId)
        approved = true
      }
    }
  } else if (barbershopId && paymentStatus === 'approved') {
    // Intento incompleto: falta payment_id o external_reference
    console.warn('[exito-pago] rejected: incompleto (falta payment_id o external_reference)')
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
        {approved ? (
          <>
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>
              ¡Pago acreditado!
            </h1>
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Tu acceso a FiloDesk está activo. Cuando se venza, podés renovarlo o cambiar de plan.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>
              Pago pendiente o inválido
            </h1>
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              No pudimos procesar tu pago. Puede haber un problema con los datos. Intentá de nuevo.
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
