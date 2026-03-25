'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RegisterSchema, LoginSchema, type AuthFormState } from '@/lib/definitions'

export type AuthState = AuthFormState

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = await res.json()
  return data.success === true
}

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { message: 'Email o contraseña incorrectos.' }
  }

  redirect('/dashboard')
}

export async function register(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  // TODO: reactivar Turnstile cuando se configure el dominio en Cloudflare
  // const turnstileToken = formData.get('cf-turnstile-response') as string
  // const captchaOk = await verifyTurnstile(turnstileToken || '')
  // if (!captchaOk) return { message: 'Verificación de seguridad fallida. Intentá de nuevo.' }

  const validated = RegisterSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { firstName, lastName, email, password } = validated.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: { first_name: firstName, last_name: lastName },
    },
  })

  if (error) {
    return { message: `Error: ${error.message}` }
  }

  redirect('/auth/verify-email')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
