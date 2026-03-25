'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface BarberData {
  name: string
  total: number
  comision: number
}

interface Props { data: BarberData[] }

function fmtFull(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const COLORS = ['#c9a84c', '#5ecf87', '#7eb8f7', '#e07070', '#a78bfa', '#fb923c']

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 8, padding: '10px 14px', fontSize: '.82rem' }}>
      <p style={{ color: '#d4c5a9', fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: '#5ecf87' }}>Facturado: {fmtFull(d.total)}</p>
      <p style={{ color: '#c9a84c' }}>Comisión: {fmtFull(d.comision)}</p>
    </div>
  )
}

export default function VentasPorBarbero({ data }: Props) {
  if (data.length === 0) return null
  return (
    <div style={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 12, padding: '16px 20px' }}>
      <p style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>
        Ventas por barbero — mes actual
      </p>
      <ResponsiveContainer width="100%" height={Math.max(140, data.length * 52)}>
        <BarChart data={data} layout="vertical" barSize={20} margin={{ left: 10, right: 20 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fill: '#d4c5a9', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
