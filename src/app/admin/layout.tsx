import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import * as adminRepo from '@/repositories/admin.repository'
import styles from './layout.module.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceClient = createServiceClient()
  const isAdmin = await adminRepo.isAdminEmail(serviceClient, user.email!)
  if (!isAdmin) redirect('/')

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <span className={styles.brand}>FiloDesk <span className={styles.badge}>Admin</span></span>
        <div className={styles.links}>
          <a href="/admin" className={styles.link}>Dashboard</a>
          <a href="/admin/gastos" className={styles.link}>Gastos</a>
          <a href="/admin/clientes" className={styles.link}>Clientes</a>
        </div>
        <span className={styles.email}>{user.email}</span>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
