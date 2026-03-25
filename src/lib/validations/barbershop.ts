import { z } from 'zod'

export const CreateBarbershopSchema = z.object({
  name:    z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).trim(),
  address: z.string().trim().optional(),
  phone:   z.string().trim().min(6, { message: 'Ingresá un teléfono válido.' }),
})

export type CreateBarbershopState =
  | { errors?: { name?: string[]; address?: string[]; phone?: string[] }; message?: string }
  | undefined
