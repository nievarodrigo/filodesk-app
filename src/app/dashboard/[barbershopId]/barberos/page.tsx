import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NuevoBarberoForm from './NuevoBarberoForm'
import ToggleBarberButton from './ToggleBarberButton'
import styles from './barberos.module.css'

export const metadata: Metadata = { title: 'Barberos — FiloDesk' }

export default async function BarberosPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, commission_pct, active, created_at')
    .eq('barbershop_id', barbershopId)
    .order('created_at', { ascending: true })

  const activos = (barbers ?? []).filter(b => b.active).length

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Barberos</h1>
        </div>
      </div>

      <NuevoBarberoForm barbershopId={barbershopId} />

      {!barbers || barbers.length === 0 ? (
        <div className={styles.table}>
          <div className={styles.empty}>
            Todavía no hay barberos. Agregá el primero arriba.
          </div>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Nombre</span>
            <span>Comisión</span>
            <span>Estado</span>
            <span></span>
          </div>
          {barbers.map((barber) => (
            <div key={barber.id} className={styles.tableRow}>
              <span>{barber.name}</span>
              <span>{barber.commission_pct}%</span>
              <span>
                <span className={barber.active ? styles.badgeActive : styles.badgeInactive}>
                  {barber.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>
              <ToggleBarberButton
                barbershopId={barbershopId}
                barberId={barber.id}
                active={barber.active}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
