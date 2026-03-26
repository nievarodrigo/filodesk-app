import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import styles from './landing.module.css'
import UserMenu from './UserMenu'
import MobileNav from './MobileNav'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Image from 'next/image'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  return (
    <nav className={styles.nav}>
      <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 34, height: 34, position: 'relative', flexShrink: 0 }}>
          <Image src="/logo-dark.png"  alt="" fill style={{ objectFit: 'contain', borderRadius: 8 }} className="logo-dark"  sizes="34px" />
          <Image src="/logo-light.png" alt="" fill style={{ objectFit: 'contain', borderRadius: 8 }} className="logo-light" sizes="34px" />
        </div>
        Filo<span>Desk</span>
      </div>

      {/* Desktop links */}
      <ul className={styles.navLinks}>
        <li><a href="#features">Features</a></li>
        <li><a href="#precio">Precio</a></li>
        <li><Link href="/nosotros">Nosotros</Link></li>
        <li><Link href="/faq">FAQ</Link></li>
      </ul>

      {/* Desktop auth */}
      <div className={styles.navAuth}>
        <ThemeToggle />
        {user ? (
          <UserMenu email={user.email!} />
        ) : (
          <>
            <Link href="/auth/login">
              <button className={`${styles.btn} ${styles.btnOutline}`}>Iniciar sesión</button>
            </Link>
            <Link href="/auth/register">
              <button className={styles.btn}>Crear cuenta gratis</button>
            </Link>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <MobileNav user={user ? { email: user.email! } : null} />
    </nav>
  )
}
