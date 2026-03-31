import Link from 'next/link'

export const metadata = { title: 'Procesando Pago — FiloDesk' }

export default async function ProcesandoPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string }>
}) {
  const { barbershopId } = await searchParams

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
        <div style={{ fontSize: '3rem' }}>⏳</div>
        
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>
          ¡Recibimos tu pago por GalioPay!
        </h1>
        
        <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          Estamos validando la transacción. En unos minutos tu cuenta estará activa.
        </p>

        <div style={{
          background: 'rgba(212,168,42,0.1)',
          border: '1px solid rgba(212,168,42,0.2)',
          borderRadius: 10,
          padding: '16px',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '.8rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>
            📋 Recordá:
          </p>
          <ul style={{ fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
            <li>La validación puede tardar unos minutos</li>
            <li>Te notificaremos cuando esté confirmado</li>
            <li>Si tenés dudas, escribinos por WhatsApp</li>
          </ul>
        </div>

        <Link
          href={barbershopId ? `/dashboard/${barbershopId}` : '/dashboard'}
          style={{
            background: 'var(--gold)', color: 'var(--bg)', borderRadius: 10,
            padding: '14px 24px', fontWeight: 700, fontSize: '1rem',
            textDecoration: 'none', display: 'block',
          }}
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
