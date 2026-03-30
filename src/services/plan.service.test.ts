import { describe, expect, it } from 'vitest'
import { getPlanLimit, isFeatureEnabled } from '@/services/plan.service'

describe('plan.service entitlements', () => {
  it('keeps multi_user disabled for Base', () => {
    expect(isFeatureEnabled('Base', 'multi_user')).toBe(false)
  })

  it('enables multi_user for Pro', () => {
    expect(isFeatureEnabled('Pro', 'multi_user')).toBe(true)
  })

  it('enables ia_predict for Premium IA', () => {
    expect(isFeatureEnabled('Premium IA', 'ia_predict')).toBe(true)
  })

  it('keeps export_data disabled for Base', () => {
    expect(isFeatureEnabled('Base', 'export_data')).toBe(false)
  })

  it('limits Base to 6 barbers', () => {
    expect(getPlanLimit('Base', 'barbers')).toBe(6)
  })
})
