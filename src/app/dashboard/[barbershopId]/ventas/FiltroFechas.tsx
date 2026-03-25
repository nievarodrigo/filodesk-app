'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './ventas.module.css'

interface Props {
  barbershopId: string
  desde: string
  hasta: string
  tipo: string
  months: { ym: string; label: string }[]
}

function isoToDisplay(iso: string): string {
  if (!iso?.match(/^\d{4}-\d{2}-\d{2}$/)) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function autoFormat(raw: string): { display: string; iso: string | null } {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let display = digits
  if (digits.length > 2) display = `${digits.slice(0, 2)}/${digits.slice(2)}`
  if (digits.length > 4) display = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  if (digits.length === 8) {
    const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8)
    const iso = `${y}-${m}-${d}`
    if (!isNaN(new Date(iso).getTime())) return { display, iso }
  }
  return { display, iso: null }
}

export default function FiltroFechas({ barbershopId, desde, hasta, tipo, months }: Props) {
  const router = useRouter()
  const [dDisplay, setDDisplay] = useState(isoToDisplay(desde))
  const [hDisplay, setHDisplay] = useState(isoToDisplay(hasta))
  const [dISO, setDISO] = useState(desde)
  const [hISO, setHISO] = useState(hasta)

  function handleD(value: string) {
    const { display, iso } = autoFormat(value)
    setDDisplay(display)
    if (iso) setDISO(iso)
  }
  function handleH(value: string) {
    const { display, iso } = autoFormat(value)
    setHDisplay(display)
    if (iso) setHISO(iso)
  }

  function apply(newD = dISO, newH = hISO) {
    if (!newD || !newH) return
    router.push(`/dashboard/${barbershopId}/ventas?desde=${newD}&hasta=${newH}&tipo=${tipo}`)
  }

  return (
    <div className={styles.filtro}>
      <div className={styles.filtroInputs}>
        <div className={styles.filtroField}>
          <label className={styles.filtroLabel}>Desde</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            className={styles.filtroDate}
            value={dDisplay}
            onChange={e => handleD(e.target.value)}
            onBlur={() => apply()}
          />
        </div>
        <div className={styles.filtroField}>
          <label className={styles.filtroLabel}>Hasta</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            className={styles.filtroDate}
            value={hDisplay}
            onChange={e => handleH(e.target.value)}
            onBlur={() => apply()}
          />
        </div>
        <button className={styles.filtroBtn} onClick={() => apply()}>
          Filtrar
        </button>
      </div>

      <div className={styles.monthNav}>
        {months.map(mo => {
          const [y, m] = mo.ym.split('-').map(Number)
          const first = `${mo.ym}-01`
          const last  = new Date(y, m, 0).toISOString().slice(0, 10)
          const isActive = dISO === first && hISO === last
          return (
            <button
              key={mo.ym}
              className={isActive ? styles.monthActive : styles.monthTab}
              onClick={() => {
                setDDisplay(isoToDisplay(first))
                setHDisplay(isoToDisplay(last))
                setDISO(first)
                setHISO(last)
                apply(first, last)
              }}
            >
              {mo.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
