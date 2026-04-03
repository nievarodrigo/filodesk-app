'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CreateBarbershopSchema, CreateBarbershopState } from '@/lib/validations/barbershop'
import * as barbershopService from '@/services/barbershop.service'

export type UpdateBarbershopState = { error?: string; success?: boolean }

export async function updateBarbershop(
  barbershopId: string,
  _state: UpdateBarbershopState,
  formData: FormData
): Promise<UpdateBarbershopState> {
  const name = (formData.get('name') as string | null)?.trim()
  const address = (formData.get('address') as string | null)?.trim() || null
  const phone = (formData.get('phone') as string | null)?.trim() || null

  if (!name || name.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error } = await supabase
    .from('barbershops')
    .update({ name, address, phone })
    .eq('id', barbershopId)

  if (error) return { error: 'No se pudo guardar. Intentá de nuevo.' }

  revalidatePath(`/dashboard/${barbershopId}/configuracion`)
  revalidatePath(`/dashboard/${barbershopId}`)
  return { success: true }
}

export async function createBarbershop(
  _state: CreateBarbershopState,
  formData: FormData
): Promise<CreateBarbershopState> {
  const validated = CreateBarbershopSchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address') || undefined,
    phone: formData.get('phone'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await barbershopService.createBarbershop(supabase, user.id, validated.data)
  if (result.error) return { message: result.error }

  redirect(`/dashboard/${result.id}`)
}
