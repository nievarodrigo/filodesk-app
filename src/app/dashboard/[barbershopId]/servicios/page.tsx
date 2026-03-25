import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NuevoServicioForm from './NuevoServicioForm'
import ServicioRow from './ServicioRow'
import styles from './servicios.module.css'

export const metadata: Metadata = { title: 'Servicios — FiloDesk' }

export default async function ServiciosPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>
}) {
  const { barbershopId } = await params
  const supabase = await createClient()

  const { data: rawServices } = await supabase
    .from('service_types')
    .select('id, name, default_price, active, barbershop_id')
    .or(`barbershop_id.eq.${barbershopId},barbershop_id.is.null`)
    .order('name')

  // Si existe un override propio, ocultar el servicio global del mismo nombre
  const overrideNames = new Set(
    (rawServices ?? []).filter(s => s.barbershop_id).map(s => s.name)
  )
  const services = (rawServices ?? []).filter(
    s => s.barbershop_id || !overrideNames.has(s.name)
  )

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Servicios</h1>
          <p className={styles.subtitle}>
            Los servicios "global" son predeterminados. Podés editar su precio o agregar los tuyos.
          </p>
        </div>
        <NuevoServicioForm barbershopId={barbershopId} />
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Nombre</span>
          <span>Precio sugerido</span>
          <span>Estado</span>
          <span></span>
        </div>

        {!services || services.length === 0 ? (
          <div className={styles.empty}>No hay servicios todavía.</div>
        ) : (
          services.map(s => (
            <ServicioRow
              key={s.id}
              barbershopId={barbershopId}
              service={s}
            />
          ))
        )}
      </div>
    </div>
  )
}
