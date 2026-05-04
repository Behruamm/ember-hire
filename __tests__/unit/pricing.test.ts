import { describe, it, expect } from 'vitest'
import { buildQuote, formatGBP, RATES } from '@/lib/pricing'

describe('RATES', () => {
  it('base rate is £300', () => expect(RATES.BASE).toBe(300))
  it('drive rate is £60/hr', () => expect(RATES.DRIVE_PER_HOUR).toBe(60))
  it('wait rate is £20/hr', () => expect(RATES.WAIT_PER_HOUR).toBe(20))
})

describe('buildQuote', () => {
  it('1 coach, 60min drive, 0 wait = £360', () => {
    const q = buildQuote(1, 60, 0)
    expect(q.total).toBe(360)
    expect(q.baseRate).toBe(300)
    expect(q.drivingCost).toBe(60)
    expect(q.waitingCost).toBe(0)
  })

  it('1 coach, 360min drive, 0 wait = £660', () => {
    const q = buildQuote(1, 360, 0)
    expect(q.total).toBe(660)
    expect(q.drivingCost).toBe(360)
  })

  it('1 coach, 360min drive, 360min wait = £780', () => {
    const q = buildQuote(1, 360, 360)
    expect(q.total).toBe(780)
    expect(q.waitingCost).toBe(120)
  })

  it('2 coaches doubles the total', () => {
    const q = buildQuote(2, 60, 0)
    expect(q.total).toBe(720)
    expect(q.subtotal).toBe(360)
  })

  it('drive minutes are charged by exact duration', () => {
    const q = buildQuote(1, 61, 0)
    expect(q.drivingCost).toBe(61) // 61min / 60 × £60
  })

  it('wait minutes are charged by exact duration', () => {
    const q = buildQuote(1, 0, 45)
    expect(q.waitingCost).toBe(15) // 45min / 60 × £20
    expect(q.total).toBe(315)
  })

  it('coaches < 1 throws RangeError', () => {
    expect(() => buildQuote(0, 60, 0)).toThrowError(RangeError)
  })
})

describe('formatGBP', () => {
  it('formats £780', () => expect(formatGBP(780)).toBe('£780'))
  it('formats £2,460 with comma', () => expect(formatGBP(2460)).toBe('£2,460'))
  it('formats £0', () => expect(formatGBP(0)).toBe('£0'))
  it('omits decimal places for whole pounds', () => expect(formatGBP(500)).toBe('£500'))
  it('keeps pence for fractional pounds', () => expect(formatGBP(315.5)).toBe('£315.50'))
})
