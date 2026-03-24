import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Verificar que la barbería le pertenece al usuario
  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('*')
    .eq('id', barbershopId)
    .eq('owner_id', user.id)
    .single()

  if (!barbershop) redirect('/dashboard')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      color: 'var(--text)',
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: 3 }}>
        ✦ FiloDesk
      </div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--cream)' }}>
        {barbershop.name}
      </h1>
      {barbershop.address && (
        <p style={{ fontSize: '.9rem', color: 'var(--muted)' }}>{barbershop.address}</p>
      )}
      <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: 8 }}>
        El dashboard completo viene pronto 🚀
      </p>
    </div>
  )
}
