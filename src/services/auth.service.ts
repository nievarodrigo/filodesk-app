import { SupabaseClient } from '@supabase/supabase-js'

export async function loginUser(
  supabase: SupabaseClient,
  { email, password }: { email: string; password: string }
) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email o contraseña incorrectos.' }
  return {}
}

export async function registerUser(
  supabase: SupabaseClient,
  { firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string },
  siteUrl: string
) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { first_name: firstName, last_name: lastName },
    },
  })
  if (error) return { error: `Error: ${error.message}` }
  return {}
}

export async function logoutUser(supabase: SupabaseClient) {
  await supabase.auth.signOut()
}

export async function verifyTurnstile(token: string): Promise<boolean> {
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
