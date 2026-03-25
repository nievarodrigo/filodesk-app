import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import styles from './layout.module.css'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id, name')
    .eq('id', barbershopId)
    .eq('owner_id', user.id)
    .single()

  if (!barbershop) redirect('/dashboard')

  return (
    <div className={styles.shell}>
      <Sidebar barbershopId={barbershopId} barbershopName={barbershop.name} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
