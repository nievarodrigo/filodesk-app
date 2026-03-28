import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function FinanzasRedirectPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: true })

  if (!barbershops || barbershops.length === 0) {
    redirect('/onboarding')
  }

  redirect(`/dashboard/${barbershops[0].id}/finanzas`)
}
