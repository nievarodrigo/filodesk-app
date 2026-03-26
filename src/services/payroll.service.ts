import { SupabaseClient } from '@supabase/supabase-js'
import * as barberRepo from '@/repositories/barber.repository'
import * as saleRepo from '@/repositories/sale.repository'
import * as payrollRepo from '@/repositories/payroll.repository'

export async function createPayroll(
  supabase: SupabaseClient,
  barbershopId: string,
  { barber_id, period_start, period_end }: { barber_id: string; period_start: string; period_end: string }
) {
  const barber = await barberRepo.findById(supabase, barber_id)
  if (!barber) return { error: 'Barbero no encontrado.' }

  const totalSales = await saleRepo.sumByBarberAndRange(supabase, barbershopId, barber_id, period_start, period_end)
  const commissionAmount = Math.round(totalSales * barber.commission_pct / 100)

  const { error } = await payrollRepo.insert(supabase, {
    barbershop_id: barbershopId,
    barber_id,
    period_start,
    period_end,
    total_sales: totalSales,
    commission_pct: barber.commission_pct,
    commission_amount: commissionAmount,
    status: 'pending',
  })

  if (error) return { error: 'No se pudo crear la nómina.' }
  return {}
}

export async function markPaid(supabase: SupabaseClient, nominaId: string) {
  await payrollRepo.markPaid(supabase, nominaId)
}

export async function deletePayroll(supabase: SupabaseClient, nominaId: string) {
  await payrollRepo.deleteById(supabase, nominaId)
}
