export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Appointment {
  id: string
  barbershop_id: string
  barber_id: string
  client_name: string
  client_phone: string | null
  service_id: string | null
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string | null
}

export interface CreateAppointmentInput {
  barberId: string
  clientName: string
  clientPhone?: string
  serviceId?: string | null
  startTime: string
  endTime: string
  notes?: string
}

export interface AgendaAppointmentView {
  id: string
  barberId: string
  clientName: string
  clientPhone: string | null
  serviceId: string | null
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes: string | null
  barberName: string
  serviceName: string
}

export interface AgendaBarber {
  id: string
  name: string
}

export interface AgendaService {
  id: string
  name: string
  durationMin: number
}
