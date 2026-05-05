import { BUSINESS_RULES } from '@/lib/business-rules'

export const BOARDING_MINUTES = BUSINESS_RULES.passengerStopMinutes

export interface Segment {
  from: string
  to: string
  driveMinutes: number
}

export interface PickupTime {
  stop: string
  departTime: string
}

/**
 * Given route segments (pickup[0]→pickup[1]→...→dropoff) and the target
 * drop-off-complete time, back-calculates the departure time for each pickup stop.
 *
 * The coach arrives at the destination one passenger stop before the target time.
 * For each pickup stop: subtract boarding, then subtract drive time from
 * that stop to the next, walking backwards from destination arrival.
 */
export function calcPickupTimeline(
  segments: Segment[],   // consecutive pairs: [p0→p1, p1→p2, ..., lastPickup→dropoff]
  pickups: string[],
  arrivalTime: string,
): PickupTime[] {
  if (pickups.length === 0) return []

  let cursor = parseTime(arrivalTime) - BOARDING_MINUTES
  const times: PickupTime[] = []

  // Walk backwards: last pickup → first pickup
  for (let i = pickups.length - 1; i >= 0; i--) {
    // The segment from this pickup toward destination is segments[i]
    // (segment[i] = pickup[i] → pickup[i+1] or dropoff)
    cursor -= segments[i].driveMinutes
    cursor -= BOARDING_MINUTES
    times.unshift({ stop: pickups[i], departTime: formatTime(cursor) })
  }

  return times
}

export function parseTime(hhmm: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!match) throw new RangeError('time must be in HH:MM format')
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) throw new RangeError('time must be a valid 24-hour time')
  return hours * 60 + minutes
}

export function formatTime(minutes: number): string {
  const dayMinutes = 24 * 60
  const wrapped = ((minutes % dayMinutes) + dayMinutes) % dayMinutes
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatJourneyDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins} min`
  if (!mins) return `${hours} hr`
  return `${hours} hr ${String(mins).padStart(2, '0')} min`
}

export function formatHours(minutes: number): string {
  const hours = minutes / 60
  const rounded = Number.isInteger(hours) ? hours.toString() : hours.toFixed(2)
  return `${rounded} hour${hours === 1 ? '' : 's'}`
}
