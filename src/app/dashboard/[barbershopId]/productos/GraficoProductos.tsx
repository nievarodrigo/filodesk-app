'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TooltipContent } from '@/lib/definitions'

interface ProductoData {
  name: string
  cantidad: number
  ingresos: number
}

interface Props { data: ProductoData[] }

const COLORS = ['var(--gold)', '#5ecf87', '#7eb8f7', '#e07070', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const CustomTooltip = ({ active, payload }: TooltipContent) => {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload as unknown as ProductoData
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: '.82rem',
    }}>
      <p style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: 'var(--muted)' }}>{d.cantidad} u. vendidas</p>
      <p style={{ color: '#5ecf87', fontWeight: 600 }}>{formatARS(d.ingresos)}</p>
    </div>
  )
}

const renderLabel = (props: { percent?: number }) => {
  const { percent } = props
  return percent && percent > 0.07 ? `${Math.round(percent * 100)}%` : ''
}

export default function GraficoProductos({ data }: Props) {
  if (data.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
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
            wrapperStyle={{ fontSize: '.78rem', color: 'var(--muted)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
