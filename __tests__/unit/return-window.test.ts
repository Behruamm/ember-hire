import { describe, expect, it } from 'vitest'
import {
  calculateReturnWindow,
  canCompleteReturnByMidnight,
  canCompleteReturnSameDay,
  isReturnDepartTimeWithinWindow,
} from '@/lib/return-window'

describe('calculateReturnWindow', () => {
  it('sets latest departure to 22:00 for a 2-hour return duration', () => {
    const result = calculateReturnWindow([{ driveMinutes: 90 }], 1)

    expect(result.latestDepartTime).toBe('22:00')
  })

  it('sets latest departure to 21:45 for a 135-minute return duration', () => {
    const result = calculateReturnWindow([{ driveMinutes: 90 }], 2)

    expect(result.latestDepartTime).toBe('21:45')
  })

  it('sets latestDepartTime to null when the return route cannot finish before midnight', () => {
    const result = calculateReturnWindow([{ driveMinutes: 24 * 60 }], 1)

    expect(result.latestDepartTime).toBeNull()
  })

  it('sums all segment drive minutes', () => {
    const result = calculateReturnWindow([
      { driveMinutes: 12 },
      { driveMinutes: 24 },
      { driveMinutes: 20 },
    ], 3)

    expect(result.driveMinutes).toBe(56)
  })

  it('counts 15-min stop per drop-off point (destination boarding + each return drop-off)', () => {
    const result = calculateReturnWindow([
      { driveMinutes: 12 },
      { driveMinutes: 24 },
      { driveMinutes: 20 },
    ], 3)

    expect(result.stopMinutes).toBe(60)
  })

  it('totals drive and stop minutes', () => {
    const result = calculateReturnWindow([
      { driveMinutes: 12 },
      { driveMinutes: 24 },
      { driveMinutes: 20 },
    ], 3)

    expect(result.totalMinutes).toBe(116)
  })
})

describe('canCompleteReturnSameDay', () => {
  it('allows departure strictly before the latest same-day departure', () => {
    expect(canCompleteReturnSameDay('21:59', '22:00')).toBe(true)
  })

  it('allows departure exactly at the latest same-day departure', () => {
    expect(canCompleteReturnSameDay('22:00', '22:00')).toBe(true)
  })

  it('rejects departure one minute after the latest same-day departure', () => {
    expect(canCompleteReturnSameDay('22:01', '22:00')).toBe(false)
  })

  it('rejects all departures when no same-day departure is possible', () => {
    expect(canCompleteReturnSameDay('00:00', null)).toBe(false)
  })
})

describe('isReturnDepartTimeWithinWindow', () => {
  it('rejects a return departure before the outbound arrival time', () => {
    expect(isReturnDepartTimeWithinWindow('13:55', '14:00', '22:00')).toBe(false)
  })

  it('allows a return departure at the outbound arrival time', () => {
    expect(isReturnDepartTimeWithinWindow('14:00', '14:00', '22:00')).toBe(true)
  })

  it('rejects a return departure after the latest same-day departure', () => {
    expect(isReturnDepartTimeWithinWindow('22:05', '14:00', '22:00')).toBe(false)
  })
})

describe('canCompleteReturnByMidnight', () => {
  it('allows a journey that completes exactly at midnight', () => {
    expect(canCompleteReturnByMidnight('22:00', 120)).toBe(true)
  })

  it('rejects a journey that would complete after midnight', () => {
    expect(canCompleteReturnByMidnight('22:01', 120)).toBe(false)
  })
})
