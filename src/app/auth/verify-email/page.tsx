import Link from 'next/link'
import styles from '../auth.module.css'

export default function VerifyEmailPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>📬</div>
        <h1 className={styles.title}>Revisá tu email</h1>
        <p className={styles.subtitle}>
          Te mandamos un link de confirmación. Hacé click en él para activar tu cuenta y entrar al dashboard.
        </p>
        <p className={styles.note}>
          ¿No llegó? Revisá la carpeta de spam.
        </p>
        <Link href="/auth/login" className={styles.link}>
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
