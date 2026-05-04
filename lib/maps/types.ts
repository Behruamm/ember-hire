export interface RouteSegment {
  from: string
  to: string
  driveMinutes: number
  distanceMiles: number
}

export interface MapsProvider {
  getDriveTime(from: string, to: string): Promise<number>
  getDistanceFromDepot(location: string): Promise<number>
  getRouteSequence(stops: string[]): Promise<RouteSegment[]>
}
