import type { QuoteBreakdown } from '@/types/booking'
import { BUSINESS_RULES } from '@/lib/business-rules'

export const RATES = {
  BASE: BUSINESS_RULES.baseRateGbp,
  DRIVE_PER_HOUR: BUSINESS_RULES.driveRatePerHourGbp,
  WAIT_PER_HOUR: BUSINESS_RULES.waitRatePerHourGbp,
} as const

export function buildQuote(
  coaches: number,
  totalDriveMinutes: number,
  totalWaitMinutes: number,
): QuoteBreakdown {
  if (!Number.isFinite(coaches) || coaches < 1) {
    throw new RangeError('coaches must be at least 1')
  }
  const drivingCost = (totalDriveMinutes / 60) * RATES.DRIVE_PER_HOUR
  const waitingCost = (totalWaitMinutes / 60) * RATES.WAIT_PER_HOUR
  const subtotal = RATES.BASE + drivingCost + waitingCost
  return {
    baseRate: RATES.BASE,
    drivingCost,
    waitingCost,
    coachCount: coaches,
    subtotal,
    total: subtotal * coaches,
  }
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
