import { describe, expect, it } from 'vitest'
import { calculateQuote, type RouteProvider } from '@/lib/quote-engine'
import { DEFAULT_STATE, type BookingState } from '@/types/booking'

function booking(overrides: Partial<BookingState>): BookingState {
  return {
    ...DEFAULT_STATE,
    journeyType: 'oneway',
    groupSize: 40,
    date: '2026-05-08',
    pickups: ['A'],
    pickupPassengerCounts: [],
    dropoff: 'D',
    arrivalTime: '14:00',
    ...overrides,
  }
}

function routeProvider(minutesByRoute: Record<string, number[]>): RouteProvider {
  return {
    async getSegments(stops) {
      const key = stops.join('>')
      const minutes = minutesByRoute[key]
      if (!minutes) throw new Error(`Missing fake route: ${key}`)

      return minutes.map((driveMinutes, i) => ({
        from: stops[i],
        to: stops[i + 1],
        driveMinutes,
      }))
    },
  }
}

describe('calculateQuote — one-way single pickup', () => {
  async function result() {
    return calculateQuote(
      booking({ pickups: ['A'], dropoff: 'D' }),
      routeProvider({ 'A>D': [30] }),
    )
  }

  it('adds 15-min pickup stop and 15-min destination stop to raw drive minutes', async () => {
    expect((await result()).driveMinutes).toBe(60) // 30 drive + 15 pickup + 15 drop-off
  })

  it('has zero wait minutes', async () => {
    expect((await result()).waitMinutes).toBe(0)
  })

  it('uses 1 coach', async () => {
    expect((await result()).quote.coachCount).toBe(1)
  })

  it('charges the base rate', async () => {
    expect((await result()).quote.baseRate).toBe(300)
  })

  it('charges for drive time', async () => {
    expect((await result()).quote.drivingCost).toBe(60)
  })

  it('charges no waiting cost', async () => {
    expect((await result()).quote.waitingCost).toBe(0)
  })

  it('totals base + driving', async () => {
    expect((await result()).quote.total).toBe(360)
  })
})

describe('calculateQuote — return journey single pickup', () => {
  async function result() {
    return calculateQuote(
      booking({
        journeyType: 'return',
        pickups: ['A'],
        dropoff: 'D',
        arrivalTime: '14:00',
        returnDepartTime: '19:00',
        returnPickups: ['A'],
      }),
      routeProvider({ 'A>D': [30], 'D>A': [30] }),
    )
  }

  it('combines outbound and return drive minutes', async () => {
    expect((await result()).driveMinutes).toBe(120)
  })

  it('calculates wait minutes from arrival to return departure', async () => {
    expect((await result()).waitMinutes).toBe(300)
  })

  it('charges for both outbound and return driving', async () => {
    expect((await result()).quote.drivingCost).toBe(120)
  })

  it('charges waiting cost for the layover', async () => {
    expect((await result()).quote.waitingCost).toBe(100)
  })

  it('totals base + driving + waiting', async () => {
    expect((await result()).quote.total).toBe(520)
  })

  it('includes 15-min destination boarding in return stop minutes', async () => {
    expect((await result()).journeyDetail.returnJourneys[0]?.stopMinutes).toBe(30)
  })
})

describe('calculateQuote — return journey multi-stop', () => {
  async function result() {
    return calculateQuote(
      booking({
        journeyType: 'return',
        pickups: ['A', 'B', 'C'],
        dropoff: 'D',
        arrivalTime: '14:00',
        returnDepartTime: '19:00',
        returnPickups: ['C', 'B', 'A'],
      }),
      routeProvider({
        'A>B>C>D': [10, 20, 30],
        'D>C>B>A': [30, 20, 10],
      }),
    )
  }

  it('return journey route runs destination → pickups in reverse', async () => {
    expect((await result()).journeyDetail.returnJourneys[0]?.route).toEqual(['D', 'C', 'B', 'A'])
  })

  it('sums return segment drive minutes', async () => {
    expect((await result()).journeyDetail.returnJourneys[0]?.driveMinutes).toBe(60)
  })

  it('counts 15-min stop per return drop-off', async () => {
    expect((await result()).journeyDetail.returnJourneys[0]?.stopMinutes).toBe(60)
  })

  it('totals drive + stop minutes for return leg', async () => {
    expect((await result()).journeyDetail.returnJourneys[0]?.totalMinutes).toBe(120)
  })

  it('adds outbound and return drive minutes across all stops', async () => {
    expect((await result()).driveMinutes).toBe(240)
  })
})

describe('calculateQuote — over-capacity multi-pickup (one-way)', () => {
  async function result() {
    return calculateQuote(
      booking({
        groupSize: 70,
        pickups: ['A', 'B'],
        pickupPassengerCounts: [40, 30],
        dropoff: 'D',
      }),
      routeProvider({ 'A>D': [60], 'B>D': [30] }),
    )
  }

  it('creates one coach plan per pickup', async () => {
    expect((await result()).journeyDetail.coachPlans).toHaveLength(2)
  })

  it('sums per-coach drive minutes', async () => {
    expect((await result()).driveMinutes).toBe(150)
  })

  it('uses 2 coaches', async () => {
    expect((await result()).quote.coachCount).toBe(2)
  })

  it('charges double base rate', async () => {
    expect((await result()).quote.baseRate).toBe(600)
  })

  it('charges driving cost across both coach routes', async () => {
    expect((await result()).quote.drivingCost).toBe(150)
  })

  it('charges no waiting cost for one-way', async () => {
    expect((await result()).quote.waitingCost).toBe(0)
  })

  it('totals base + driving', async () => {
    expect((await result()).quote.total).toBe(750)
  })
})

