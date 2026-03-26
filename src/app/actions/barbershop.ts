'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateBarbershopSchema, CreateBarbershopState } from '@/lib/validations/barbershop'
import * as barbershopService from '@/services/barbershop.service'

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
