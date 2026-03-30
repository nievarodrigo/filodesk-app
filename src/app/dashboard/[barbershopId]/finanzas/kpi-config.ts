import type { LucideIcon } from 'lucide-react'
import { DollarSign, Package, PieChart, TrendingUp } from 'lucide-react'

export type KpiTone = 'positive' | 'negative' | 'gold' | 'muted' | 'default'

export type InteractiveKpi = {
  id: 'ingresos' | 'gastos' | 'comisiones' | 'neto'
  label: string
  value: string
  help: string
  delta: number | null
  valueTone: KpiTone
  deltaMode: 'normal' | 'inverse'
}

export type StrategicKpi = {
  id: 'ingresos-brutos' | 'ticket-aov' | 'ventas-productos' | 'margen-operativo'
  label: string
  value: string
  detail: string
  help: string
  delta: number | null
  icon: LucideIcon
  valueTone: KpiTone
}

export type OperationalKpi = {
  id: 'ticket-promedio' | 'mejor-dia' | 'proyeccion' | 'margen-ganancia'
  label: string
  value: string
  detail: string
  help: string
  cardVariant: 'default' | 'forecast'
  valueTone: KpiTone
}

type BuildFinanceKpiConfigsInput = {
  formatARS: (n: number) => string
  ingresosMes: number
  gastosMes: number
  comisionesMes: number
  netoMes: number
  ingDelta: number
  gasDelta: number
  ticketPromedio: number
  totalServicios: number
  ticketDelta: number
  ingProductos: number
  productUnits: number
  prodDelta: number
  margenOperativo: number
  margenOperativoDelta: number
  bestDayName: string | null
  bestDayAvg: number | null
  isProjectionAvailable: boolean
  proyeccion: number | null
  dayOfMonth: number
  daysInMonth: number
  marginPct: number
}

export function buildFinanceKpiConfigs(input: BuildFinanceKpiConfigsInput) {
  const {
    formatARS,
    ingresosMes,
    gastosMes,
    comisionesMes,
    netoMes,
    ingDelta,
    gasDelta,
    ticketPromedio,
    totalServicios,
    ticketDelta,
    ingProductos,
    productUnits,
    prodDelta,
    margenOperativo,
    margenOperativoDelta,
    bestDayName,
    bestDayAvg,
    isProjectionAvailable,
    proyeccion,
    dayOfMonth,
    daysInMonth,
    marginPct,
  } = input

  const interactiveKpis: InteractiveKpi[] = [
    {
      id: 'ingresos',
      label: 'Ingresos',
      value: formatARS(ingresosMes),
      delta: ingDelta,
      help: 'Todo lo que ingresó en el período, sumando servicios y productos.',
      valueTone: 'positive',
      deltaMode: 'normal',
    },
    {
      id: 'gastos',
      label: 'Gastos',
      value: formatARS(gastosMes),
      delta: gasDelta,
      help: 'Suma de egresos cargados: alquiler, insumos, sueldos y otros gastos.',
      valueTone: 'negative',
      deltaMode: 'inverse',
    },
    {
      id: 'comisiones',
      label: 'Comisiones',
      value: formatARS(comisionesMes),
      delta: null,
      help: 'Monto total destinado a comisiones de barberos según porcentaje configurado.',
      valueTone: 'muted',
      deltaMode: 'normal',
    },
    {
      id: 'neto',
      label: 'Neto',
      value: formatARS(netoMes),
      delta: null,
      help: 'Resultado final estimado: Ingresos - (Gastos + Comisiones).',
      valueTone: netoMes >= 0 ? 'positive' : 'negative',
      deltaMode: 'normal',
    },
  ]

  const strategicKpis: StrategicKpi[] = [
    {
      id: 'ingresos-brutos',
      label: 'Ingresos Brutos',
      value: formatARS(ingresosMes),
      detail: 'Ventas + servicios del período',
      help: 'Total bruto de dinero ingresado por ventas de servicios y productos.',
      delta: ingDelta,
      icon: DollarSign,
      valueTone: 'positive',
    },
    {
      id: 'ticket-aov',
      label: 'Ticket Promedio (AOV)',
      value: formatARS(ticketPromedio),
      detail: `${totalServicios} ventas de servicio`,
      help: 'Promedio de dinero por servicio vendido. Fórmula: Ingresos de servicios / Total de servicios.',
      delta: ticketDelta,
      icon: TrendingUp,
      valueTone: 'gold',
    },
    {
      id: 'ventas-productos',
      label: 'Ventas de Productos',
      value: formatARS(ingProductos),
      detail: `${productUnits} unidades vendidas`,
      help: 'Ingresos generados por retail: pomadas, aceites y demás productos vendidos.',
      delta: prodDelta,
      icon: Package,
      valueTone: 'positive',
    },
    {
      id: 'margen-operativo',
      label: 'Margen Operativo (Estimado)',
      value: formatARS(margenOperativo),
      detail: 'Ingresos - gastos registrados',
      help: 'Ganancia operativa estimada antes de comisiones. Fórmula: Ingresos - Gastos.',
      delta: margenOperativoDelta,
      icon: PieChart,
      valueTone: margenOperativo >= 0 ? 'positive' : 'negative',
    },
  ]

  const projectionValue = isProjectionAvailable && proyeccion !== null ? formatARS(proyeccion) : 'N/A'
  const projectionDetail = isProjectionAvailable
    ? `Día ${dayOfMonth} de ${daysInMonth} al ritmo actual`
    : 'Proyección solo disponible en vista mensual'

  const operationalKpis: OperationalKpi[] = [
    {
      id: 'ticket-promedio',
      label: 'Ticket Promedio',
      value: formatARS(ticketPromedio),
      valueTone: 'gold',
      detail: `${totalServicios} servicios realizados`,
      help: 'Es el promedio que deja cada cliente por servicio. Se calcula: Ingresos / Total de servicios.',
      cardVariant: 'default',
    },
    {
      id: 'mejor-dia',
      label: 'Mejor Día',
      value: bestDayName ?? '—',
      valueTone: bestDayName ? 'positive' : 'muted',
      detail: bestDayName && bestDayAvg !== null
        ? `${formatARS(bestDayAvg)} promedio por ${bestDayName.toLowerCase()}`
        : 'Sin datos suficientes',
      help: 'Identifica el día con mejor rendimiento promedio para planificar turnos y promos.',
      cardVariant: 'default',
    },
    {
      id: 'proyeccion',
      label: 'Proyección',
      value: projectionValue,
      valueTone: isProjectionAvailable ? 'gold' : 'muted',
      detail: projectionDetail,
      help: 'Estimación de cierre del mes usando el ritmo actual. Fórmula: (Ingresos / Día actual) * Días del mes.',
      cardVariant: 'forecast',
    },
    {
      id: 'margen-ganancia',
      label: 'Margen de Ganancia',
      value: `${marginPct}%`,
      valueTone: marginPct > 30 ? 'positive' : (marginPct >= 15 ? 'gold' : 'negative'),
      detail: ingresosMes > 0
        ? `${formatARS(netoMes)} neto sobre ${formatARS(ingresosMes)} ingresados`
        : 'Sin ingresos para calcular',
      help: 'Porcentaje de ingresos que queda libre después de pagar gastos y comisiones.',
      cardVariant: 'default',
    },
  ]

  return {
    strategicKpis,
    interactiveKpis,
    operationalKpis,
  }
}
