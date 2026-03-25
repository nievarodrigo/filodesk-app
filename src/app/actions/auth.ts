'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type AuthState = {
  errors?: { email?: string[]; password?: string[] }
  message?: string
  success?: string
}

export async function login(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validated = LoginSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email:    validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { message: 'Email o contraseña incorrectos.' }
  }

  redirect('/dashboard')
}

export async function register(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validated = RegisterSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email:    validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { message: error.message }
  }

  // Si confirmación de email está desactivada, redirigir directo
  redirect('/dashboard')
}
