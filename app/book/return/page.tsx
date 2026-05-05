'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import TimePicker from '@/components/booking/TimePicker'
import { Button, Badge } from '@/components/ui'
import { firstErrorByField, returnDetailsSchema } from '@/lib/schemas'
import { calculateReturnWindow, isReturnDepartTimeWithinWindow } from '@/lib/return-window'
import { allocateCoaches, buildSingleCoachPlans, returnRouteForCoach, COACH_CAPACITY } from '@/lib/coach-allocation'

interface RouteSegment {
  driveMinutes: number
}

type RouteCheck =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; totalMinutes: number; latestDepartTime: string | null }
  | { status: 'error'; message: string }

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins} min`
  if (!mins) return `${hours} hr${hours === 1 ? '' : 's'}`
  return `${hours} hr ${mins} min`
}

async function fetchSegments(stops: string[], signal: AbortSignal): Promise<RouteSegment[]> {
  const res = await fetch('/api/route-segments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stops }),
    signal,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Route calculation failed')
  return data.segments
}

export default function StepReturn() {
  const router = useRouter()
  const { state, hydrated, setReturnPickups, setReturnDepartTime } = useBooking()
  const stops = useMemo(
    () => state.returnPickups.length ? state.returnPickups : [...state.pickups].reverse(),
    [state.pickups, state.returnPickups],
  )
  const [departTime, setDepartTime] = useState(state.returnDepartTime ?? '')
  const [errors, setErrors] = useState<{ time?: string }>({})
  const [routeCheck, setRouteCheck] = useState<RouteCheck>({ status: 'loading' })

  const hasPassengerCounts =
    (state.groupSize ?? 0) > COACH_CAPACITY &&
    state.pickupPassengerCounts.length === state.pickups.length
  const returnPassengerCounts = hasPassengerCounts
    ? [...state.pickupPassengerCounts].reverse()
    : []

  useEffect(() => {
    if (hydrated && !state.dropoff) router.replace('/book')
  }, [hydrated, state.dropoff, router])

  useEffect(() => {
    const validStops = stops.map((s) => s.trim()).filter(Boolean)
    if (!hydrated || !state.dropoff || !validStops.length || !state.groupSize) return

    const controller = new AbortController()
    const needsPassengerCounts = state.groupSize > COACH_CAPACITY && state.pickups.length > 1
    const hasCompletePassengerCounts =
      state.pickupPassengerCounts.length === state.pickups.length &&
      state.pickupPassengerCounts.reduce((sum, count) => sum + count, 0) === state.groupSize
    const coachPlans = needsPassengerCounts && hasCompletePassengerCounts
      ? allocateCoaches(state.pickups.map((address, i) => ({
          address,
          passengers: state.pickupPassengerCounts[i],
        })))
      : buildSingleCoachPlans(state.pickups, state.groupSize)

    Promise.all(coachPlans.map(async (plan) => {
      const route = returnRouteForCoach(plan, state.dropoff ?? '')
      const segments = await fetchSegments(route, controller.signal)
      return calculateReturnWindow(segments, route.length - 1)
    }))
      .then((windows) => {
        const returnWindow = windows.reduce((latest, current) => (
          current.totalMinutes > latest.totalMinutes ? current : latest
        ))
        const { totalMinutes, latestDepartTime } = returnWindow
        setRouteCheck({ status: 'ready', totalMinutes, latestDepartTime })
        // Snap any pre-filled time that now falls outside the allowed window
        setDepartTime((prev) => {
          const min = state.arrivalTime ?? undefined
          const max = latestDepartTime ?? undefined
          if (!prev) return prev
          return isReturnDepartTimeWithinWindow(prev, min, max) ? prev : ''
        })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setRouteCheck({
          status: 'error',
          message: 'We could not check the same-day return limit. Check the route details and try again.',
        })
      })

    return () => controller.abort()
  }, [hydrated, state.dropoff, state.groupSize, state.pickups, state.pickupPassengerCounts, stops])

  const handleContinue = () => {
    const valid = stops.map((s) => s.trim()).filter(Boolean)
    const result = returnDetailsSchema.safeParse({ returnDepartTime: departTime, returnPickups: valid })
    if (!result.success) {
      const fields = firstErrorByField(result.error)
      setErrors({ time: fields.returnDepartTime ?? fields.returnPickups })
      return
    }
    if (routeCheck.status !== 'ready') {
      setErrors({ time: 'Wait for the return route check before continuing' })
      return
    }
    if (!isReturnDepartTimeWithinWindow(result.data.returnDepartTime, state.arrivalTime, routeCheck.latestDepartTime)) {
      setErrors({ time: 'Choose a return departure time within the available same-day window' })
      return
    }
    setReturnPickups(result.data.returnPickups)
    setReturnDepartTime(result.data.returnDepartTime)
    router.push('/book/quote')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Return journey</h1>

      <div className="space-y-4">
        {/* Route summary: pickup point → drop-off stops */}
        <div className="rounded-sm border border-border overflow-hidden">
          {/* Pickup row */}
          <div className="flex items-start justify-between gap-3 bg-brand-green/5 px-4 py-2.5">
            <p className="min-w-0 break-words text-sm font-semibold text-ink">{state.dropoff}</p>
            <Badge intent="primary">{state.groupSize ?? 0} people</Badge>
          </div>

          {/* Drop-off stops */}
          {stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-2.5 border-t border-border px-3 py-2">
              <span className="w-4 shrink-0 text-center text-xs font-bold text-slate-11">{i + 1}</span>
              <span className="min-w-0 flex-1 break-words text-sm text-ink">{stop}</span>
              {returnPassengerCounts[i] !== undefined && (
                <span className="shrink-0 text-xs text-slate-11">{returnPassengerCounts[i]} pax</span>
              )}
            </div>
          ))}
        </div>

        <TimePicker
          id="departTime"
          label="Return departure time"
          min={state.arrivalTime ?? undefined}
          max={routeCheck.status === 'ready' ? routeCheck.latestDepartTime ?? undefined : undefined}
          value={departTime}
          onChange={(value) => { setDepartTime(value); setErrors((p) => ({ ...p, time: undefined })) }}
          error={errors.time}
          required
          hint={
            routeCheck.status === 'loading'
              ? 'Checking the latest same-day return time...'
              : routeCheck.status === 'ready'
                ? routeCheck.latestDepartTime
                  ? `Return journey takes about ${formatDuration(routeCheck.totalMinutes)}. Latest same-day departure: ${routeCheck.latestDepartTime}.`
                  : 'This return route cannot be completed before midnight. Please call us to arrange this journey.'
                : undefined
          }
        />

        {routeCheck.status === 'error' && (
          <p role="alert" className="rounded-sm border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {routeCheck.message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button intent="secondary" fullWidth onClick={() => router.back()}>Back</Button>
          <Button fullWidth onClick={handleContinue} disabled={routeCheck.status === 'loading' || routeCheck.status === 'error'}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
