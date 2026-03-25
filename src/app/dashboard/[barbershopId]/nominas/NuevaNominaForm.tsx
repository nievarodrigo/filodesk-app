'use client'

import { useActionState, useState } from 'react'
import { createNomina, type NominaState } from '@/app/actions/nomina'
import styles from './nominas.module.css'

interface Barber { id: string; name: string; commission_pct: number }
interface Props  { barbershopId: string; barbers: Barber[] }

function monthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const end   = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  return { start, end }
}

export default function NuevaNominaForm({ barbershopId, barbers }: Props) {
  const [open, setOpen] = useState(false)
  const { start, end } = monthRange()
  const action = createNomina.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<NominaState, FormData>(action, undefined)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: open ? 16 : 0 }}>
        <button className={styles.btnPrimary} onClick={() => setOpen(o => !o)}>
          {open ? 'Cancelar' : '+ Liquidar nómina'}
        </button>
      </div>
      {open && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Nueva liquidación</h3>
          <p className={styles.formSub}>FiloDesk calcula automáticamente la comisión en base a las ventas del período.</p>
          <form action={formAction} className={styles.form}>
            {state?.message && <p className={styles.errorBox}>{state.message}</p>}

            <div className={styles.formGrid}>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label} htmlFor="barber_id">Barbero *</label>
                <select id="barber_id" name="barber_id" className={styles.select} defaultValue="">
                  <option value="" disabled>Seleccioná un barbero</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.commission_pct}%)</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="period_start">Desde *</label>
                <input id="period_start" name="period_start" type="date" className={styles.input} defaultValue={start} />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="period_end">Hasta *</label>
                <input id="period_end" name="period_end" type="date" className={styles.input} defaultValue={end} />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={pending}>{pending ? 'Calculando…' : 'Calcular y guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
