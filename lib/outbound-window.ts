import { BOARDING_MINUTES, parseTime, type Segment } from '@/lib/pickup-times'

export interface OutboundWindow {
  driveMinutes: number
  stopMinutes: number
  totalMinutes: number
  earliestArrivalTime: string | null
}

const DAY_MINUTES = 24 * 60

export function calculateOutboundWindow(
  segments: Pick<Segment, 'driveMinutes'>[],
  pickupCount: number,
): OutboundWindow {
  const driveMinutes = segments.reduce((sum, segment) => sum + segment.driveMinutes, 0)
  const stopMinutes = (pickupCount + 1) * BOARDING_MINUTES
  const totalMinutes = driveMinutes + stopMinutes

  return {
    driveMinutes,
    stopMinutes,
    totalMinutes,
    earliestArrivalTime: totalMinutes < DAY_MINUTES ? formatSameDayTime(totalMinutes) : null,
  }
}

export function isArrivalTimeWithinOutboundWindow(
  arrivalTime: string,
  earliestArrivalTime: string | null,
): boolean {
  if (!earliestArrivalTime) return false
  return parseTime(arrivalTime) >= parseTime(earliestArrivalTime)
}

function formatSameDayTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, DAY_MINUTES - 1))
  const hours = Math.floor(clamped / 60)
  const mins = clamped % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
