'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccess } from '@/lib/permissions'
import { getServerAuthContext } from '@/services/auth.service'
import { isFeatureEnabled } from '@/services/plan.service'

export type InviteMemberState =
  | {
      success?: boolean
      message?: string
      errors?: {
        email?: string[]
        role?: string[]
      }
    }
  | undefined

const ALLOWED_ROLES = new Set(['manager', 'barber'])

async function findAuthUserByEmail(email: string) {
  const serviceClient = createServiceClient()
  let page = 1
  const normalizedEmail = email.toLowerCase()

  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) return { error: error.message }

    const found = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)
    if (found) return { user: found }
    if (data.users.length < 200) return { user: null }

    page += 1
  }
}

export async function inviteMember(
  barbershopId: string,
  _state: InviteMemberState,
  formData: FormData
): Promise<InviteMemberState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const role = String(formData.get('role') ?? '').trim()

  const errors: NonNullable<InviteMemberState>['errors'] = {}
  if (!email || !email.includes('@')) errors.email = ['Ingresá un email válido.']
  if (!ALLOWED_ROLES.has(role)) errors.role = ['Seleccioná un rol válido.']
  if (errors.email || errors.role) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const context = await getServerAuthContext(supabase, barbershopId, user.id)
  if (!context || !canAccess(context.role, 'manage_members')) {
    redirect(`/dashboard/${barbershopId}`)
  }

  if (!isFeatureEnabled(context.plan, 'multi_user')) {
    return { message: 'Tu plan actual no habilita la gestión de miembros.' }
  }

  // Justificado: necesitamos consultar auth.users y crear miembros aunque RLS no exponga
  // estos datos a managers. El acceso queda protegido por getServerAuthContext.
  const userLookup = await findAuthUserByEmail(email)
  if ('error' in userLookup) return { message: 'No se pudo validar el usuario. Intentá de nuevo.' }
  if (!userLookup.user) return { message: 'No existe un usuario registrado con ese email.' }

  const serviceClient = createServiceClient()

  const { data: barbershop, error: barbershopError } = await serviceClient
    .from('barbershops')
    .select('owner_id')
    .eq('id', barbershopId)
    .single()

  if (barbershopError || !barbershop) {
    return { message: 'No se pudo validar la barbería.' }
  }

  if (barbershop.owner_id === userLookup.user.id) {
    return { message: 'Ese usuario ya es el dueño de la barbería.' }
  }

  const { data: existingMember } = await serviceClient
    .from('barbershop_members')
    .select('id')
    .eq('barbershop_id', barbershopId)
    .eq('user_id', userLookup.user.id)
    .maybeSingle()

  if (existingMember) {
    return { message: 'Ese usuario ya forma parte del equipo.' }
  }

  const { error: insertError } = await serviceClient
    .from('barbershop_members')
    .insert({
      barbershop_id: barbershopId,
      user_id: userLookup.user.id,
      role,
    })

  if (insertError) {
    return { message: 'No se pudo invitar al miembro.' }
  }

  revalidatePath(`/dashboard/${barbershopId}/equipo`)
  return { success: true, message: 'Miembro agregado al equipo.' }
}
