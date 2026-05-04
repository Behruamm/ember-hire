import type { MapsProvider, RouteSegment } from './types'

const DEFAULT_DRIVE_MINUTES = 30
const DEFAULT_DISTANCE_MILES = 50

const ROUTES = [
  ['Edinburgh Waverley', 'Morningside', 9, 4],
  ['Morningside', 'Newington', 4, 2],
  ['Newington', 'Murrayfield Stadium', 18, 4],
  ['Edinburgh Waverley', 'Murrayfield Stadium', 15, 3],
  ['Edinburgh', 'Inverness', 165, 157],
  ['Inverness', 'Fort William', 75, 66],
  ['Edinburgh', 'Glasgow', 70, 47],
  ['Glasgow', 'Stirling', 35, 27],
] as const

const DEPOT_DISTANCES = new Map<string, number>([
  ['edinburgh', 0],
  ['edinburgh waverley', 1],
  ['murrayfield stadium', 3],
  ['murrayfield', 3],
  ['morningside', 4],
  ['newington', 3],
  ['stirling', 35],
  ['glasgow', 47],
  ['fort william', 130],
  ['inverness', 157],
])

function key(from: string, to: string): string {
  return `${normalise(from)}::${normalise(to)}`
}

function normalise(location: string): string {
  return location.trim().toLowerCase()
}

const routeLookup = new Map<string, { driveMinutes: number; distanceMiles: number }>()

for (const [from, to, driveMinutes, distanceMiles] of ROUTES) {
  routeLookup.set(key(from, to), { driveMinutes, distanceMiles })
  routeLookup.set(key(to, from), { driveMinutes, distanceMiles })
}

export const mockMaps: MapsProvider = {
  async getDriveTime(from: string, to: string): Promise<number> {
    return routeLookup.get(key(from, to))?.driveMinutes ?? DEFAULT_DRIVE_MINUTES
  },

  async getDistanceFromDepot(location: string): Promise<number> {
    return DEPOT_DISTANCES.get(normalise(location)) ?? DEFAULT_DISTANCE_MILES
  },

  async getRouteSequence(stops: string[]): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = []

    for (let i = 0; i < stops.length - 1; i += 1) {
      const from = stops[i]
      const to = stops[i + 1]
      const route = routeLookup.get(key(from, to))

      segments.push({
        from,
        to,
        driveMinutes: route?.driveMinutes ?? DEFAULT_DRIVE_MINUTES,
        distanceMiles: route?.distanceMiles ?? DEFAULT_DISTANCE_MILES,
      })
    }

    return segments
  },
}
