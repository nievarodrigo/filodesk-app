import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NuevoBarberoForm from './NuevoBarberoForm'
import BarberosTable from './BarberosTable'
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

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Barberos</h1>
        </div>
      </div>

      <NuevoBarberoForm barbershopId={barbershopId} />

      <BarberosTable barbershopId={barbershopId} barbers={barbers ?? []} />
    </div>
  )
}
