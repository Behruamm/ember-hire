import { BOARDING_MINUTES, parseTime, type Segment } from '@/lib/pickup-times'

export interface ReturnWindow {
  driveMinutes: number
  stopMinutes: number
  totalMinutes: number
  latestDepartTime: string | null
}

const DAY_MINUTES = 24 * 60

export function calculateReturnWindow(
  segments: Pick<Segment, 'driveMinutes'>[],
  returnDropoffCount: number,
): ReturnWindow {
  const driveMinutes = segments.reduce((sum, segment) => sum + segment.driveMinutes, 0)
  const stopMinutes = (returnDropoffCount + 1) * BOARDING_MINUTES
  const totalMinutes = driveMinutes + stopMinutes
  const latestDepartMinutes = DAY_MINUTES - totalMinutes

  return {
    driveMinutes,
    stopMinutes,
    totalMinutes,
    latestDepartTime: latestDepartMinutes >= 0 ? formatSameDayTime(latestDepartMinutes) : null,
  }
}

export function canCompleteReturnSameDay(departTime: string, latestDepartTime: string | null): boolean {
  if (!latestDepartTime) return false
  return parseTime(departTime) <= parseTime(latestDepartTime)
}

export function isReturnDepartTimeWithinWindow(
  departTime: string,
  earliestDepartTime?: string | null,
  latestDepartTime?: string | null,
): boolean {
  const departure = parseTime(departTime)
  if (earliestDepartTime && departure < parseTime(earliestDepartTime)) return false
  if (latestDepartTime && departure > parseTime(latestDepartTime)) return false
  return true
}

export function canCompleteReturnByMidnight(departTime: string, totalMinutes: number): boolean {
  return parseTime(departTime) + totalMinutes <= DAY_MINUTES
}

function formatSameDayTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, DAY_MINUTES - 1))
  const hours = Math.floor(clamped / 60)
  const mins = clamped % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
