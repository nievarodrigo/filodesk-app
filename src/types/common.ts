export type ActionState = {
  errors?: Record<string, string[]>
  message?: string
} | undefined

export type DateRange = {
  from: string
  to: string
}
