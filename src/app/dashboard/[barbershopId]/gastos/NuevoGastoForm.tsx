'use client'

import { useActionState, useState } from 'react'
import { createGasto, type GastoState } from '@/app/actions/gasto'
import { CATEGORIES } from '@/lib/constants/gastos'
import { usePreserveFormOnError } from '@/lib/hooks/usePreserveFormOnError'
import styles from './gastos.module.css'

interface Props { barbershopId: string }

function todayStr() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) }

export default function NuevoGastoForm({ barbershopId }: Props) {
  const [open, setOpen] = useState(false)
  const action = createGasto.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<GastoState, FormData>(action, undefined)
  const { formRef, handleSubmitCapture } = usePreserveFormOnError(state)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: open ? 16 : 0 }}>
        <button className={styles.btnPrimary} onClick={() => setOpen(o => !o)}>
          {open ? 'Cancelar' : '+ Registrar gasto'}
        </button>
      </div>
      {open && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Nuevo gasto</h3>
          <form ref={formRef} onSubmitCapture={handleSubmitCapture} action={formAction} className={styles.form}>
            {state?.message && <p className={styles.errorBox}>{state.message}</p>}

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="description">Descripción *</label>
                <input id="description" name="description" type="text" className={styles.input} placeholder="Ej: Alquiler de marzo" autoFocus />
                {state?.errors?.description && <p className={styles.error}>{state.errors.description[0]}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="category">Categoría *</label>
                <select id="category" name="category" className={styles.select} defaultValue="Otros">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="amount">Monto (ARS) *</label>
                <input id="amount" name="amount" type="number" min="1" step="1" className={styles.input} placeholder="Ej: 50000" />
                {state?.errors?.amount && <p className={styles.error}>{state.errors.amount[0]}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="date">Fecha de pago *</label>
                <input id="date" name="date" type="date" className={styles.input} defaultValue={todayStr()} />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={pending}>{pending ? 'Guardando…' : 'Registrar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
