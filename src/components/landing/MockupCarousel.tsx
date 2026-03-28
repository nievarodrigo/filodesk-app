'use client'

import { useState, useEffect, useRef, type TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './mockupCarousel.module.css'

type Slide = {
  imageDesktop: string
  imageMobile: string
  tag: string
  titleHtml: string
  description: string
  cta: string
  ctaHref: string
}

const SLIDES: Slide[] = [
  {
    imageDesktop: '/mockups/inicio.png',
    imageMobile: '/mockups/mobile/inicio.png',
    tag: 'Inicio',
    titleHtml: 'Registrá ventas y controlá<br/>tu <em>día en tiempo real</em>.',
    description: 'Ves los ingresos del día, las ventas de cada barbero y el estado de tu barbería desde la pantalla principal.',
    cta: 'Comenzá ahora',
    ctaHref: '/auth/register',
  },
  {
    imageDesktop: '/mockups/finanzas.png',
    imageMobile: '/mockups/mobile/finanzas.png',
    tag: 'Finanzas',
    titleHtml: 'Controlá las <em>finanzas</em><br/>de tu barbería.',
    description: 'Ingresos, gastos, comisiones y ganancia neta de cada mes. Todo calculado automáticamente, sin fórmulas.',
    cta: 'Probá gratis',
    ctaHref: '/auth/register',
  },
  {
    imageDesktop: '/mockups/ventas.png',
    imageMobile: '/mockups/mobile/ventas.png',
    tag: 'Ventas',
    titleHtml: 'Aumentá las <em>ventas</em><br/>de tu barbería.',
    description: 'Registrá servicios y productos en segundos. Analizá tendencias y compará períodos fácilmente.',
    cta: 'Empezá a vender más',
    ctaHref: '/auth/register',
  },
  {
    imageDesktop: '/mockups/barberos.png',
    imageMobile: '/mockups/mobile/barberos.png',
    tag: 'Equipo',
    titleHtml: 'Configurá tu <em>equipo</em><br/>y sus comisiones.',
    description: 'Agregá barberos, establecé sus porcentajes y gestioná los servicios que ofrece tu barbería.',
    cta: 'Administrá tu equipo',
    ctaHref: '/auth/register',
  },
  {
    imageDesktop: '/mockups/gastos.png',
    imageMobile: '/mockups/mobile/gastos.png',
    tag: 'Gastos',
    titleHtml: 'Controlá cada <em>gasto</em><br/>del local.',
    description: 'Registrá alquiler, productos, sueldos y más. Sabé exactamente cuánto te cuesta mantener la barbería.',
    cta: 'Controlá tus gastos',
    ctaHref: '/auth/register',
  },
]

const INTERVAL_MS = 8000
const SWIPE_THRESHOLD = 40
const MOBILE_BREAKPOINT = 860

type ViewMode = 'desktop' | 'mobile'

export default function MockupCarousel() {
  const [current, setCurrent] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT) {
      return 'mobile'
    }
    return 'desktop'
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)

  function start() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length)
    }, INTERVAL_MS)
  }

  function goNext() {
    setCurrent((c) => (c + 1) % SLIDES.length)
    start()
  }

  function goPrev() {
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)
    start()
  }

  function resetTo(i: number) {
    setCurrent(i)
    start()
  }

  useEffect(() => {
    start()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const isMobile = viewMode === 'mobile'

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return
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
      <div className={styles.viewport} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className={styles.track} style={{ transform: `translateX(-${current * 100}vw)` }}>
          {SLIDES.map((s, i) => (
            <div key={i} className={`${styles.slide} ${isMobile ? styles.slideMobile : ''}`}>
              <div className={styles.copy}>
                <span className={styles.tag}>{s.tag}</span>
                <h2 className={styles.title} dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
                <p className={styles.desc}>{s.description}</p>
                <Link href={s.ctaHref} className={styles.cta}>
                  {s.cta}
                </Link>
              </div>

              <div className={`${styles.mockupWrap} ${isMobile ? styles.mockupPhone : ''}`}>
                <Image
                  src={isMobile ? s.imageMobile : s.imageDesktop}
                  alt={s.tag}
                  width={isMobile ? 390 : 900}
                  height={isMobile ? 844 : 560}
                  className={styles.mockupImg}
                  priority={i === 0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${!isMobile ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('desktop')}
            title="Vista escritorio"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          <button
            className={`${styles.toggleBtn} ${isMobile ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('mobile')}
            title="Vista celular"
          >
            <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dotBtn} ${i === current ? styles.dotBtnActive : ''}`}
              onClick={() => resetTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
