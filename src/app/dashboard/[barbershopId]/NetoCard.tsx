'use client'

import { useState } from 'react'
import styles from './page.module.css'

interface Props {
  neto: number
  ingresos: number
  comisiones: number
  gastos: number
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function NetoCard({ neto, ingresos, comisiones, gastos }: Props) {
  const [visible, setVisible] = useState(() => {
    const saved = localStorage.getItem('neto_visible')
    return saved !== null ? saved === 'true' : true
  })

  function toggle() {
    setVisible(v => {
      localStorage.setItem('neto_visible', String(!v))
      return !v
    })
  }

  return (
    <div className={styles.netoCard}>
      <div className={styles.netoLeft}>
        <span className={styles.netoLabel}>Neto del mes</span>
        <span
          className={styles.netoValue}
          style={{ color: visible ? (neto >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)' }}
        >
          {visible ? formatARS(neto) : '••••••'}
        </span>
      </div>

      <div className={styles.netoRight}>
        {visible && (
          <span className={styles.netoBreak}>
            <span>{formatARS(ingresos)} ingresos</span>
            <span>− {formatARS(comisiones)} comisiones</span>
            <span>− {formatARS(gastos)} gastos</span>
          </span>
        )}
        <button className={styles.netoEye} onClick={toggle} title={visible ? 'Ocultar' : 'Mostrar'}>
          {visible ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
