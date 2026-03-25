'use client'

import { useActionState } from 'react'
import { register, type AuthState } from '@/app/actions/auth'
import styles from '../login/login.module.css'

const initial: AuthState = {}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, initial)

  return (
    <form className={styles.form} action={action}>
      {state.message && (
        <p className={styles.errorBox}>{state.message}</p>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={styles.input}
          placeholder="tu@email.com"
          required
        />
        {state.errors?.email && (
          <p className={styles.error}>{state.errors.email[0]}</p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          placeholder="Mínimo 6 caracteres"
          required
        />
        {state.errors?.password && (
          <p className={styles.error}>{state.errors.password[0]}</p>
        )}
      </div>

      <button type="submit" className={styles.btn} disabled={pending}>
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
