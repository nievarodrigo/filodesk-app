'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import styles from './finanzas.module.css'

type InfoTooltipProps = {
  content: string
  ariaLabel: string
}

export default function InfoTooltip({ content, ariaLabel }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const bubbleId = useId()

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  return (
    <span
      ref={rootRef}
      className={`${styles.infoTooltip} ${open ? styles.infoTooltipOpen : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.infoTooltipButton}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-describedby={bubbleId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <HelpCircle size={14} aria-hidden />
      </button>
      <span id={bubbleId} role="tooltip" className={styles.infoTooltipBubble}>
        {content}
      </span>
    </span>
  )
}
