'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './mockupCarousel.module.css'

type Slide = {
  image: string
  tag: string
  title: string
  description: string
}

const SLIDES: Slide[] = [
  {
    image: '/mockups/inicio.png',
    tag: 'Inicio',
    title: 'Todo lo que necesitás, de un vistazo',
    description:
      'Registrá servicios y productos en segundos. Mirá las horas pico, los ingresos del día y el estado de tu barbería sin salir de la pantalla principal.',
  },
  {
    image: '/mockups/finanzas.png',
    tag: 'Finanzas',
    title: 'Sabé exactamente cuánto ganás',
    description:
      'Ingresos totales, comisiones pagadas, gastos del local y tu ganancia neta. Todo calculado automáticamente, sin fórmulas ni hojas de cálculo.',
  },
  {
    image: '/mockups/barberos.png',
    tag: 'Barberos',
    title: 'Liquidaciones sin dolores de cabeza',
    description:
      'Cada barbero tiene su resumen de ventas y comisión del mes. Cerrás la quincena en segundos y sin discusiones.',
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
    <div className={styles.outer}>
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
                <h2 className={styles.title}>{s.title}</h2>
                <p className={styles.desc}>{s.description}</p>
              </div>

              {/* Device frame */}
              <div className={styles.device}>
                <div className={styles.deviceBar}>
                  <div className={`${styles.dot} ${styles.dotRed}`} />
                  <div className={`${styles.dot} ${styles.dotYellow}`} />
                  <div className={`${styles.dot} ${styles.dotGreen}`} />
                </div>
                <div className={styles.screen}>
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 55vw"
                    className={styles.img}
                    priority={i === 0}
                  />
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
            aria-label={`Ir al slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
