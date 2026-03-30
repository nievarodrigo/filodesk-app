import { describe, expect, it } from 'vitest'
import {
  calculateDiscountedMonthlyPrice,
  calculateRenewsAt,
  calculateSubscriptionTotal,
} from '@/services/subscription.service'

describe('subscription.service pricing', () => {
  it('keeps the base price for 1 month', () => {
    expect(calculateDiscountedMonthlyPrice(11999, 1)).toBe(11999)
    expect(calculateSubscriptionTotal(11999, 1)).toBe(11999)
  })

  it('applies 8% discount for 3 months', () => {
    expect(calculateDiscountedMonthlyPrice(11999, 3)).toBe(11039)
    expect(calculateSubscriptionTotal(11999, 3)).toBe(33117)
  })

  it('applies 20% discount for 12 months', () => {
    expect(calculateDiscountedMonthlyPrice(11999, 12)).toBe(9599)
    expect(calculateSubscriptionTotal(11999, 12)).toBe(115188)
  })
})

describe('subscription.service dates', () => {
  it('calculates renewsAt by adding exact months', () => {
    expect(calculateRenewsAt(new Date('2026-03-29T10:00:00.000Z'), 1)).toBe('2026-04-29T10:00:00.000Z')
    expect(calculateRenewsAt(new Date('2026-03-29T10:00:00.000Z'), 3)).toBe('2026-06-29T10:00:00.000Z')
    expect(calculateRenewsAt(new Date('2026-03-29T10:00:00.000Z'), 12)).toBe('2027-03-29T10:00:00.000Z')
  })
})
