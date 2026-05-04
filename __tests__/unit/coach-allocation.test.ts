import { describe, expect, it } from 'vitest'
import {
  allocateCoaches,
  buildSingleCoachPlans,
  returnRouteForCoach,
  routeForCoach,
} from '@/lib/coach-allocation'

describe('allocateCoaches', () => {
  it('keeps pickup points separate when each fits in a coach', () => {
    const plans = allocateCoaches([
      { address: 'A', passengers: 40 },
      { address: 'B', passengers: 30 },
    ])

    expect(plans).toEqual([
      {
        coachNumber: 1,
        passengers: 40,
        pickups: [{ address: 'A', passengers: 40 }],
      },
      {
        coachNumber: 2,
        passengers: 30,
        pickups: [{ address: 'B', passengers: 30 }],
      },
    ])
  })

  it('groups nearby pickup order into capacity-valid coach plans', () => {
    const plans = allocateCoaches([
      { address: 'A', passengers: 40 },
      { address: 'B', passengers: 20 },
      { address: 'C', passengers: 10 },
    ])

    expect(plans).toEqual([
      {
        coachNumber: 1,
        passengers: 40,
        pickups: [{ address: 'A', passengers: 40 }],
      },
      {
        coachNumber: 2,
        passengers: 30,
        pickups: [
          { address: 'B', passengers: 20 },
          { address: 'C', passengers: 10 },
        ],
      },
    ])
  })

  it('splits one large pickup across multiple coaches', () => {
    const plans = allocateCoaches([{ address: 'A', passengers: 70 }])

    expect(plans).toEqual([
      {
        coachNumber: 1,
        passengers: 53,
        pickups: [{ address: 'A', passengers: 53 }],
      },
      {
        coachNumber: 2,
        passengers: 17,
        pickups: [{ address: 'A', passengers: 17 }],
      },
    ])
  })

  it('ignores zero-passenger pickups for coach assignment', () => {
    const plans = allocateCoaches([
      { address: 'A', passengers: 0 },
      { address: 'B', passengers: 12 },
    ])

    expect(plans).toHaveLength(1)
    expect(plans[0].pickups).toEqual([{ address: 'B', passengers: 12 }])
  })
})

describe('route helpers', () => {
  it('builds one outbound route per coach', () => {
    const [plan] = allocateCoaches([
      { address: 'A', passengers: 40 },
      { address: 'B', passengers: 13 },
    ])

    expect(routeForCoach(plan, 'Destination')).toEqual(['A', 'B', 'Destination'])
  })

  it('builds return route in reverse pickup order', () => {
    const [plan] = allocateCoaches([
      { address: 'A', passengers: 40 },
      { address: 'B', passengers: 13 },
    ])

    expect(returnRouteForCoach(plan, 'Destination')).toEqual(['Destination', 'B', 'A'])
  })
})

describe('buildSingleCoachPlans', () => {
  it('creates identical routes for a single pickup over capacity', () => {
    const plans = buildSingleCoachPlans(['A'], 70)

    expect(plans).toHaveLength(2)
    expect(plans[0].pickups).toEqual([{ address: 'A', passengers: 53 }])
    expect(plans[1].pickups).toEqual([{ address: 'A', passengers: 17 }])
  })
})
