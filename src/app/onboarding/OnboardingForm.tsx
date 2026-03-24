'use client'

import { useActionState } from 'react'
import { createBarbershop } from '@/app/actions/barbershop'
import styles from './onboarding.module.css'

export default function OnboardingForm() {
  const [state, action, pending] = useActionState(createBarbershop, undefined)

  return (
    <form action={action} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>Nombre de la barbería *</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Ej: Barbería El Filo"
          className={styles.input}
          autoComplete="off"
          autoFocus
        />
        {state?.errors?.name && (
          <span className={styles.error}>{state.errors.name[0]}</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="address" className={styles.label}>Dirección <span className={styles.optional}>(opcional)</span></label>
        <input
          id="address"
          name="address"
          type="text"
          placeholder="Ej: Av. Corrientes 1234, CABA"
          className={styles.input}
          autoComplete="street-address"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="phone" className={styles.label}>Teléfono <span className={styles.optional}>(opcional)</span></label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Ej: 11 2345-6789"
          className={styles.input}
          autoComplete="tel"
        />
      </div>

      {state?.message && (
        <div className={styles.errorBox}>{state.message}</div>
      )}

      <button type="submit" className={styles.btn} disabled={pending}>
        {pending ? 'Creando...' : 'Crear barbería →'}
      </button>
    </form>
  )
}
