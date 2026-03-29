const PLAN_FEATURES = {
  Base: {
    sales: true,
    expenses: true,
    stock: true,
    multi_user: false,
    ia_predict: false,
  },
  Pro: {
    sales: true,
    expenses: true,
    stock: true,
    multi_user: true,
    ia_predict: false,
  },
  'Premium IA': {
    sales: true,
    expenses: true,
    stock: true,
    multi_user: true,
    ia_predict: true,
  },
} as const

type PlanFeature = keyof (typeof PLAN_FEATURES)['Base']

export function isFeatureEnabled(planName: string | null, feature: string): boolean {
  const normalizedPlan = planName ?? 'Base'
  const features = PLAN_FEATURES[normalizedPlan as keyof typeof PLAN_FEATURES] ?? PLAN_FEATURES.Base

  if (!(feature in features)) return false

  return features[feature as PlanFeature]
}
