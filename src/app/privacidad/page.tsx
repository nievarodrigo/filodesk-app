import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/legal/legal.module.css'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo FiloDesk recolecta, usa y protege tu información personal.',
}

export default function PrivacidadPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.back}>← Volver al inicio</Link>

        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>Política de Privacidad</h1>
        <p className={styles.updated}>Última actualización: marzo de 2025</p>

        <div className={styles.section}>
          <h2>1. ¿Quiénes somos?</h2>
          <p>
            FiloDesk es un software de gestión para barberías desarrollado en Argentina.
            Nos podés contactar en <span className={styles.highlight}>hola@filodesk.com</span>.
          </p>
        </div>

        <div className={styles.section}>
          <h2>2. ¿Qué información recolectamos?</h2>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, apellido y dirección de email al registrarte.</li>
            <li><strong>Datos de uso:</strong> información sobre cómo usás la app (barberos, ventas, gastos). Esta información es tuya y no la compartimos.</li>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y páginas visitadas, para mejorar el servicio.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>3. ¿Para qué usamos tu información?</h2>
          <ul>
            <li>Crear y gestionar tu cuenta.</li>
            <li>Proveerte el servicio de FiloDesk.</li>
            <li>Enviarte emails transaccionales (confirmación de cuenta, cambio de contraseña).</li>
            <li>Mejorar el producto en base a patrones de uso anónimos.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. ¿Compartimos tu información?</h2>
          <p>
            No vendemos ni alquilamos tu información a terceros. Solo compartimos datos con
            proveedores de infraestructura necesarios para operar el servicio (Supabase para base
            de datos y autenticación, Vercel para hosting), quienes están sujetos a sus propias
            políticas de privacidad.
          </p>
        </div>

        <div className={styles.section}>
          <h2>5. Cookies</h2>
          <p>
            Usamos cookies de sesión para mantenerte autenticado. No usamos cookies de
            publicidad ni de rastreo de terceros.
          </p>
        </div>

        <div className={styles.section}>
          <h2>6. Tus derechos</h2>
          <p>
            De acuerdo a la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a:
          </p>
          <ul>
            <li>Acceder a los datos que tenemos sobre vos.</li>
            <li>Solicitar la corrección de datos incorrectos.</li>
            <li>Solicitar la eliminación de tu cuenta y todos tus datos.</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Para ejercer estos derechos, escribinos a <span className={styles.highlight}>hola@filodesk.com</span>.
          </p>
        </div>

        <div className={styles.section}>
          <h2>7. Seguridad</h2>
          <p>
            Tus contraseñas se almacenan encriptadas. Usamos HTTPS en todas las comunicaciones.
            Aun así, ningún sistema es 100% seguro — te recomendamos usar una contraseña única para FiloDesk.
          </p>
        </div>

        <div className={styles.section}>
          <h2>8. Cambios a esta política</h2>
          <p>
            Si hacemos cambios importantes, te notificaremos por email o con un aviso en la app
            antes de que entren en vigencia.
          </p>
        </div>
      </div>
    </div>
  )
}
