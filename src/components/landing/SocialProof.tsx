'use client'

import { useEffect, useRef, useState, type TouchEvent } from 'react'
import styles from './landing.module.css'

const TRUST_ITEMS = [
  {
    title: 'Pensado para barberías de Argentina',
    desc: 'Flujos y lenguaje hechos para el día a día de barberías en CABA, GBA y todo el país.',
  },
  {
    title: 'Acompañamiento real por WhatsApp',
    desc: 'No te dejamos solo: te ayudamos a configurar y arrancar desde el primer día.',
  },
  {
    title: 'Casos y métricas públicas en camino',
    desc: 'Estamos preparando testimonios, casos reales y métricas de uso para esta sección.',
  },
]

const INTERVAL_MS = 5000
const SWIPE_THRESHOLD = 40

export default function SocialProof() {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % TRUST_ITEMS.length)
    }, INTERVAL_MS)
  }

  const goTo = (idx: number) => {
    setCurrent(idx)
    start()
  }

  const goNext = () => {
    setCurrent((c) => (c + 1) % TRUST_ITEMS.length)
    start()
  }

  const goPrev = () => {
    setCurrent((c) => (c - 1 + TRUST_ITEMS.length) % TRUST_ITEMS.length)
    start()
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    start()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isMobile])

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!isMobile || touchStartX.current === null) return

    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    if (delta < 0) goNext()
    else goPrev()
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>Confianza</div>
      <div className={styles.sectionTitle}>
        Construido junto a <span className={styles.trustHighlight}>dueños</span> de barberías
      </div>
      <div className={styles.sectionSub}>Producto simple, soporte humano y foco total en resultados reales.</div>

      <div className={styles.trustGrid}>
        {TRUST_ITEMS.map((item) => (
          <article key={item.title} className={styles.trustCard}>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </article>
        ))}
      </div>

      <div className={styles.trustCarouselMobile}>
        <div
          className={styles.trustViewport}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className={styles.trustTrack} style={{ transform: `translateX(-${current * 100}%)` }}>
            {TRUST_ITEMS.map((item) => (
              <article key={item.title} className={styles.trustSlide}>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.trustDots}>
          {TRUST_ITEMS.map((item, idx) => (
            <button
              key={item.title}
              type="button"
              className={`${styles.trustDotBtn} ${idx === current ? styles.trustDotBtnActive : ''}`}
              onClick={() => goTo(idx)}
              aria-label={`Ir a tarjeta ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
