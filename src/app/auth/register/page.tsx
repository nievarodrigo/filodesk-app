import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegisterForm from './RegisterForm'
import styles from '../login/login.module.css'

export const metadata: Metadata = { title: 'Crear cuenta — FiloDesk' }

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>Creá tu cuenta</h1>
        <p className={styles.subtitle}>Empezá a gestionar tu barbería gratis</p>

        <RegisterForm />

        <p className={styles.footer}>
          ¿Ya tenés cuenta?{' '}
          <a href="/auth/login" className={styles.link}>
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  )
}
