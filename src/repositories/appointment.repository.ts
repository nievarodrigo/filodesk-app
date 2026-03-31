import { SupabaseClient } from '@supabase/supabase-js'
import type { AppointmentStatus } from '@/types'

export async function listByRange(
  supabase: SupabaseClient,
  barbershopId: string,
  fromISO: string,
  toISO: string,
  barberId?: string
) {
  let query = supabase
    .from('appointments')
    .select('id, barber_id, client_name, client_phone, service_id, start_time, end_time, status, notes, barbers(name, last_name), service_types(name)')
    .eq('barbershop_id', barbershopId)
    .gte('start_time', fromISO)
    .lt('start_time', toISO)
    .order('start_time', { ascending: true })

  if (barberId) {
    query = query.eq('barber_id', barberId)
  }

  return query
}

export async function findConflicts(
  supabase: SupabaseClient,
  barbershopId: string,
  barberId: string,
  startISO: string,
  endISO: string,
  excludeAppointmentId?: string
) {
  let query = supabase
    .from('appointments')
    .select('id')
    .eq('barbershop_id', barbershopId)
    .eq('barber_id', barberId)
    .in('status', ['pending', 'confirmed'])
    .lt('start_time', endISO)
    .gt('end_time', startISO)
    .limit(1)

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId)
  }

  return query
}

export async function insert(
  supabase: SupabaseClient,
  data: {
    barbershop_id: string
    barber_id: string
    client_name: string
    client_phone?: string | null
    service_id?: string | null
    start_time: string
    end_time: string
    status?: AppointmentStatus
    notes?: string | null
  }
) {
  return supabase.from('appointments').insert(data)
}

export async function updateStatus(
  supabase: SupabaseClient,
  barbershopId: string,
  appointmentId: string,
  status: AppointmentStatus
) {
  return supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .eq('barbershop_id', barbershopId)
}

export async function softDelete(
  supabase: SupabaseClient,
  barbershopId: string,
  appointmentId: string
) {
  return supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('barbershop_id', barbershopId)
}
