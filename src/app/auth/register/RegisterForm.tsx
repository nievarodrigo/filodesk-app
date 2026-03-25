'use client'

import { useActionState } from 'react'
import Script from 'next/script'
import { register } from '@/app/actions/auth'
import styles from '../auth.module.css'

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />

      <form action={action} className={styles.form}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="firstName" className={styles.label}>Nombre</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Juan"
              className={styles.input}
              autoComplete="given-name"
            />
            {state?.errors?.firstName && (
              <span className={styles.error}>{state.errors.firstName[0]}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="lastName" className={styles.label}>Apellido</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="García"
              className={styles.input}
              autoComplete="family-name"
            />
            {state?.errors?.lastName && (
              <span className={styles.error}>{state.errors.lastName[0]}</span>
            )}
          </div>
        </div>

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
            placeholder="Mínimo 8 caracteres"
            className={styles.input}
            autoComplete="new-password"
          />
          {state?.errors?.password && (
            <span className={styles.error}>{state.errors.password[0]}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword" className={styles.label}>Confirmá tu contraseña</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repetí la contraseña"
            className={styles.input}
            autoComplete="new-password"
          />
          {state?.errors?.confirmPassword && (
            <span className={styles.error}>{state.errors.confirmPassword[0]}</span>
          )}
        </div>

        <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'}
          data-theme="dark"
        />

        {state?.message && (
          <div className={styles.errorBox}>{state.message}</div>
        )}

        <button type="submit" className={styles.btn} disabled={pending}>
          {pending ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>
    </>
  )
}
