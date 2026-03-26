export type Payroll = {
  id: string
  barbershop_id: string
  barber_id: string
  period_start: string
  period_end: string
  total_sales: number
  commission_pct: number
  commission_amount: number
  status: 'pending' | 'paid'
  paid_at: string | null
  created_at: string
}

export type PayrollWithRelations = Payroll & {
  barbers: { name: string }
}

export type CreatePayrollInput = {
  barber_id: string
  period_start: string
  period_end: string
}
