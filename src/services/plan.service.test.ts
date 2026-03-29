import { describe, expect, it } from 'vitest'
import { isFeatureEnabled } from '@/services/plan.service'

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
})
