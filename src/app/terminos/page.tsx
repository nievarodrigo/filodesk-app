import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/legal/legal.module.css'

export const metadata: Metadata = {
  title: 'Términos de Uso',
  description: 'Condiciones de uso del servicio FiloDesk.',
}

export default function TerminosPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.back}>← Volver al inicio</Link>

        <div className={styles.logo}>✦ FiloDesk</div>
        <h1 className={styles.title}>Términos de Uso</h1>
        <p className={styles.updated}>Última actualización: marzo de 2025</p>

        <div className={styles.section}>
          <h2>1. Aceptación</h2>
          <p>
            Al crear una cuenta en FiloDesk, aceptás estos Términos de Uso. Si no estás de acuerdo,
            no uses el servicio.
          </p>
        </div>

        <div className={styles.section}>
          <h2>2. Descripción del servicio</h2>
          <p>
            FiloDesk es un software de gestión para barberías que permite registrar ventas,
            calcular comisiones y liquidar sueldos de barberos. El servicio se presta bajo
            modalidad SaaS (Software as a Service) mediante suscripción mensual.
          </p>
        </div>

        <div className={styles.section}>
          <h2>3. Registro y cuenta</h2>
          <ul>
            <li>Debés tener al menos 18 años para usar FiloDesk.</li>
            <li>Sos responsable de mantener la seguridad de tu contraseña.</li>
            <li>No podés ceder tu cuenta a terceros.</li>
            <li>Debés proporcionar información veraz al registrarte.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. Plan gratuito y suscripción</h2>
          <ul>
            <li>FiloDesk ofrece un período de prueba gratuito de 14 días sin tarjeta de crédito.</li>
            <li>Una vez finalizado el período de prueba, el servicio requiere una suscripción mensual.</li>
            <li>Los precios están expresados en pesos argentinos (ARS) e incluyen IVA.</li>
            <li>Podés cancelar tu suscripción en cualquier momento desde tu cuenta.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>5. Tus datos</h2>
          <p>
            Sos el dueño de los datos que cargás en FiloDesk (barberos, ventas, gastos).
            Podés exportarlos o solicitar su eliminación en cualquier momento. FiloDesk no
            usa tus datos comerciales para ningún fin que no sea proveerte el servicio.
          </p>
        </div>

        <div className={styles.section}>
          <h2>6. Uso aceptable</h2>
          <p>Queda prohibido:</p>
          <ul>
            <li>Usar FiloDesk para actividades ilegales.</li>
            <li>Intentar acceder a cuentas de otros usuarios.</li>
            <li>Realizar ingeniería inversa del software.</li>
            <li>Revender o sublicenciar el acceso al servicio.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>7. Disponibilidad del servicio</h2>
          <p>
            Nos esforzamos por mantener FiloDesk disponible 24/7, pero no garantizamos
            disponibilidad ininterrumpida. Pueden ocurrir interrupciones por mantenimiento
            o causas fuera de nuestro control.
          </p>
        </div>

        <div className={styles.section}>
          <h2>8. Limitación de responsabilidad</h2>
          <p>
            FiloDesk no se hace responsable por pérdidas de datos causadas por mal uso del
            servicio, ni por decisiones comerciales tomadas en base a la información de la app.
            El servicio se provee &quot;tal cual es&quot;.
          </p>
        </div>

        <div className={styles.section}>
          <h2>9. Cancelación</h2>
          <p>
            Podés cancelar tu cuenta en cualquier momento. Al cancelar, tus datos se conservan
            30 días y luego se eliminan permanentemente. FiloDesk puede suspender cuentas que
            violen estos términos.
          </p>
        </div>

        <div className={styles.section}>
          <h2>10. Contacto</h2>
          <p>
            Para consultas sobre estos términos escribinos a{' '}
            <span className={styles.highlight}>hola@filodesk.com</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
