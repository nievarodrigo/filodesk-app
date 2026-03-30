'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import ThemeToggle from '@/components/ui/ThemeToggle'
import styles from './landing.module.css'

type Props = {
  user: { email: string } | null
}

export default function MobileNav({ user }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(prev => !prev)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
      >
        <span className={`${styles.hamburgerLine} ${open ? styles.hamburgerLineTop : ''}`} />
        <span className={`${styles.hamburgerLine} ${open ? styles.hamburgerLineMid : ''}`} />
        <span className={`${styles.hamburgerLine} ${open ? styles.hamburgerLineBot : ''}`} />
      </button>

      {open && (
        <div className={styles.mobileOverlay} onClick={() => setOpen(false)}>
          <div className={styles.mobileDrawer} onClick={e => e.stopPropagation()}>
            <nav className={styles.mobileLinks}>
              <Link href="/#features" onClick={() => setOpen(false)}>Funciones</Link>
              <Link href="/#precio" onClick={() => setOpen(false)}>Precio</Link>
              <Link href="/nosotros" onClick={() => setOpen(false)}>Nosotros</Link>
              <Link href="/faq" onClick={() => setOpen(false)}>Preguntas frecuentes</Link>
            </nav>

            <div className={styles.mobileDivider} />

            <ThemeToggle />

            <div className={styles.mobileDivider} />

            {user ? (
              <div className={styles.mobileAuth}>
                <span className={styles.mobileEmail}>{user.email}</span>
                <Link href="/dashboard" onClick={() => setOpen(false)} className={styles.mobileAuthBtn}>
                  Dashboard
                </Link>
                <form action={logout}>
                  <button type="submit" className={`${styles.mobileAuthBtn} ${styles.mobileAuthBtnDanger}`}>
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <div className={styles.mobileAuth}>
                <Link href="/auth/login" onClick={() => setOpen(false)} className={styles.mobileAuthBtn}>
                  Iniciar sesión
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)} className={`${styles.mobileAuthBtn} ${styles.mobileAuthBtnPrimary}`}>
                  Crear cuenta gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
