import { z } from 'zod'

export const RegisterSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Ingresá tu nombre.' }).trim(),
    lastName: z.string().min(1, { message: 'Ingresá tu apellido.' }).trim(),
    email: z.string().email({ message: 'Ingresá un email válido.' }).trim(),
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
      .regex(/[a-zA-Z]/, { message: 'Debe contener al menos una letra.' })
      .regex(/[0-9]/, { message: 'Debe contener al menos un número.' })
      .trim(),
    confirmPassword: z.string().min(1, { message: 'Confirmá tu contraseña.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Ingresá un email válido.' }).trim(),
  password: z.string().min(1, { message: 'Ingresá tu contraseña.' }).trim(),
})

export type AuthFormState =
  | {
      errors?: {
        firstName?: string[]
        lastName?: string[]
        email?: string[]
        password?: string[]
        confirmPassword?: string[]
      }
      message?: string
    }
  | undefined
