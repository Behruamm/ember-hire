import { NextResponse } from 'next/server'

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY

interface Segment {
  from: string
  to: string
  driveMinutes: number
  distanceMetres: number
}

async function geocode(address: string): Promise<
  | { ok: true; location: { lat: number; lng: number } }
  | { ok: false; reason: string }
> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=gb&key=${MAPS_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
    return { ok: false, reason: data.error_message ?? data.status ?? 'No result' }
  }
  return { ok: true, location: data.results[0].geometry.location }
}

async function getDriveTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ driveMinutes: number; distanceMetres: number }> {
  const orig = `${origin.lat},${origin.lng}`
  const dest = `${destination.lat},${destination.lng}`
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${orig}&destinations=${dest}&mode=driving&key=${MAPS_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK') {
    throw new Error(data.error_message ?? data.status ?? 'Distance Matrix request failed')
  }

  const element = data.rows[0]?.elements[0]
  if (element?.status !== 'OK') {
    throw new Error(element?.status ?? 'Route segment unavailable')
  }

  return {
    driveMinutes: Math.ceil(element.duration.value / 60),
    distanceMetres: element.distance.value,
  }
}

export async function POST(req: Request) {
  if (!MAPS_KEY) {
    return NextResponse.json({ error: 'Maps API key not configured' }, { status: 500 })
  }

  const body = await req.json()
  const stops: string[] = body.stops

  if (!Array.isArray(stops) || stops.length < 2 || stops.length > 20)
    return NextResponse.json({ error: 'Between 2 and 20 stops required' }, { status: 400 })

  if (stops.some((s: unknown) => typeof s !== 'string' || s.length > 200))
    return NextResponse.json({ error: 'Each stop must be under 200 characters' }, { status: 400 })

  try {
    // Geocode all stops in parallel
    const geocoded = await Promise.all(stops.map(geocode))

    // Check all geocoded successfully
    const failed = geocoded
      .map((result, i) => ({ result, stop: stops[i] }))
      .filter(({ result }) => !result.ok)
    if (failed.length > 0) {
      const details = failed
        .map(({ result, stop }) => `${stop} (${result.ok ? '' : result.reason})`)
        .join(', ')
      return NextResponse.json(
        { error: `Could not geocode: ${details}` },
        { status: 422 }
      )
    }

    const coords = geocoded.map((result) => (result.ok ? result.location : null))

    // Get drive time for each consecutive pair in parallel
    const segmentPromises = coords.slice(0, -1).map((origin, i) =>
      getDriveTime(origin!, coords[i + 1]!).then(({ driveMinutes, distanceMetres }) => ({
        from: stops[i],
        to: stops[i + 1],
        driveMinutes,
        distanceMetres,
      } as Segment))
    )

    const segments = await Promise.all(segmentPromises)
    return NextResponse.json({ segments })
  } catch (err) {
    console.error('[route-segments] failed:', err)
    return NextResponse.json(
      { error: 'Google Maps request failed. Check the API key, API restrictions, and enabled APIs.' },
      { status: 502 }
    )
  }
}
