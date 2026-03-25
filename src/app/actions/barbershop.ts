'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateBarbershopSchema, CreateBarbershopState } from '@/lib/validations/barbershop'

export async function createBarbershop(
  _state: CreateBarbershopState,
  formData: FormData
): Promise<CreateBarbershopState> {
  const validated = CreateBarbershopSchema.safeParse({
    name:    formData.get('name'),
    address: formData.get('address') || undefined,
    phone:   formData.get('phone'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data, error } = await supabase
    .from('barbershops')
    .insert({
      owner_id: user.id,
      name:     validated.data.name,
      address:  validated.data.address,
      phone:    validated.data.phone,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createBarbershop]', error.message)
    return { message: 'No se pudo crear la barbería. Intentá de nuevo.' }
  }

  redirect(`/dashboard/${data.id}`)
}
