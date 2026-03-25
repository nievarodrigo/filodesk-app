'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface ProductoData {
  name: string
  cantidad: number
  ingresos: number
}

interface Props { data: ProductoData[] }

const COLORS = ['#c9a84c', '#5ecf87', '#7eb8f7', '#e07070', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#1e1e1e', border: '1px solid #3a3a3a',
      borderRadius: 8, padding: '10px 14px', fontSize: '.82rem',
    }}>
      <p style={{ color: '#d4c5a9', fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: '#7a7060' }}>{d.cantidad} u. vendidas</p>
      <p style={{ color: '#5ecf87', fontWeight: 600 }}>{formatARS(d.ingresos)}</p>
    </div>
  )
}

const renderLabel = ({ name, percent }: any) =>
  percent > 0.07 ? `${Math.round(percent * 100)}%` : ''

export default function GraficoProductos({ data }: Props) {
  if (data.length === 0) return null

  return (
    <div style={{
      background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: 12,
      padding: '16px 20px', marginBottom: 20,
    }}>
      <p style={{
        fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '1px',
        color: 'var(--muted)', fontWeight: 600, marginBottom: 12,
      }}>
        Más vendidos (últimos 90 días)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="ingresos"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={45}
            paddingAngle={2}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(v) => v}
            wrapperStyle={{ fontSize: '.78rem', color: '#7a7060' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
