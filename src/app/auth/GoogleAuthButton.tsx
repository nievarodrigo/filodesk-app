import { signInWithGoogle } from '@/app/actions/auth'
import styles from './auth.module.css'

export default function GoogleAuthButton() {
  return (
    <form action={signInWithGoogle} className={styles.oauthForm}>
      <button type="submit" className={styles.googleButton}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.googleIcon}>
          <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.7 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.7-3.7 8.7-8.8 0-.6-.1-1.1-.2-1.6H12Z" />
          <path fill="#34A853" d="M3 12c0 1.8.7 3.5 1.8 4.8l3-2.3c-.4-.7-.7-1.6-.7-2.5s.2-1.7.7-2.5l-3-2.3A8.9 8.9 0 0 0 3 12Z" />
          <path fill="#FBBC05" d="M12 21c2.4 0 4.5-.8 6-2.3l-2.9-2.2c-.8.6-1.8 1-3.1 1-2.5 0-4.7-1.7-5.4-4.1l-3.1 2.4C5 18.9 8.2 21 12 21Z" />
          <path fill="#4285F4" d="M18 18.7c1.7-1.6 2.7-4 2.7-6.7 0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.4-1.1 2.6-2.3 3.4l2.9 2.2Z" />
        </svg>
        Continuar con Google
      </button>
    </form>
  )
}
