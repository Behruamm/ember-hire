import { describe, it, expect } from 'vitest'
import { calcPickupTimeline, parseTime, formatTime, BOARDING_MINUTES } from '@/lib/pickup-times'

// ── constants ─────────────────────────────────────────────────────────────

describe('BOARDING_MINUTES', () => {
  it('is 15 minutes per stop', () => {
    expect(BOARDING_MINUTES).toBe(15)
  })
})

// ── parseTime ─────────────────────────────────────────────────────────────

describe('parseTime', () => {
  it('parses 14:00 → 840', () => expect(parseTime('14:00')).toBe(840))
  it('parses 00:00 → 0', () => expect(parseTime('00:00')).toBe(0))
  it('parses 23:59 → 1439', () => expect(parseTime('23:59')).toBe(1439))
  it('throws on bad format', () => expect(() => parseTime('9:00')).toThrow(RangeError))
  it('throws on invalid time', () => expect(() => parseTime('25:00')).toThrow(RangeError))
})

// ── formatTime ────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats 840 → 14:00', () => expect(formatTime(840)).toBe('14:00'))
  it('formats 0 → 00:00', () => expect(formatTime(0)).toBe('00:00'))
  it('wraps negative minutes (-5 → 23:55)', () => expect(formatTime(-5)).toBe('23:55'))
  it('wraps past midnight (1441 → 00:01)', () => expect(formatTime(1441)).toBe('00:01'))
})

// ── calcPickupTimeline — single pickup, one way ───────────────────────────
//
// 1 pickup → dropoff
// Segment: EH1→Murrayfield = 30 min
// Arrive: 14:00 (840)
// EH1 departs: 840 - 30 (drive) - 15 (boarding) = 795 = 13:15

describe('calcPickupTimeline — single pickup, one way', () => {
  const segments = [{ from: 'EH1 1YZ', to: 'Murrayfield', driveMinutes: 30 }]
  const pickups = ['EH1 1YZ']

  it('returns one entry', () => {
    const result = calcPickupTimeline(segments, pickups, '14:00')
    expect(result).toHaveLength(1)
  })

  it('departure = arrival - drive - boarding (13:15)', () => {
    const result = calcPickupTimeline(segments, pickups, '14:00')
    expect(result[0].stop).toBe('EH1 1YZ')
    expect(result[0].departTime).toBe('13:15')
  })

  it('returns empty array for no pickups', () => {
    expect(calcPickupTimeline([], [], '14:00')).toHaveLength(0)
  })
})

// ── calcPickupTimeline — multi pickup, one way ────────────────────────────
//
// 3 pickups: EH1 → EH10 → EH9 → Murrayfield (arrive 14:00)
// Segments:
//   [0] EH1→EH10:        9 min
//   [1] EH10→EH9:        4 min
//   [2] EH9→Murrayfield: 18 min
//
// Walk backwards:
//   EH9:  840 - 18 - 15 = 807 = 13:27
//   EH10: 807 - 4  - 15 = 788 = 13:08
//   EH1:  788 - 9  - 15 = 764 = 12:44

describe('calcPickupTimeline — multi pickup, one way', () => {
  const segments = [
    { from: 'EH1 1YZ',  to: 'EH10 4BF',    driveMinutes: 9  },
    { from: 'EH10 4BF', to: 'EH9 1SH',     driveMinutes: 4  },
    { from: 'EH9 1SH',  to: 'Murrayfield', driveMinutes: 18 },
  ]
  const pickups = ['EH1 1YZ', 'EH10 4BF', 'EH9 1SH']

  it('returns one entry per pickup', () => {
    const result = calcPickupTimeline(segments, pickups, '14:00')
    expect(result).toHaveLength(3)
  })

  it('stops are in forward order', () => {
    const result = calcPickupTimeline(segments, pickups, '14:00')
    expect(result.map(r => r.stop)).toEqual(['EH1 1YZ', 'EH10 4BF', 'EH9 1SH'])
  })

  it('EH9 (last pickup) departs 13:27', () => {
    const result = calcPickupTimeline(segments, pickups, '14:00')
    expect(result[2].departTime).toBe('13:27')
  })

  it('EH10 (middle pickup) departs 13:08', () => {
    const result = calcPickupTimeline(segments, pickups, '14:00')
    expect(result[1].departTime).toBe('13:08')
  })

  it('EH1 (first pickup) departs 12:44', () => {
    const result = calcPickupTimeline(segments, pickups, '14:00')
    expect(result[0].departTime).toBe('12:44')
  })
})

// ── calcPickupTimeline — return journey ───────────────────────────────────
//
// Return pickup stops (derived from the outbound journey)
// Example: Murrayfield → EH9 → EH1 (back home)
// Segments: MF→EH9 = 18min, EH9→EH1 = 13min
// "Arrive" back at EH1 by 17:45
//
// EH9:         17:45 - 13 - 15 = 17:17
// Murrayfield: 17:17 - 18 - 15 = 16:44

describe('calcPickupTimeline — return journey', () => {
  const returnSegments = [
    { from: 'Murrayfield', to: 'EH9 1SH', driveMinutes: 18 },
    { from: 'EH9 1SH',    to: 'EH1 1YZ', driveMinutes: 13 },
  ]
  const returnPickups = ['Murrayfield', 'EH9 1SH']

  it('Murrayfield departs 16:44', () => {
    const result = calcPickupTimeline(returnSegments, returnPickups, '17:45')
    expect(result[0].stop).toBe('Murrayfield')
    expect(result[0].departTime).toBe('16:44')
  })

  it('EH9 departs 17:17', () => {
    const result = calcPickupTimeline(returnSegments, returnPickups, '17:45')
    expect(result[1].stop).toBe('EH9 1SH')
    expect(result[1].departTime).toBe('17:17')
  })
})

// ── calcPickupTimeline — edge cases ──────────────────────────────────────

describe('calcPickupTimeline — edge cases', () => {
  it('early morning: departure stays before arrival', () => {
    // Arrive 01:00, 30min drive → departs 01:00 - 30 - 15 = 00:15
    const segments = [{ from: 'Stop A', to: 'Dest', driveMinutes: 30 }]
    const result = calcPickupTimeline(segments, ['Stop A'], '01:00')
    expect(result[0].departTime).toBe('00:15')
  })

  it('wraps past midnight when departure would be before 00:00', () => {
    // Arrive 00:10, 30min drive → departs 10 - 30 - 15 = -35 → 23:25
    const segments = [{ from: 'Stop A', to: 'Dest', driveMinutes: 30 }]
    const result = calcPickupTimeline(segments, ['Stop A'], '00:10')
    expect(result[0].departTime).toBe('23:25')
  })
})
