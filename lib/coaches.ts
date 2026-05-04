import { BUSINESS_RULES } from '@/lib/business-rules'

export const COACH_CAPACITY = BUSINESS_RULES.coachCapacity

export function coachCount(groupSize: number): number {
  if (!Number.isFinite(groupSize) || groupSize < 1) {
    throw new RangeError('groupSize must be at least 1')
  }
  return Math.ceil(groupSize / COACH_CAPACITY)
}

export function capacityWarning(groupSize: number): string | null {
  const coaches = coachCount(groupSize)
  if (coaches === 1) return null
  return `Your group needs ${coaches} coaches. Price will reflect this.`
}
