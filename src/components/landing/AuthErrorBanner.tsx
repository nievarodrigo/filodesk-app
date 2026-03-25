import styles from './landing.module.css'

const ERROR_MESSAGES: Record<string, string> = {
  'link-invalido': 'El enlace de confirmación es inválido o ya fue usado.',
  'otp_expired': 'El enlace de confirmación expiró. Registrate de nuevo para recibir uno nuevo.',
  'access_denied': 'Acceso denegado. El enlace puede haber expirado.',
}

export default function AuthErrorBanner({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string }
}) {
  const error = searchParams.error || searchParams.error_description

  if (!error) return null

  const message =
    ERROR_MESSAGES[error] ||
    searchParams.error_description ||
    'Ocurrió un error de autenticación. Intentá de nuevo.'

  return (
    <div className={styles.errorBanner}>
      {message}
    </div>
  )
}
