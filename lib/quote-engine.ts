import type { BookingState, QuoteBreakdown } from '@/types/booking'
import { allocateCoaches, buildSingleCoachPlans, returnRouteForCoach, routeForCoach, COACH_CAPACITY, type CoachPlan } from '@/lib/coach-allocation'
import { BOARDING_MINUTES, parseTime, type Segment } from '@/lib/pickup-times'
import { RATES } from '@/lib/pricing'
import { canCompleteReturnByMidnight, isReturnDepartTimeWithinWindow } from '@/lib/return-window'
import { calculateOutboundWindow, isArrivalTimeWithinOutboundWindow } from '@/lib/outbound-window'

export interface RouteProvider {
  getSegments(stops: string[]): Promise<Segment[]>
}

export interface OutboundJourneyDetail {
  coachNumber: number
  route: string[]
  driveMinutes: number
  boardingMinutes: number
  totalMinutes: number
  segments: Segment[]
}

export interface ReturnJourneyDetail {
  coachNumber: number
  route: string[]
  driveMinutes: number
  stopMinutes: number
  totalMinutes: number
  segments: Segment[]
}

export interface JourneyDetail {
  coachPlans: CoachPlan[]
  outbound: OutboundJourneyDetail[]
  returnJourneys: ReturnJourneyDetail[]
  waitMinutes: number
}

export interface QuoteEngineResult {
  quote: QuoteBreakdown
  journeyDetail: JourneyDetail
  driveMinutes: number
  waitMinutes: number
}

export async function calculateQuote(
  state: BookingState,
  routeProvider: RouteProvider,
): Promise<QuoteEngineResult> {
  assertQuoteReady(state)

  const needsPassengerCounts = state.groupSize > COACH_CAPACITY && state.pickups.length > 1
  const hasPassengerCounts =
    state.pickupPassengerCounts.length === state.pickups.length &&
    state.pickupPassengerCounts.reduce((sum, count) => sum + count, 0) === state.groupSize

  if (needsPassengerCounts && !hasPassengerCounts) {
    throw new Error('Passenger counts are required for multi-coach trips with multiple pickup points.')
  }

  const coachPlans = needsPassengerCounts
    ? allocateCoaches(state.pickups.map((address, i) => ({
        address,
        passengers: state.pickupPassengerCounts[i],
      })))
    : buildSingleCoachPlans(state.pickups, state.groupSize)

  const outbound = await Promise.all(coachPlans.map(async (plan) => {
    const route = routeForCoach(plan, state.dropoff)
    const segments = await routeProvider.getSegments(route)
    const driveMinutes = sumDriveMinutes(segments)
    const boardingMinutes = (plan.pickups.length + 1) * BOARDING_MINUTES
    return {
      coachNumber: plan.coachNumber,
      route,
      driveMinutes,
      boardingMinutes,
      totalMinutes: driveMinutes + boardingMinutes,
      segments,
    }
  }))

  outbound.sort((a, b) => a.coachNumber - b.coachNumber)

  const outboundWindow = outbound.reduce((latest, current) => {
    const currentWindow = calculateOutboundWindow(current.segments, current.route.length - 1)
    return currentWindow.totalMinutes > latest.totalMinutes ? currentWindow : latest
  }, calculateOutboundWindow([], 0))

  if (!isArrivalTimeWithinOutboundWindow(state.arrivalTime, outboundWindow.earliestArrivalTime)) {
    throw new Error('Arrival time is too early for this route to start and finish on the same day.')
  }

  let returnJourneys: ReturnJourneyDetail[] = []
  let waitMinutes = 0

  if (state.journeyType === 'return') {
    if (!state.returnDepartTime || !state.returnPickups.length) {
      throw new Error('Return departure time and return stops are required for return journeys.')
    }
    const returnDepartTime = state.returnDepartTime
    if (!isReturnDepartTimeWithinWindow(returnDepartTime, state.arrivalTime)) {
      throw new Error('Return departure time must be after arrival time for same-day return journeys.')
    }

    returnJourneys = await Promise.all(coachPlans.map(async (plan) => {
      const route = returnRouteForCoach(plan, state.dropoff)
      const segments = await routeProvider.getSegments(route)
      const driveMinutes = sumDriveMinutes(segments)
      const stopMinutes = route.length * BOARDING_MINUTES

      return {
        coachNumber: plan.coachNumber,
        route,
        driveMinutes,
        stopMinutes,
        totalMinutes: driveMinutes + stopMinutes,
        segments,
      }
    }))
    returnJourneys.sort((a, b) => a.coachNumber - b.coachNumber)
    if (returnJourneys.some((journey) => !canCompleteReturnByMidnight(returnDepartTime, journey.totalMinutes))) {
      throw new Error('Return journey must be completed before midnight.')
    }

    waitMinutes = minutesUntil(state.arrivalTime, returnDepartTime)
  }

  const outboundMinutes = outbound.reduce((sum, detail) => sum + detail.totalMinutes, 0)
  const returnMinutes = returnJourneys.reduce((sum, detail) => sum + detail.totalMinutes, 0)
  const driveMinutes = outboundMinutes + returnMinutes
  const coachCount = coachPlans.length
  const quote = buildExactQuote(coachCount, driveMinutes, waitMinutes)

  return {
    quote,
    journeyDetail: {
      coachPlans,
      outbound,
      returnJourneys,
      waitMinutes,
    },
    driveMinutes,
    waitMinutes,
  }
}

function assertQuoteReady(
  state: BookingState,
): asserts state is BookingState & {
  groupSize: number
  dropoff: string
  arrivalTime: string
} {
  if (!state.pickups.length || !state.dropoff || !state.arrivalTime || !state.groupSize) {
    throw new Error('Pickup, drop-off, arrival time, and group size are required before quoting.')
  }
}

function buildExactQuote(coachCount: number, driveMinutes: number, waitMinutes: number): QuoteBreakdown {
  const baseRate = RATES.BASE * coachCount
  const drivingCost = (driveMinutes / 60) * RATES.DRIVE_PER_HOUR
  const waitingCost = (waitMinutes / 60) * RATES.WAIT_PER_HOUR * coachCount
  const subtotal = baseRate + drivingCost + waitingCost

  return {
    baseRate,
    drivingCost,
    waitingCost,
    coachCount,
    subtotal,
    total: subtotal,
  }
}

function sumDriveMinutes(segments: Segment[]): number {
  return segments.reduce((sum, segment) => sum + segment.driveMinutes, 0)
}

function minutesUntil(startTime: string, endTime: string): number {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  return end >= start ? end - start : end + 24 * 60 - start
}
