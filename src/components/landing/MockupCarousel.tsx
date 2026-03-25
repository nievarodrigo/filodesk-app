'use client'

import { useState, useEffect, useRef } from 'react'
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

type ViewMode = 'desktop' | 'mobile'

export default function MockupCarousel() {
  const [current, setCurrent] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Default según el dispositivo del visitante
  useEffect(() => {
    if (window.innerWidth < 768) setViewMode('mobile')
  }, [])

  function start() {
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length)
    }, INTERVAL_MS)
  }

  function resetTo(i: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrent(i)
    start()
  }

  useEffect(() => {
    start()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const isMobile = viewMode === 'mobile'

  return (
    <section className={styles.section}>
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{ transform: `translateX(-${current * 100}vw)` }}
        >
          {SLIDES.map((s, i) => (
            <div key={i} className={`${styles.slide} ${isMobile ? styles.slideMobile : ''}`}>

              <div className={styles.copy}>
                <span className={styles.tag}>{s.tag}</span>
                <h2
                  className={styles.title}
                  dangerouslySetInnerHTML={{ __html: s.titleHtml }}
                />
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

      {/* Toggle + dots */}
      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${!isMobile ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('desktop')}
            title="Vista escritorio"
          >
            🖥
          </button>
          <button
            className={`${styles.toggleBtn} ${isMobile ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('mobile')}
            title="Vista celular"
          >
            📱
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
