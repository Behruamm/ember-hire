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

describe('calculateQuote', () => {
  it('prices one-way journeys from route drive minutes plus pickup and destination stop time', async () => {
    const result = await calculateQuote(
      booking({ pickups: ['A'], dropoff: 'D' }),
      routeProvider({ 'A>D': [30] }),
    )

    expect(result.driveMinutes).toBe(60) // 30 drive + 15 pickup + 15 destination drop-off
    expect(result.waitMinutes).toBe(0)
    expect(result.quote).toMatchObject({
      baseRate: 300,
      drivingCost: 60,
      waitingCost: 0,
      coachCount: 1,
      total: 360,
    })
  })

  it('adds return driving, return stop minutes, and per-coach waiting cost', async () => {
    const result = await calculateQuote(
      booking({
        journeyType: 'return',
        pickups: ['A'],
        dropoff: 'D',
        arrivalTime: '14:00',
        returnDepartTime: '19:00',
        returnPickups: ['A'],
      }),
      routeProvider({
        'A>D': [30],
        'D>A': [30],
      }),
    )

    expect(result.driveMinutes).toBe(120)
    expect(result.waitMinutes).toBe(300)
    expect(result.quote.drivingCost).toBe(120)
    expect(result.quote.waitingCost).toBe(100)
    expect(result.quote.total).toBe(520)
    expect(result.journeyDetail.returnJourneys[0]?.stopMinutes).toBe(30)
  })

  it('counts destination boarding and each return drop-off for multi-stop return journeys', async () => {
    const result = await calculateQuote(
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

    expect(result.journeyDetail.returnJourneys[0]).toMatchObject({
      coachNumber: 1,
      route: ['D', 'C', 'B', 'A'],
      driveMinutes: 60,
      stopMinutes: 60,
      totalMinutes: 120,
    })
    expect(result.driveMinutes).toBe(240)
  })

  it('prices separate coach plans for over-capacity multi-pickup groups', async () => {
    const result = await calculateQuote(
      booking({
        groupSize: 70,
        pickups: ['A', 'B'],
        pickupPassengerCounts: [40, 30],
        dropoff: 'D',
      }),
      routeProvider({
        'A>D': [60],
        'B>D': [30],
      }),
    )

    expect(result.journeyDetail.coachPlans).toHaveLength(2)
    expect(result.driveMinutes).toBe(150)
    expect(result.quote).toMatchObject({
      baseRate: 600,
      drivingCost: 150,
      waitingCost: 0,
      coachCount: 2,
      total: 750,
    })
  })

  it('prices return routes per coach using each coach pickup allocation in reverse', async () => {
    const result = await calculateQuote(
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
        'A>D': [14],
        'B>D': [27],
        'C>D': [12],
        'D>A': [14],
        'D>B': [27],
        'D>C': [12],
      }),
    )

    expect(result.journeyDetail.coachPlans).toHaveLength(3)
    expect(result.journeyDetail.returnJourneys).toMatchObject([
      {
        coachNumber: 1,
        route: ['D', 'A'],
        driveMinutes: 14,
        stopMinutes: 30,
        totalMinutes: 44,
      },
      {
        coachNumber: 2,
        route: ['D', 'B'],
        driveMinutes: 27,
        stopMinutes: 30,
        totalMinutes: 57,
      },
      {
        coachNumber: 3,
        route: ['D', 'C'],
        driveMinutes: 12,
        stopMinutes: 30,
        totalMinutes: 42,
      },
    ])
    expect(result.driveMinutes).toBe(286)
    expect(result.waitMinutes).toBe(858)
    expect(result.quote.waitingCost).toBe(858)
  })

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
})
