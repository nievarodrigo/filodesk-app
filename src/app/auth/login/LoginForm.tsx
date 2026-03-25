'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import styles from '../auth.module.css'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          className={styles.input}
          autoComplete="email"
        />
        {state?.errors?.email && (
          <span className={styles.error}>{state.errors.email[0]}</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Tu contraseña"
          className={styles.input}
          autoComplete="current-password"
        />
        {state?.errors?.password && (
          <span className={styles.error}>{state.errors.password[0]}</span>
        )}
      </div>

      {state?.message && (
        <div className={styles.errorBox}>{state.message}</div>
      )}

      <button type="submit" className={styles.btn} disabled={pending}>
        {pending ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  )
}
