import { SupabaseClient } from '@supabase/supabase-js'
import * as appointmentRepo from '@/repositories/appointment.repository'
import type { AgendaAppointmentView, AppointmentStatus, CreateAppointmentInput } from '@/types'

const DEFAULT_SERVICE_DURATION_MIN = 30
const FALLBACK_DURATIONS: Record<string, number> = {
  corte: 35,
  barba: 30,
  fade: 50,
  color: 70,
}

type JoinedAppointment = {
  id: string
  barber_id: string
  client_name: string
  client_phone: string | null
  service_id: string | null
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string | null
  barbers?: { name?: string | null; last_name?: string | null } | null
  service_types?: { name?: string | null } | null
}

function getDurationFallbackByName(name: string) {
  const lower = name.toLowerCase()
  const match = Object.entries(FALLBACK_DURATIONS).find(([key]) => lower.includes(key))
  return match ? match[1] : DEFAULT_SERVICE_DURATION_MIN
}

export async function getAgendaData(
  supabase: SupabaseClient,
  barbershopId: string,
  fromISO: string,
  toISO: string,
  barberId?: string
) {
  const [barbersRes, servicesRes, appointmentsRes] = await Promise.all([
    supabase
      .from('barbers')
      .select('id, name, last_name')
      .eq('barbershop_id', barbershopId)
      .eq('active', true)
      .order('name'),
    supabase
      .from('service_types')
      .select('id, name, duration_min, barbershop_id')
      .or(`barbershop_id.eq.${barbershopId},barbershop_id.is.null`)
      .eq('active', true)
      .order('name'),
    appointmentRepo.listByRange(supabase, barbershopId, fromISO, toISO, barberId),
  ])

  if (barbersRes.error) return { error: 'No se pudieron cargar los barberos.' }
  if (servicesRes.error) return { error: 'No se pudieron cargar los servicios.' }
  if (appointmentsRes.error) return { error: 'No se pudieron cargar los turnos.' }

  const barbers = (barbersRes.data ?? []).map((barber) => ({
    id: barber.id,
    name: `${barber.name ?? ''} ${barber.last_name ?? ''}`.trim() || 'Barbero',
  }))

  const ownNames = new Set(
    (servicesRes.data ?? [])
      .filter((service) => service.barbershop_id !== null)
      .map((service) => service.name.toLowerCase())
  )

  const services = (servicesRes.data ?? [])
    .filter((service) => service.barbershop_id !== null || !ownNames.has(service.name.toLowerCase()))
    .map((service) => ({
      id: service.id,
      name: service.name,
      durationMin: service.duration_min ?? getDurationFallbackByName(service.name),
    }))

  const appointments: AgendaAppointmentView[] = ((appointmentsRes.data ?? []) as JoinedAppointment[]).map((row) => ({
    id: row.id,
    barberId: row.barber_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    serviceId: row.service_id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    notes: row.notes,
    barberName: `${row.barbers?.name ?? ''} ${row.barbers?.last_name ?? ''}`.trim() || 'Barbero',
    serviceName: row.service_types?.name ?? 'Servicio',
  }))

  return { barbers, services, appointments }
}

export async function createAppointment(
  supabase: SupabaseClient,
  barbershopId: string,
  input: CreateAppointmentInput
) {
  const conflict = await appointmentRepo.findConflicts(
    supabase,
    barbershopId,
    input.barberId,
    input.startTime,
    input.endTime
  )

  if (conflict.error) {
    return { error: 'No se pudo validar la disponibilidad del turno.' }
  }

  if ((conflict.data ?? []).length > 0) {
    return { error: 'Ese horario ya está ocupado. Chequeá que quede al menos 5 min de margen.' }
  }

  const { error } = await appointmentRepo.insert(supabase, {
    barbershop_id: barbershopId,
    barber_id: input.barberId,
    client_name: input.clientName.trim(),
    client_phone: input.clientPhone?.trim() || null,
    service_id: input.serviceId ?? null,
    start_time: input.startTime,
    end_time: input.endTime,
    status: 'pending',
    notes: input.notes?.trim() || null,
  })

  if (error) return { error: 'No se pudo agendar el turno. Intentá de nuevo.' }
  return { success: true as const }
}

export async function updateAppointmentStatus(
  supabase: SupabaseClient,
  barbershopId: string,
  appointmentId: string,
  status: AppointmentStatus
) {
  const { error } = await appointmentRepo.updateStatus(supabase, barbershopId, appointmentId, status)
  if (error) return { error: 'No se pudo actualizar el estado del turno.' }
  return { success: true as const }
}

export async function cancelAppointment(
  supabase: SupabaseClient,
  barbershopId: string,
  appointmentId: string
) {
  const { error } = await appointmentRepo.softDelete(supabase, barbershopId, appointmentId)
  if (error) return { error: 'No se pudo cancelar el turno.' }
  return { success: true as const }
}
