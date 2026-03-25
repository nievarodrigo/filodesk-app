import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Detecta cuántas barberías tiene y redirige
export default async function DashboardRouter() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: true })

  if (!barbershops || barbershops.length === 0) {
    redirect('/onboarding')
  }

  // Por ahora: redirige a la primera barbería
  // Futuro: si tiene más de una, mostrar selector
  redirect(`/dashboard/${barbershops[0].id}`)
}
