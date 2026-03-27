'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import * as adminRepo from '@/repositories/admin.repository'

async function requireAdmin() {
  const supabase = createServiceClient()
  const { createClient } = await import('@/lib/supabase/server')
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) redirect('/auth/login')
  const isAdmin = await adminRepo.isAdminEmail(supabase, user.email!)
  if (!isAdmin) redirect('/')
  return supabase
}

export async function addExpense(formData: FormData) {
  const supabase = await requireAdmin()
  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const category = formData.get('category') as string
  const date = formData.get('date') as string

  if (!description || isNaN(amount) || !category || !date) return

  await adminRepo.insertExpense(supabase, { description, amount, category, date })
  revalidatePath('/admin')
  revalidatePath('/admin/gastos')
}

export async function deleteExpense(id: string) {
  const supabase = await requireAdmin()
  await adminRepo.deleteExpense(supabase, id)
  revalidatePath('/admin')
  revalidatePath('/admin/gastos')
}
