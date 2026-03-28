'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { TooltipContent } from '@/lib/definitions'

interface MesData {
  mes: string
  ingresos: number
  gastos: number
}

interface Props { data: MesData[] }

function fmtFull(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}
function fmtARS(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${n}`
}

const CustomTooltip = ({ active, payload, label }: TooltipContent) => {
  if (!active || !payload?.length) return null
  const ing = payload.find((p) => p.dataKey === 'ingresos')?.value ?? 0
  const gas = payload.find((p) => p.dataKey === 'gastos')?.value ?? 0
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '.82rem' }}>
      <p style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: 6 }}>{label}</p>
      <p style={{ color: '#5ecf87' }}>Ingresos: {fmtFull(ing)}</p>
      <p style={{ color: '#e07070' }}>Gastos: {fmtFull(gas)}</p>
      <p style={{ color: 'var(--gold)', fontWeight: 700, marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
        Neto: {fmtFull(ing - gas)}
      </p>
    </div>
  )
}

export default function ResumenMensual({ data }: Props) {
  if (data.length === 0) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
      <p style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>
        Ingresos vs Gastos — últimos 6 meses
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hover)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtARS} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Legend wrapperStyle={{ fontSize: '.78rem', color: 'var(--muted)' }} />
          <Bar dataKey="ingresos" fill="#5ecf87" radius={[3, 3, 0, 0]} name="Ingresos" />
          <Bar dataKey="gastos" fill="#e07070" radius={[3, 3, 0, 0]} name="Gastos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
