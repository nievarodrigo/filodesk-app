import { z } from 'zod'

export const CreateVentaSchema = z.object({
  barber_id:       z.string().uuid({ message: 'Seleccioná un barbero.' }),
  service_type_id: z.string().uuid({ message: 'Seleccioná un servicio.' }),
  amount:          z.number({ invalid_type_error: 'Ingresá un monto válido.' }).positive({ message: 'El monto debe ser mayor a 0.' }),
  date:            z.string().min(1, { message: 'Ingresá la fecha.' }),
  notes:           z.string().trim().optional(),
})

export type CreateVentaState = {
  errors?: {
    barber_id?: string[]
    service_type_id?: string[]
    amount?: string[]
    date?: string[]
    notes?: string[]
  }
  message?: string
} | undefined
