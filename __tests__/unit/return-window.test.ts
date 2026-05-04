import { describe, expect, it } from 'vitest'
import { calculateReturnWindow, canCompleteReturnSameDay } from '@/lib/return-window'

describe('calculateReturnWindow', () => {
  it('sets latest departure to 22:00 for a 2-hour return duration', () => {
    const result = calculateReturnWindow([
      { driveMinutes: 90 },
    ], 1)

    expect(result).toEqual({
      driveMinutes: 90,
      stopMinutes: 30,
      totalMinutes: 120,
      latestDepartTime: '22:00',
    })
  })

  it('sets latest departure to 21:45 for a 135-minute return duration', () => {
    const result = calculateReturnWindow([
      { driveMinutes: 90 },
    ], 2)

    expect(result).toMatchObject({
      driveMinutes: 90,
      stopMinutes: 45,
      totalMinutes: 135,
      latestDepartTime: '21:45',
    })
  })

  it('returns null when the return route cannot finish before midnight', () => {
    const result = calculateReturnWindow([
      { driveMinutes: 24 * 60 },
    ], 1)

    expect(result.totalMinutes).toBe(1470)
    expect(result.latestDepartTime).toBeNull()
  })

  it('counts destination boarding plus every return drop-off as stop time', () => {
    const result = calculateReturnWindow([
      { driveMinutes: 12 },
      { driveMinutes: 24 },
      { driveMinutes: 20 },
    ], 3)

    expect(result.driveMinutes).toBe(56)
    expect(result.stopMinutes).toBe(60)
    expect(result.totalMinutes).toBe(116)
  })
})

describe('canCompleteReturnSameDay', () => {
  it('allows selected departure at or before the latest same-day departure', () => {
    expect(canCompleteReturnSameDay('21:59', '22:00')).toBe(true)
    expect(canCompleteReturnSameDay('22:00', '22:00')).toBe(true)
  })

  it('rejects selected departure after the latest same-day departure', () => {
    expect(canCompleteReturnSameDay('22:01', '22:00')).toBe(false)
  })

  it('rejects all departures when no same-day departure is possible', () => {
    expect(canCompleteReturnSameDay('00:00', null)).toBe(false)
  })
})
