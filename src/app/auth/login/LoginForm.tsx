'use client'

import { useActionState } from 'react'
import { login, type AuthState as LoginState } from '@/app/actions/auth'
import styles from './login.module.css'

const initial: LoginState = {}

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial)

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
          autoComplete="current-password"
          className={styles.input}
          placeholder="••••••••"
          required
        />
        {state.errors?.password && (
          <p className={styles.error}>{state.errors.password[0]}</p>
        )}
      </div>

      <button type="submit" className={styles.btn} disabled={pending}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}
