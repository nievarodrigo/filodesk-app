import type { Metadata } from 'next'
import GoogleAuthButton from '../GoogleAuthButton'
import RegisterForm from './RegisterForm'
import Link from 'next/link'
import styles from '../auth.module.css'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  robots: { index: false },
}

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Link href="/" className={styles.backLink}>← Volver al inicio</Link>
        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>Creá tu cuenta</h1>
        <p className={styles.subtitle}>14 días gratis · Sin tarjeta de crédito</p>
        <GoogleAuthButton />
        <div className={styles.separator}>
          <span>o con email</span>
        </div>
        <RegisterForm />
        <p className={styles.switchText}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/auth/login" className={styles.link}>Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
