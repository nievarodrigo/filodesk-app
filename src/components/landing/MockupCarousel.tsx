'use client'

import { useState, useEffect, useRef } from 'react'
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
    tag: 'Inicio',
    titleHtml: 'Registrá ventas y controlá<br/>tu <em>día en tiempo real</em>.',
    description: 'Ves los ingresos del día, las ventas de cada barbero y las horas de mayor movimiento — todo desde la pantalla principal.',
    cta: 'Comenzá ahora',
    ctaHref: '/auth/register',
  },
  {
    image: '/mockups/finanzas.png',
    tag: 'Finanzas',
    titleHtml: 'Controlá las <em>finanzas</em><br/>de tu barbería.',
    description: 'Ingresos, gastos, comisiones y ganancia neta de cada mes. Todo calculado automáticamente, sin fórmulas.',
    cta: 'Probá gratis',
    ctaHref: '/auth/register',
  },
  {
    image: '/mockups/barberos.png',
    tag: 'Equipo',
    titleHtml: 'Configurá tu <em>equipo</em><br/>y sus comisiones.',
    description: 'Agregá barberos, establecé sus porcentajes y gestioná los servicios que ofrece tu barbería — sin complicaciones.',
    cta: 'Administrá tu equipo',
    ctaHref: '/auth/register',
  },
  {
    image: '/mockups/ventas.png',
    tag: 'Ventas',
    titleHtml: 'Aumentá las <em>ventas</em><br/>de tu barbería.',
    description: 'Registrá servicios y productos en segundos. Controlá cada ingreso y analizá tendencias desde el celular.',
    cta: 'Empezá a vender más',
    ctaHref: '/auth/register',
  },
]

const INTERVAL_MS = 8000

export default function MockupCarousel() {
  const [current, setCurrent] = useState(0)
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

  return (
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
                  <div className={styles.screen}>
                    <Image
                      src={s.image}
                      alt={s.tag}
                      fill
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className={styles.img}
                      priority={i === 0}
                    />
                  </div>
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
  )
}
