'use client'

import { useActionState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { register } from '@/app/actions/auth'
import styles from '../auth.module.css'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        theme?: 'light' | 'dark' | 'auto'
      }) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && window.turnstile && turnstileRef.current && !widgetIdRef.current) {
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = 'cf-turnstile-response'
          input.value = token
          turnstileRef.current?.parentElement?.querySelector('form')?.appendChild(input)
        },
        'error-callback': () => {
          console.error('Turnstile error')
        },
        'expired-callback': () => {
          if (widgetIdRef.current) {
            window.turnstile?.reset(widgetIdRef.current)
          }
        },
        theme: 'light',
      })
    }
  }, [])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
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

        {state?.message && (
          <div className={styles.errorBox}>{state.message}</div>
        )}

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div ref={turnstileRef} className={styles.turnstile} />
        )}

        <button type="submit" className={styles.btn} disabled={pending}>
          {pending ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>
    </>
  )
}
