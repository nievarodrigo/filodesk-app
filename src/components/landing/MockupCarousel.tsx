'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './mockupCarousel.module.css'

type Slide = {
  image: string
  tag: string
  titleHtml: string
  description: string
  cta: string
  ctaHref: string
}

const SLIDES: Slide[] = [
  {
    image: '/mockups/inicio.png',
    tag: 'Para el dueño',
    titleHtml: 'Potenciá tu <em>barbería</em><br/>con nuestra plataforma.',
    description: 'Gestioná ventas, barberos y servicios en un solo lugar. Aumentá tus ingresos con datos reales.',
    cta: 'Comenzá ahora',
    ctaHref: '/auth/register',
  },
  {
    image: '/mockups/finanzas.png',
    tag: 'Finanzas',
    titleHtml: 'Controlá las <em>finanzas</em><br/>de tu barbería.',
    description: 'Obtené una visión clara de ingresos, gastos y comisiones para hacer crecer tu negocio.',
    cta: 'Probá gratis',
    ctaHref: '/auth/register',
  },
  {
    image: '/mockups/barberos.png',
    tag: 'Barberos',
    titleHtml: 'Medí el <em>rendimiento</em><br/>de cada barbero.',
    description: 'Monitoréa el desempeño y las comisiones de tu equipo de manera precisa y sencilla.',
    cta: 'Optimizá tu equipo',
    ctaHref: '/auth/register',
  },
  {
    image: '/mockups/ventas.png',
    tag: 'Ventas',
    titleHtml: 'Aumentá las <em>ventas</em><br/>de tu barbería.',
    description: 'Registrá servicios y productos en segundos. Controlá cada ingreso desde el celular.',
    cta: 'Empezá a vender más',
    ctaHref: '/auth/register',
  },
]

const INTERVAL_MS = 8000

export default function MockupCarousel() {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const closeLightbox = useCallback(() => setLightbox(null), [])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, closeLightbox])

  return (
    <>
      <section className={styles.section}>
        <div className={styles.viewport}>
          <div
            className={styles.track}
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <div key={i} className={styles.slide}>

                {/* Copy */}
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

                {/* Device frame */}
                <div className={styles.deviceWrap}>
                  <div className={styles.device}>
                    <div className={styles.deviceBar}>
                      <div className={`${styles.dot} ${styles.dotRed}`} />
                      <div className={`${styles.dot} ${styles.dotYellow}`} />
                      <div className={`${styles.dot} ${styles.dotGreen}`} />
                    </div>
                    <button
                      className={styles.screen}
                      onClick={() => setLightbox(s.image)}
                      aria-label="Ver pantalla completa"
                    >
                      <Image
                        src={s.image}
                        alt={s.tag}
                        fill
                        sizes="(max-width: 768px) 100vw, 55vw"
                        className={styles.img}
                        priority={i === 0}
                      />
                      <span className={styles.zoomHint}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                        Ver más
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
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
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lbOverlay} onClick={closeLightbox}>
          <div className={styles.lbContent} onClick={e => e.stopPropagation()}>
            <button className={styles.lbClose} onClick={closeLightbox} aria-label="Cerrar">✕</button>
            <div className={styles.lbImgWrap}>
              <Image
                src={lightbox}
                alt="Vista completa"
                fill
                sizes="90vw"
                className={styles.lbImg}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
