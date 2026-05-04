import { describe, expect, it } from 'vitest'
import { capacityWarning, coachCount, COACH_CAPACITY } from '@/lib/coaches'

describe('coachCount', () => {
  it('uses a 53-seat coach capacity', () => {
    expect(COACH_CAPACITY).toBe(53)
  })

  it('1 person = 1 coach', () => {
    expect(coachCount(1)).toBe(1)
  })

  it('53 people = 1 coach', () => {
    expect(coachCount(53)).toBe(1)
  })

  it('54 people = 2 coaches', () => {
    expect(coachCount(54)).toBe(2)
  })

  it('106 people = 2 coaches', () => {
    expect(coachCount(106)).toBe(2)
  })

  it('107 people = 3 coaches', () => {
    expect(coachCount(107)).toBe(3)
  })

  it('throws for 0 people', () => {
    expect(() => coachCount(0)).toThrowError(RangeError)
  })
})

describe('capacityWarning', () => {
  it('returns null for one coach', () => {
    expect(capacityWarning(53)).toBeNull()
  })

  it('returns a warning for multiple coaches', () => {
    expect(capacityWarning(54)).toBe(
      'Your group needs 2 coaches. Price will reflect this.'
    )
  })
})
