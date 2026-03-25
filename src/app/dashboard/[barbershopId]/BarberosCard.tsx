'use client'

import { useState, useTransition } from 'react'
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
  const [open, setOpen] = useState(false)
  const activeCount = barbers.filter(b => b.active).length

  return (
    <>
      {/* KPI card — misma altura que las otras */}
      <div style={{
        background: '#1e1e1e',
        border: '1px solid #3a3a3a',
        borderTop: '3px solid var(--gold)',
        borderRadius: 10,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <p style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: 1, color: '#7a7060', fontWeight: 600 }}>
          Barberos activos
        </p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--cream)' }}>
          {activeCount}
        </p>
        <button
          onClick={() => setOpen(true)}
          style={{
            marginTop: 4,
            background: 'transparent',
            border: '1px solid #3a3a3a',
            borderRadius: 6,
            color: '#7a7060',
            fontSize: '.75rem',
            fontWeight: 600,
            padding: '5px 10px',
            cursor: 'pointer',
            alignSelf: 'flex-start',
            transition: 'color .15s, border-color .15s',
          }}
          onMouseEnter={e => { const b = e.currentTarget; b.style.color = '#c9a84c'; b.style.borderColor = '#c9a84c' }}
          onMouseLeave={e => { const b = e.currentTarget; b.style.color = '#7a7060'; b.style.borderColor = '#3a3a3a' }}
        >
          Gestionar
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e1e1e',
              border: '1px solid #3a3a3a',
              borderRadius: 14,
              padding: '24px 28px',
              width: '100%',
              maxWidth: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cream)' }}>Barberos</p>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#7a7060', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {barbers.map(b => (
                <BarberRow key={b.id} barbershopId={barbershopId} barber={b} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BarberRow({ barbershopId, barber }: { barbershopId: string; barber: Barber }) {
  const [pending, start] = useTransition()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid #2a2a2a',
      opacity: barber.active ? 1 : 0.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: barber.active ? 'var(--green)' : '#3a3a3a',
          flexShrink: 0,
        }} />
        <div>
          <p style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.3 }}>{barber.name}</p>
          <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{barber.commission_pct}% comisión</p>
        </div>
      </div>
      <button
        disabled={pending}
        onClick={() => start(() => toggleBarberActive(barbershopId, barber.id, !barber.active))}
        style={{
          background: 'transparent',
          border: `1px solid ${barber.active ? 'rgba(224,112,112,.4)' : 'rgba(94,207,135,.4)'}`,
          color: barber.active ? 'var(--red)' : 'var(--green)',
          padding: '5px 14px',
          borderRadius: 6,
          fontSize: '.78rem',
          fontWeight: 600,
          cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.5 : 1,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'opacity .15s',
        }}
      >
        {pending ? '…' : barber.active ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  )
}
