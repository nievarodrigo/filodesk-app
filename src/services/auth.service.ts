// Build Version: 2026-03-29.01 (Force clean build)
import { SupabaseClient } from '@supabase/supabase-js'
import { BarbershopRole } from '@/lib/definitions'
import { PERMISSIONS_BY_ROLE } from '@/lib/permissions'
import * as barbershopRepo from '@/repositories/barbershop.repository'
import * as memberRepo from '@/repositories/member.repository'
import { isFeatureEnabled } from '@/services/plan.service'

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

export async function getServerAuthContext(
  supabase: SupabaseClient,
  barbershopId: string,
  userId: string,
  privilegedSupabase?: SupabaseClient
): Promise<{ role: BarbershopRole; plan: string; permissions: string[] } | null> {
  const authLookupClient = privilegedSupabase ?? supabase

  const barbershop = await barbershopRepo.findById(authLookupClient, barbershopId)
  if (!barbershop) return null

  const planName = barbershop.plan_name ?? 'Base'

  let role: BarbershopRole | null = null

  if (userId === barbershop.owner_id) {
    role = 'owner'
  } else {
    role = await memberRepo.getMemberRole(authLookupClient, barbershopId, userId)
  }

  if (!role) return null

  if ((role === 'manager' || role === 'barber') && !isFeatureEnabled(planName, 'multi_user')) {
    return null
  }

  return {
    role,
    plan: planName,
    permissions: PERMISSIONS_BY_ROLE[role],
  }
}
