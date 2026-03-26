export type Expense = {
  id: string
  barbershop_id: string
  description: string
  amount: number
  category: string
  date: string
  created_at: string
}

export type CreateExpenseInput = {
  description: string
  amount: number
  category: string
  date: string
}
