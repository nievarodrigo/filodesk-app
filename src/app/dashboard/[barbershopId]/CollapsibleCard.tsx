'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

interface Props {
  storageKey: string
  title: string
  children: React.ReactNode
  defaultCollapsed?: boolean
  collapseOnMobile?: boolean
}

const STORAGE_PREFIX = 'filodesk:dashboard:collapse:'

export default function CollapsibleCard({
  storageKey,
  title,
  children,
  defaultCollapsed = false,
  collapseOnMobile = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${storageKey}`
    const saved = localStorage.getItem(key)
    if (saved === '1' || saved === '0') {
      setCollapsed(saved === '1')
    } else if (collapseOnMobile && window.matchMedia('(max-width: 768px)').matches) {
      setCollapsed(true)
    }
  }, [storageKey, collapseOnMobile])

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${storageKey}`
    localStorage.setItem(key, collapsed ? '1' : '0')
  }, [storageKey, collapsed])

  return (
    <section className={styles.collapsibleCard}>
      <button
        type="button"
        className={styles.collapsibleTrigger}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(v => !v)}
      >
        <span>{title}</span>
        <span className={styles.collapsibleIcon} aria-hidden>{collapsed ? '+' : '-'}</span>
      </button>
      <div className={collapsed ? styles.collapsibleBodyHidden : styles.collapsibleBody}>
        {children}
      </div>
    </section>
  )
}