describe('calculateQuote — over-capacity multi-pickup return (3 coaches)', () => {
  async function result() {
    return calculateQuote(
      booking({
        journeyType: 'return',
        groupSize: 120,
        pickups: ['A', 'B', 'C'],
        pickupPassengerCounts: [53, 53, 14],
        dropoff: 'D',
        arrivalTime: '08:42',
        returnDepartTime: '23:00',
        returnPickups: ['C', 'B', 'A'],
      }),
      routeProvider({
        'A>D': [14], 'B>D': [27], 'C>D': [12],
        'D>A': [14], 'D>B': [27], 'D>C': [12],
      }),
    )
  }

  it('creates one return journey per coach', async () => {
    expect((await result()).journeyDetail.coachPlans).toHaveLength(3)
  })

  it('routes each coach to its own pickup on the return', async () => {
    const journeys = (await result()).journeyDetail.returnJourneys
    expect(journeys[0]?.route).toEqual(['D', 'A'])
    expect(journeys[1]?.route).toEqual(['D', 'B'])
    expect(journeys[2]?.route).toEqual(['D', 'C'])
  })

  it('calculates per-coach return drive minutes', async () => {
    const journeys = (await result()).journeyDetail.returnJourneys
    expect(journeys[0]?.driveMinutes).toBe(14)
    expect(journeys[1]?.driveMinutes).toBe(27)
    expect(journeys[2]?.driveMinutes).toBe(12)
  })

  it('assigns 30 stop minutes to each return coach (boarding + drop-off)', async () => {
    const journeys = (await result()).journeyDetail.returnJourneys
    expect(journeys[0]?.stopMinutes).toBe(30)
    expect(journeys[1]?.stopMinutes).toBe(30)
    expect(journeys[2]?.stopMinutes).toBe(30)
  })

  it('totals per-coach drive + stop minutes for each return journey', async () => {
    const journeys = (await result()).journeyDetail.returnJourneys
    expect(journeys[0]?.totalMinutes).toBe(44)
    expect(journeys[1]?.totalMinutes).toBe(57)
    expect(journeys[2]?.totalMinutes).toBe(42)
  })

  it('sums all outbound and return drive minutes across 3 coaches', async () => {
    expect((await result()).driveMinutes).toBe(286)
  })

  it('multiplies wait minutes by coach count', async () => {
    expect((await result()).waitMinutes).toBe(858)
  })

  it('charges waiting cost equal to total wait minutes', async () => {
    expect((await result()).quote.waitingCost).toBe(858)
  })
})

describe('calculateQuote — error paths', () => {
  it('requires passenger counts for over-capacity multi-pickup groups', async () => {
    await expect(
      calculateQuote(
        booking({
          groupSize: 70,
          pickups: ['A', 'B'],
          pickupPassengerCounts: [],
          dropoff: 'D',
        }),
        routeProvider({ 'A>D': [60] }),
      ),
    ).rejects.toThrow('Passenger counts are required')
  })

  it('rejects return departure times before the outbound arrival time', async () => {
    await expect(
      calculateQuote(
        booking({
          journeyType: 'return',
          pickups: ['A'],
          dropoff: 'D',
          arrivalTime: '14:00',
          returnDepartTime: '12:00',
          returnPickups: ['A'],
        }),
        routeProvider({ 'A>D': [30], 'D>A': [30] }),
      ),
    ).rejects.toThrow('Return departure time must be after arrival time')
  })

  it('rejects return journeys that would complete after midnight', async () => {
    await expect(
      calculateQuote(
        booking({
          journeyType: 'return',
          pickups: ['A'],
          dropoff: 'D',
          arrivalTime: '14:00',
          returnDepartTime: '23:30',
          returnPickups: ['A'],
        }),
        routeProvider({ 'A>D': [30], 'D>A': [15] }),
      ),
    ).rejects.toThrow('Return journey must be completed before midnight')
  })

  it('rejects arrival times that would require outbound pickup before 00:00', async () => {
    await expect(
      calculateQuote(
        booking({
          pickups: ['A'],
          dropoff: 'D',
          arrivalTime: '00:55',
        }),
        routeProvider({ 'A>D': [30] }),
      ),
    ).rejects.toThrow('Arrival time is too early')
  })

  it('uses the longest outbound coach plan when checking earliest arrival', async () => {
    await expect(
      calculateQuote(
        booking({
          groupSize: 70,
          pickups: ['A', 'B'],
          pickupPassengerCounts: [40, 30],
          dropoff: 'D',
          arrivalTime: '02:00',
        }),
        routeProvider({ 'A>D': [60], 'B>D': [100] }),
      ),
    ).rejects.toThrow('Arrival time is too early')
  })
})
