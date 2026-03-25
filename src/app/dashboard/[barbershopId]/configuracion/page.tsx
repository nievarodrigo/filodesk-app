import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NuevoBarberoForm from '../barberos/NuevoBarberoForm'
import ToggleBarberButton from '../barberos/ToggleBarberButton'
import NuevoServicioForm from '../servicios/NuevoServicioForm'
import ServicioRow from '../servicios/ServicioRow'
import styles from './configuracion.module.css'

export const metadata: Metadata = { title: 'Barberos y Servicios — FiloDesk' }

export default async function ConfiguracionPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()

  const [{ data: barbers }, { data: allServices }] = await Promise.all([
    supabase.from('barbers').select('id, name, commission_pct, active, created_at').eq('barbershop_id', barbershopId).order('created_at'),
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
        </div>

        <NuevoBarberoForm barbershopId={barbershopId} />

        <div className={styles.table} style={{ marginTop: 16 }}>
          <div className={styles.tableHead}>
            <span>Nombre</span>
            <span>Comisión</span>
            <span>Estado</span>
            <span></span>
          </div>
          {!barbers || barbers.length === 0 ? (
            <p className={styles.empty}>Todavía no hay barberos.</p>
          ) : barbers.map(b => (
            <div key={b.id} className={styles.tableRow}>
              <span>{b.name}</span>
              <span>{b.commission_pct}%</span>
              <span>
                <span className={b.active ? styles.badgeActive : styles.badgeInactive}>
                  {b.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>
              <ToggleBarberButton barbershopId={barbershopId} barberId={b.id} active={b.active} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Servicios ── */}
      <section className={styles.block}>
        <div className={styles.blockHeader}>
          <div>
            <h2 className={styles.blockTitle}>Servicios</h2>
            <p className={styles.blockSub}>Los "global" son predeterminados — editá su precio o agregá los tuyos</p>
          </div>
        </div>

        <NuevoServicioForm barbershopId={barbershopId} />

        <div className={styles.table} style={{ marginTop: 16 }}>
          <div className={styles.tableHead}>
            <span>Nombre</span>
            <span>Precio sugerido</span>
            <span>Estado</span>
            <span></span>
          </div>
          {!services || services.length === 0 ? (
            <p className={styles.empty}>No hay servicios.</p>
          ) : services.map(s => (
            <ServicioRow key={s.id} barbershopId={barbershopId} service={s} />
          ))}
        </div>
      </section>
    </div>
  )
}
