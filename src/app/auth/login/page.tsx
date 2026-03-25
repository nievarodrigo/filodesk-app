import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'
import styles from './login.module.css'

export const metadata: Metadata = { title: 'Iniciar sesión — FiloDesk' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>Bienvenido de nuevo</h1>
        <p className={styles.subtitle}>Ingresá a tu panel de gestión</p>

        {error === 'callback_failed' && (
          <p style={{ color: 'var(--red)', fontSize: '.85rem', marginBottom: 16 }}>
            Hubo un problema al iniciar sesión. Intentá de nuevo.
          </p>
        )}

        <LoginForm />

        <p className={styles.footer}>
          ¿No tenés cuenta?{' '}
          <a
            href="/auth/register"
            className={styles.link}
          >
            Registrate gratis
          </a>
        </p>
      </div>
    </div>
  )
}
