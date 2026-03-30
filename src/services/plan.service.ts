export const PLAN_FEATURES = {
  Base: {
    sales: true,
    expenses: true,
    stock: true,
    multi_user: false,
    ia_predict: false,
    export_data: false,
  },
  Pro: {
    sales: true,
    expenses: true,
    stock: true,
    multi_user: true,
    ia_predict: false,
    export_data: true,
  },
  'Premium IA': {
    sales: true,
    expenses: true,
    stock: true,
    multi_user: true,
    ia_predict: true,
    export_data: true,
  },
} as const

export const PLAN_LIMITS = {
  Base: {
    barbers: 6,
  },
  Pro: {
    barbers: null,
  },
  'Premium IA': {
    barbers: null,
  },
} as const

type PlanFeature = keyof (typeof PLAN_FEATURES)['Base']
type PlanLimit = keyof (typeof PLAN_LIMITS)['Base']
type PlanName = keyof typeof PLAN_FEATURES

function normalizePlan(planName: string | null): PlanName {
  const normalizedPlan = planName ?? 'Base'

  return (normalizedPlan in PLAN_FEATURES ? normalizedPlan : 'Base') as PlanName
}

export function isFeatureEnabled(planName: string | null, feature: string): boolean {
  const normalizedPlan = normalizePlan(planName)
  const features = PLAN_FEATURES[normalizedPlan]

  if (!(feature in features)) return false

  return features[feature as PlanFeature]
}

export function getPlanLimit(planName: string | null, limit: string): number | null {
  const normalizedPlan = normalizePlan(planName)
  const limits = PLAN_LIMITS[normalizedPlan]

  if (!(limit in limits)) return null

  return limits[limit as PlanLimit]
}
