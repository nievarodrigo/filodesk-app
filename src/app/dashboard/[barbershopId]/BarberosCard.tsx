'use client'

import { useTransition } from 'react'
import { toggleBarberActive } from '@/app/actions/barber'

interface Barber {
  id: string
  name: string
  commission_pct: number
  active: boolean
}

interface Props {
  barbershopId: string
  barbers: Barber[]
}

export default function BarberosCard({ barbershopId, barbers }: Props) {
  const activeCount = barbers.filter(b => b.active).length

  return (
    <div style={{
      background: '#1e1e1e',
      border: '1px solid #3a3a3a',
      borderTop: '3px solid var(--gold)',
      borderRadius: 10,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div>
        <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: 1, color: '#7a7060', fontWeight: 600, marginBottom: 6 }}>
          Barberos activos
        </p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--cream)' }}>
          {activeCount}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {barbers.map(b => (
          <BarberRow key={b.id} barbershopId={barbershopId} barber={b} />
        ))}
      </div>
    </div>
  )
}

function BarberRow({ barbershopId, barber }: { barbershopId: string; barber: { id: string; name: string; commission_pct: number; active: boolean } }) {
  const [pending, start] = useTransition()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      padding: '6px 0',
      borderBottom: '1px solid #2a2a2a',
      opacity: barber.active ? 1 : 0.45,
    }}>
      <div>
        <p style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.2 }}>{barber.name}</p>
        <p style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{barber.commission_pct}% comisión</p>
      </div>
      <button
        disabled={pending}
        onClick={() => start(() => toggleBarberActive(barbershopId, barber.id, !barber.active))}
        style={{
          background: 'transparent',
          border: `1px solid ${barber.active ? 'rgba(224,112,112,.4)' : 'rgba(94,207,135,.4)'}`,
          color: barber.active ? 'var(--red)' : 'var(--green)',
          padding: '3px 10px',
          borderRadius: 6,
          fontSize: '.72rem',
          fontWeight: 600,
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.5 : 1,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {barber.active ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  )
}
