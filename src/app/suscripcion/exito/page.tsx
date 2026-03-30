import Link from 'next/link'

export default async function SuscripcionExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ barbershopId?: string }>
}) {
  const { barbershopId: rawBarbershopId } = await searchParams
  const barbershopId = rawBarbershopId?.split('?')[0]

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
        <div style={{ fontSize: '2.5rem' }}>⌛</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cream)' }}>
          Procesando tu suscripción
        </h1>
        <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          Estamos confirmando tu pago con Mercado Pago. Esto suele tardar unos segundos. 
          Tu cuenta se activará automáticamente.
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
