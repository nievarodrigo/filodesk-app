import { z } from 'zod'

const IsoDateTimeString = z
  .string()
  .min(1, 'Ingresá una fecha y hora válida.')
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Fecha/hora inválida.' })

const PhoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s()\-]{7,}$/,
    { message: 'Ingresá un teléfono válido.' })

export const CreateAppointmentSchema = z.object({
  barberId: z.string().uuid('Barbero inválido.'),
  clientName: z.string().trim().min(2, 'Ingresá el nombre del cliente.'),
  clientPhone: z.union([PhoneSchema, z.literal('')]).optional(),
  serviceId: z.string().uuid('Servicio inválido.').nullable().optional(),
  startTime: IsoDateTimeString,
  endTime: IsoDateTimeString,
  notes: z.string().trim().max(500, 'Máximo 500 caracteres.').optional(),
})

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
})
