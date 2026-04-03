'use client'

import { useState, useEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { BarbershopRole } from '@/lib/definitions'
import { canAccess } from '@/lib/permissions'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import styles from './sidebar.module.css'

type NavItem = {
  href: string
  label: string
  permission: string
  icon: ReactElement
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        href: '',
        label: 'Inicio',
        permission: 'register_sale',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        ),
      },
      {
        href: '/agenda',
        label: 'Agenda',
        permission: 'register_sale',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Negocio',
    items: [
      {
        href: '/finanzas',
        label: 'Finanzas',
        permission: 'view_finance',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
      {
        href: '/egresos',
        label: 'Egresos',
        permission: 'manage_expenses',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="8" y1="15" x2="16" y2="15"/>
          </svg>
        ),
      },
      {
        href: '/productos',
        label: 'Productos',
        permission: 'manage_inventory',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Equipo',
    items: [
      {
        href: '/barberosyservicios',
        label: 'Barberos y Servicios',
        permission: 'manage_barbers',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
      },
      {
        href: '/equipo',
        label: 'Equipo',
        permission: 'manage_members',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
    ],
  },
]

interface Props {
  barbershopId: string
  barbershopName: string
  role: BarbershopRole
}

export default function Sidebar({ barbershopId, barbershopName, role }: Props) {
  const base = `/dashboard/${barbershopId}`
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const initialRenderRef = useRef(true)

  // Close drawer on route change
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }
    // Use setTimeout to defer setState - prevents cascading render warning
    const timer = setTimeout(() => { setOpen(false) }, 0)
    return () => clearTimeout(timer)
  }, [pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function isActive(href: string) {
    const full = `${base}${href}`
    if (href === '') return pathname === full
    return pathname.startsWith(full)
  }

  const navContent = (
    <>
      <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Logo size={22} />
        FiloDesk
      </div>
      <div className={styles.shopName}>{barbershopName}</div>

      <nav className={styles.nav}>
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(({ permission }) => canAccess(role, permission))
          if (visibleItems.length === 0) return null
          return (
            <div key={gi} className={styles.navGroup}>
              {group.label && (
                <p className={styles.navGroupHeader}>{group.label}</p>
              )}
              {visibleItems.map(({ href, label, icon }) => (
                <Link
                  key={label}
                  href={`${base}${href}`}
                  className={`${styles.navLink} ${isActive(href) ? styles.navLinkActive : ''}`}
                >
                  <span className={styles.navIcon}>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          )
        })}
      </nav>

      <div className={styles.bottom}>
        {canAccess(role, 'change_plan') && (
          <Link
            href={`${base}/configuracion`}
            className={`${styles.navLink} ${isActive('/configuracion') ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 1-1.82.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            Configuración
          </Link>
        )}
        <ThemeToggle />
        <form action={logout}>
          <button type="submit" className={styles.signout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`${styles.hamburgerLine} ${open ? styles.hamburgerOpen1 : ''}`} />
          <span className={`${styles.hamburgerLine} ${open ? styles.hamburgerOpen2 : ''}`} />
          <span className={`${styles.hamburgerLine} ${open ? styles.hamburgerOpen3 : ''}`} />
        </button>
        <div className={styles.mobileTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Logo size={18} />
          FiloDesk
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      {/* Mobile drawer */}
      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
        {navContent}
      </aside>
    </>
  )
}
