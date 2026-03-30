import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { getServerAuthContext } from '@/services/auth.service'
import { redirect } from 'next/navigation'
import NuevoBarberoForm from './NuevoBarberoForm'
import BarberosTable from './BarberosTable'
import NuevoServicioForm from './NuevoServicioForm'
import ServiciosTable from './ServiciosTable'
import styles from './barberosyservicios.module.css'

export const metadata: Metadata = { title: 'Barberos y Servicios — FiloDesk' }

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
  if (!context || !canAccess(context.role, 'manage_barbers')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('name')
    .eq('id', barbershopId)
    .single()

  const [{ data: barbers }, { data: allServices }] = await Promise.all([
    supabase.from('barbers').select('id, name, email, phone, commission_pct, active, created_at').eq('barbershop_id', barbershopId).order('created_at'),
    supabase.from('service_types').select('id, name, default_price, active, barbershop_id').or(`barbershop_id.eq.${barbershopId},barbershop_id.is.null`).order('name'),
  ])

  // Hide global services that have a barbershop-specific override
  const ownNames = new Set(
    (allServices ?? []).filter(s => s.barbershop_id !== null).map(s => s.name.toLowerCase())
  )
  const services = (allServices ?? []).filter(
    s => s.barbershop_id !== null || !ownNames.has(s.name.toLowerCase())
  )

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Barberos y Servicios</h1>
      </div>

      {/* ── Barberos ── */}
      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <div>
            <h2 className={styles.blockTitle}>Barberos</h2>
            <p className={styles.blockSub}>Gestioná tu equipo y sus comisiones</p>
          </div>
          <NuevoBarberoForm barbershopId={barbershopId} />
        </div>

        <BarberosTable
          barbershopId={barbershopId}
          barbershopName={barbershop?.name ?? 'tu barbería'}
          barbers={barbers ?? []}
        />
      </section>

      {/* ── Servicios ── */}
      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <div>
            <h2 className={styles.blockTitle}>Servicios</h2>
            <p className={styles.blockSub}>Gestioná tus servicios y sus precios</p>
          </div>
          <NuevoServicioForm barbershopId={barbershopId} />
        </div>

        <ServiciosTable barbershopId={barbershopId} services={services} />
      </section>
    </div>
  )
}
