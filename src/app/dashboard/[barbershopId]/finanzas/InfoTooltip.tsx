'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import styles from './finanzas.module.css'

type InfoTooltipProps = {
  content: string
  ariaLabel: string
}

export default function InfoTooltip({ content, ariaLabel }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const bubbleId = useId()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobile(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

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
      onMouseEnter={() => {
        if (!isMobile) setOpen(true)
      }}
      onMouseLeave={() => {
        if (!isMobile) setOpen(false)
      }}
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
      {isMobile && open && (
        <button
          type="button"
          className={styles.infoTooltipBackdrop}
          aria-label="Cerrar ayuda"
          onClick={() => setOpen(false)}
        />
      )}
      <span
        id={bubbleId}
        role="tooltip"
        className={`${styles.infoTooltipBubble} ${isMobile ? styles.infoTooltipBubbleMobile : ''}`}
      >
        {isMobile && (
          <span className={styles.infoTooltipMobileHeader}>
            <span className={styles.infoTooltipMobileTitle}>Ayuda</span>
            <button
              type="button"
              className={styles.infoTooltipClose}
              aria-label="Cerrar ayuda"
              onClick={(event) => {
                event.stopPropagation()
                setOpen(false)
              }}
            >
              <X size={14} aria-hidden />
            </button>
          </span>
        )}
        <span>{content}</span>
      </span>
    </span>
  )
}
