import { z } from 'zod'

const PhoneSchema = z
  .string()
  .trim()
  .min(8, { message: 'Ingresá un teléfono válido.' })
  .regex(/^[+\d][\d\s()\-]{7,}$/, { message: 'Ingresá un teléfono válido.' })

export const CreateBarberSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).trim(),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }).trim(),
  email: z.string().trim().email({ message: 'Ingresá un email válido.' }),
  phone: PhoneSchema,
  commission_pct: z
    .number({ error: 'Ingresá un porcentaje válido.' })
    .min(0)
    .max(100),
})

export const UpdateBarberDataSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).trim(),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }).trim(),
  email: z.string().trim().email({ message: 'Ingresá un email válido.' }),
  phone: PhoneSchema,
})

export type CreateBarberState = {
  errors?: { name?: string[]; lastName?: string[]; email?: string[]; phone?: string[]; commission_pct?: string[] }
  message?: string
} | undefined
