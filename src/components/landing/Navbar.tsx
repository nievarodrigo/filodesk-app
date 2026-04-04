import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import styles from './landing.module.css'
import UserMenu from './UserMenu'
import MobileNav from './MobileNav'
import { ScissorsIcon } from './LandingIcons'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <MobileNav user={user ? { email: user.email! } : null} />

        <Link href="/" className={styles.logo}>
          <ScissorsIcon size={20} />
          FiloDesk
        </Link>

        <ul className={styles.navLinks}>
          <li><a href="#funciones">Funciones</a></li>
          <li><a href="#precios">Precios</a></li>
          <li><Link href="/nosotros">Nosotros</Link></li>
          <li><Link href="/faq">FAQ</Link></li>
        </ul>

        <div className={styles.navActions}>
          <ThemeToggle />
          {user ? (
            <UserMenu email={user.email!} />
          ) : (
            <>
              <Link href="/auth/login">
                <button className={styles.btnOutline}>Iniciar sesión</button>
              </Link>
              <Link href="/auth/register">
                <button className={styles.btnPrimary}>Empezar gratis</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
