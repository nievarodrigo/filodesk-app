'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import styles from './landing.module.css'

export default function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={styles.userMenu}>
      <button
        className={styles.userMenuTrigger}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className={styles.userAvatar}>{email[0].toUpperCase()}</span>
        <span className={styles.userEmail}>{email}</span>
        <span className={styles.userCaret}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.userDropdown}>
          <div className={styles.userDropdownHeader}>{email}</div>
          <Link href="/dashboard" className={styles.userDropdownItem} onClick={() => setOpen(false)}>
            Ir al dashboard
          </Link>
          <div className={styles.userDropdownDivider} />
          <form action={logout}>
            <button type="submit" className={`${styles.userDropdownItem} ${styles.userDropdownItemDanger}`}>
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
