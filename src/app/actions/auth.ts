'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RegisterSchema, LoginSchema, type AuthFormState } from '@/lib/definitions'
import { getSiteUrl } from '@/lib/vercel-url'
import * as authService from '@/services/auth.service'

export type AuthState = AuthFormState

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const result = await authService.loginUser(supabase, validated.data)
  if (result.error) return { message: result.error }

  redirect('/dashboard')
}

export async function register(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  // TODO: reactivar Turnstile cuando se configure el dominio en Cloudflare
  // const turnstileToken = formData.get('cf-turnstile-response') as string
  // const captchaOk = await authService.verifyTurnstile(turnstileToken || '')
  // if (!captchaOk) return { message: 'Verificación de seguridad fallida. Intentá de nuevo.' }

  const validated = RegisterSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
  const result = await authService.registerUser(supabase, validated.data, siteUrl)
  if (result.error) return { message: result.error }

  redirect('/auth/verify-email')
}

export async function logout() {
  const supabase = await createClient()
  await authService.logoutUser(supabase)
  redirect('/')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const redirectTo = `${getSiteUrl()}/auth/callback?next=/dashboard`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error || !data.url) {
    redirect('/auth/login?error=google_oauth_failed')
  }

  redirect(data.url)
}
