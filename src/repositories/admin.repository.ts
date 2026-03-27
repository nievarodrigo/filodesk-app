import { SupabaseClient } from '@supabase/supabase-js'

export async function isAdminEmail(supabase: SupabaseClient, email: string) {
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .single()
  return !!data
}

export async function getSubscriptionStats(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('barbershops')
    .select('subscription_status, subscription_amount, created_at, trial_ends_at')
  return data ?? []
}

export async function getRecentClients(supabase: SupabaseClient, limit = 20) {
  const { data } = await supabase
    .from('barbershops')
    .select('id, name, created_at, subscription_status, subscription_starts_at, subscription_renews_at, subscription_amount, subscription_payment_method, trial_ends_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getExpensesForMonth(supabase: SupabaseClient, year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-31`
  const { data } = await supabase
    .from('admin_expenses')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
  return data ?? []
}

export async function getAllExpenses(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('admin_expenses')
    .select('*')
    .order('date', { ascending: false })
  return data ?? []
}

export async function insertExpense(
  supabase: SupabaseClient,
  data: { description: string; amount: number; category: string; date: string }
) {
  return supabase.from('admin_expenses').insert(data)
}

export async function deleteExpense(supabase: SupabaseClient, id: string) {
  return supabase.from('admin_expenses').delete().eq('id', id)
}
