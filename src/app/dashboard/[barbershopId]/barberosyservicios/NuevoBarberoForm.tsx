'use client'

import { useActionState, useState } from 'react'
import { createBarber } from '@/app/actions/barber'
import { type CreateBarberState } from '@/lib/validations/barber'
import styles from './barberos.module.css'

interface Props { barbershopId: string }

export default function NuevoBarberoForm({ barbershopId }: Props) {
  const [open, setOpen] = useState(false)
  const action = createBarber.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<CreateBarberState, FormData>(action, undefined)

  return (
    <div>
      <button className={styles.btnPrimary} onClick={() => setOpen(o => !o)}>
        {open ? 'Cancelar' : '+ Agregar barbero'}
      </button>

      {open && (
        <div className={`${styles.formCard} ${styles.formCardOpen}`}>
          <h3 className={styles.formTitle}>Nuevo barbero</h3>
          <form action={formAction} className={styles.form}>
            {state?.message && <p className={styles.errorBox}>{state.message}</p>}
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Nombre *</label>
                <input id="name" name="name" type="text" className={styles.input} placeholder="Ej: Martín" autoFocus />
                {state?.errors?.name && <p className={styles.error}>{state.errors.name[0]}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" className={styles.input} placeholder="martin@barberia.com" />
                {state?.errors?.email && <p className={styles.error}>{state.errors.email[0]}</p>}
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">Teléfono *</label>
                <input id="phone" name="phone" type="tel" className={styles.input} placeholder="+54 11 1234 5678" />
                {state?.errors?.phone && <p className={styles.error}>{state.errors.phone[0]}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="commission_pct">Comisión (%)</label>
                <input id="commission_pct" name="commission_pct" type="number" min="0" max="100" defaultValue="50" className={styles.input} />
                {state?.errors?.commission_pct && <p className={styles.error}>{state.errors.commission_pct[0]}</p>}
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
