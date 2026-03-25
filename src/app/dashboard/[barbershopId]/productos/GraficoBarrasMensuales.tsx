'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface MesData {
  mes: string   // "Ene", "Feb", etc.
  ingresos: number
}

interface Props { data: MesData[] }

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.[0]) return null
  return (
    <div style={{
      background: '#1e1e1e', border: '1px solid #3a3a3a',
      borderRadius: 8, padding: '10px 14px', fontSize: '.82rem',
    }}>
      <p style={{ color: '#d4c5a9', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#5ecf87', fontWeight: 600 }}>{formatARS(payload[0].value)}</p>
    </div>
  )
}

export default function GraficoBarrasMensuales({ data }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'transparent',
          border: '1px solid #3a3a3a',
          borderRadius: 8,
          color: '#7a7060',
          fontSize: '.8rem',
          fontWeight: 600,
          padding: '7px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'color .15s, border-color .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#c9a84c'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9a84c' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#7a7060'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3a3a3a' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16V8M12 16v-5M17 16v-8"/>
        </svg>
        {open ? 'Ocultar gráfico mensual' : 'Ver gráfico mensual'}
      </button>

      {open && (
        <div style={{
          background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 12,
          padding: '16px 20px', marginTop: 10,
        }}>
          <p style={{
            fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '1px',
            color: 'var(--muted)', fontWeight: 600, marginBottom: 12,
          }}>
            Ingresos por productos — últimos 6 meses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barSize={32}>
              <XAxis dataKey="mes" tick={{ fill: '#7a7060', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,76,.08)' }} />
              <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i === data.length - 1 ? '#c9a84c' : '#3a3a3a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
