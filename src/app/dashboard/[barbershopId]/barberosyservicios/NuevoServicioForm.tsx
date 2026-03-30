'use client'

import { useActionState, useState } from 'react'
import { createServicio, type ServicioState } from '@/app/actions/servicio'
import styles from './servicios.module.css'

interface Props { barbershopId: string }

export default function NuevoServicioForm({ barbershopId }: Props) {
  const [open, setOpen] = useState(false)
  const action = createServicio.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<ServicioState, FormData>(action, undefined)

  return (
    <div>
      <button className={styles.btnPrimary} onClick={() => setOpen(o => !o)}>
        {open ? 'Cancelar' : '+ Agregar servicio'}
      </button>

      {open && (
        <div className={`${styles.formCard} ${styles.formCardOpen}`}>
          <h3 className={styles.formTitle}>Nuevo servicio</h3>
          <form action={formAction} className={styles.form}>
            {state?.message && <p className={styles.errorBox}>{state.message}</p>}
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Nombre *</label>
                <input id="name" name="name" type="text" className={styles.input} placeholder="Ej: Corte degradé" autoFocus />
                {state?.errors?.name && <p className={styles.error}>{state.errors.name[0]}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="default_price">Precio (ARS)</label>
                <input id="default_price" name="default_price" type="number" inputMode="numeric" min="0" step="1" className={styles.input} placeholder="Ej: 5000" />
                {state?.errors?.default_price && <p className={styles.error}>{state.errors.default_price[0]}</p>}
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={pending}>
                {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
