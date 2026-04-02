import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { getServerAuthContext } from '@/services/auth.service'
import UpdateBarbershopForm from './UpdateBarbershopForm'
import styles from './configuracion.module.css'

export const metadata: Metadata = { title: 'Configuración — FiloDesk' }

export default async function ConfiguracionPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, session.user.id)
  if (!context || !canAccess(context.role, 'change_plan')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('name, address, phone, plan_name, subscription_status, subscription_renews_at, subscription_payment_method')
    .eq('id', barbershopId)
    .single()

  if (!barbershop) redirect(`/dashboard/${barbershopId}`)

  const planName = barbershop.plan_name ?? 'Base'
  const renewsAt = barbershop.subscription_renews_at
    ? new Date(barbershop.subscription_renews_at).toLocaleDateString('es-AR', {
        day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
      })
    : null
  const isAutoRenew = barbershop.subscription_payment_method !== null &&
                      barbershop.subscription_payment_method !== 'checkout_pro'
  const renewLabel = renewsAt
    ? `${isAutoRenew ? 'Se renueva' : 'Vence'} el ${renewsAt}`
    : null

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuración</h1>
      </div>

      <div className={styles.sections}>

        {/* ── Datos del local ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>Datos del local</p>
            <p className={styles.cardDesc}>Nombre, dirección y teléfono que aparecen en el sistema.</p>
          </div>
          <UpdateBarbershopForm
            barbershopId={barbershopId}
            name={barbershop.name}
            address={barbershop.address ?? null}
            phone={(barbershop as { phone?: string | null }).phone ?? null}
          />
        </div>

        {/* ── Plan y facturación ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>Plan y facturación</p>
            <p className={styles.cardDesc}>Tu plan actual y opciones de upgrade.</p>
          </div>
          <div className={styles.planRow}>
            <div className={styles.planInfo}>
              <p className={styles.planName}>Plan {planName}</p>
              {renewLabel && <p className={styles.planDetail}>{renewLabel}</p>}
            </div>
            <Link
              href={`/suscripcion?barbershopId=${barbershopId}`}
              className={styles.planBtn}
            >
              {planName === 'Base' ? 'Mejorar plan' : 'Gestionar plan'}
            </Link>
          </div>
        </div>

        {/* ── Equipo y accesos ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>Equipo y accesos</p>
            <p className={styles.cardDesc}>Gestioná quién tiene acceso y con qué rol.</p>
          </div>
          <div className={styles.linkList}>
            <Link href={`/dashboard/${barbershopId}/equipo`} className={styles.linkItem}>
              <span className={styles.linkItemLabel}>Gestionar miembros del equipo</span>
              <span className={styles.linkItemArrow}>→</span>
            </Link>
            <Link href={`/dashboard/${barbershopId}/barberosyservicios`} className={styles.linkItem}>
              <span className={styles.linkItemLabel}>Barberos y servicios</span>
              <span className={styles.linkItemArrow}>→</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
