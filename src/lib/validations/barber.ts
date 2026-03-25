import { z } from 'zod'

export const CreateBarberSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).trim(),
  commission_pct: z
    .number({ invalid_type_error: 'Ingresá un porcentaje válido.' })
    .min(0)
    .max(100),
})

export type CreateBarberState = {
  errors?: { name?: string[]; commission_pct?: string[] }
  message?: string
} | undefined
