import { describe, expect, it } from 'vitest'
import {
  calculateOutboundWindow,
  isArrivalTimeWithinOutboundWindow,
} from '@/lib/outbound-window'

describe('calculateOutboundWindow', () => {
  it('sets earliest arrival from 00:00 including pickup boarding and destination drop-off', () => {
    const result = calculateOutboundWindow([{ driveMinutes: 30 }], 1)

    expect(result.earliestArrivalTime).toBe('01:00')
  })

  it('counts 15-min stops for each pickup and the final destination drop-off', () => {
    const result = calculateOutboundWindow([
      { driveMinutes: 10 },
      { driveMinutes: 20 },
      { driveMinutes: 30 },
    ], 3)

    expect(result.stopMinutes).toBe(60)
    expect(result.totalMinutes).toBe(120)
    expect(result.earliestArrivalTime).toBe('02:00')
  })

  it('has no valid HH:MM arrival when the outbound route cannot finish before midnight', () => {
    const result = calculateOutboundWindow([{ driveMinutes: 24 * 60 }], 1)

    expect(result.earliestArrivalTime).toBeNull()
  })
})

describe('isArrivalTimeWithinOutboundWindow', () => {
  it('rejects arrival before the route can complete from a 00:00 start', () => {
    expect(isArrivalTimeWithinOutboundWindow('00:55', '01:00')).toBe(false)
  })

  it('allows arrival exactly at the earliest possible time', () => {
    expect(isArrivalTimeWithinOutboundWindow('01:00', '01:00')).toBe(true)
  })

  it('rejects all arrivals when no same-day completion is possible', () => {
    expect(isArrivalTimeWithinOutboundWindow('23:59', null)).toBe(false)
  })
})
