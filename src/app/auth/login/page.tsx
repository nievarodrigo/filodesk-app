import type { Metadata } from 'next'
import LoginForm from './LoginForm'
import Link from 'next/link'
import styles from '../auth.module.css'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  robots: { index: false },
}

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>← Volver al inicio</Link>
        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>Iniciá sesión</h1>
        <p className={styles.subtitle}>Bienvenido de vuelta</p>
        <LoginForm />
        <p className={styles.switchText}>
          ¿No tenés cuenta?{' '}
          <Link href="/auth/register" className={styles.link}>Registrate gratis</Link>
        </p>
      </div>
    </div>
  )
}
