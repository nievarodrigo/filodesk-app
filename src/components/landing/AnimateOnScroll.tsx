'use client'

import { useEffect, useRef } from 'react'
import styles from './landing.module.css'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  style?: React.CSSProperties
}

export default function AnimateOnScroll({ children, className = '', delay = 0, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add(styles.isVisible)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const trigger = () => el.classList.add(styles.isVisible)
          delay ? setTimeout(trigger, delay) : trigger()
          observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`${styles.animFadeUp} ${className}`} style={style}>
      {children}
    </div>
  )
}
