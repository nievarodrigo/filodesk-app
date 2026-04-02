'use client'

import { useActionState } from 'react'
import { updateBarbershop, type UpdateBarbershopState } from '@/app/actions/barbershop'
import styles from './configuracion.module.css'

interface Props {
  barbershopId: string
  name: string
  address: string | null
  phone: string | null
}

export default function UpdateBarbershopForm({ barbershopId, name, address, phone }: Props) {
  const boundAction = updateBarbershop.bind(null, barbershopId)
  const [state, action, pending] = useActionState<UpdateBarbershopState, FormData>(boundAction, {})

  return (
    <form action={action} className={styles.form}>
      {state.error && <p className={styles.formError}>{state.error}</p>}
      {state.success && <p className={styles.formSuccess}>Cambios guardados.</p>}

      <div className={styles.formField}>
        <label className={styles.formLabel}>Nombre del local</label>
        <input
          name="name"
          defaultValue={name}
          className={styles.formInput}
          placeholder="Ej: Barbería Don Juan"
          required
          minLength={2}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Dirección <span className={styles.formOptional}>(opcional)</span></label>
        <input
          name="address"
          defaultValue={address ?? ''}
          className={styles.formInput}
          placeholder="Ej: Av. Corrientes 1234, CABA"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>Teléfono <span className={styles.formOptional}>(opcional)</span></label>
        <input
          name="phone"
          defaultValue={phone ?? ''}
          className={styles.formInput}
          placeholder="Ej: +54 11 1234-5678"
        />
      </div>

      <button type="submit" disabled={pending} className={styles.formBtn}>
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
