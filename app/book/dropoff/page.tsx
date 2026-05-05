'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import TimePicker from '@/components/booking/TimePicker'
import { Input, Button } from '@/components/ui'
import { dropoffSchema, firstErrorByField } from '@/lib/schemas'
import { allocateCoaches, buildSingleCoachPlans, routeForCoach, COACH_CAPACITY } from '@/lib/coach-allocation'
import { calculateOutboundWindow, isArrivalTimeWithinOutboundWindow } from '@/lib/outbound-window'

interface RouteSegment {
  driveMinutes: number
}

type RouteCheck =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; totalMinutes: number; earliestArrivalTime: string | null }
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

export default function StepDropoff() {
  const router = useRouter()
  const { state, hydrated, setDropoff, setReturnPickups } = useBooking()
  const [dropoff, setDropoffLocal] = useState(state.dropoff ?? '')
  const [arrivalTime, setArrivalTime] = useState(state.arrivalTime ?? '')
  const [errors, setErrors] = useState<{ dropoff?: string; time?: string }>({})
  const [routeCheck, setRouteCheck] = useState<RouteCheck>({ status: 'idle' })

  const validDropoff = dropoff.trim()
  const validPickups = useMemo(
    () => state.pickups.map((pickup) => pickup.trim()).filter(Boolean),
    [state.pickups],
  )

  useEffect(() => {
    if (hydrated && !state.pickups.length) router.replace('/book')
  }, [hydrated, state.pickups.length, router])

  useEffect(() => {
    if (!hydrated || !validDropoff || !validPickups.length || !state.groupSize) {
      setRouteCheck({ status: 'idle' })
      return
    }

    const controller = new AbortController()
    const groupSize = state.groupSize
    setRouteCheck({ status: 'loading' })

    const timer = window.setTimeout(() => {
      const needsPassengerCounts = groupSize > COACH_CAPACITY && state.pickups.length > 1
      const hasCompletePassengerCounts =
        state.pickupPassengerCounts.length === state.pickups.length &&
        state.pickupPassengerCounts.reduce((sum, count) => sum + count, 0) === groupSize
      const coachPlans = needsPassengerCounts && hasCompletePassengerCounts
        ? allocateCoaches(state.pickups.map((address, i) => ({
            address,
            passengers: state.pickupPassengerCounts[i],
          })))
        : buildSingleCoachPlans(state.pickups, groupSize)

      Promise.all(coachPlans.map(async (plan) => {
        const route = routeForCoach(plan, validDropoff)
        const segments = await fetchSegments(route, controller.signal)
        return calculateOutboundWindow(segments, route.length - 1)
      }))
        .then((windows) => {
          const outboundWindow = windows.reduce((latest, current) => (
            current.totalMinutes > latest.totalMinutes ? current : latest
          ))
          setRouteCheck({
            status: 'ready',
            totalMinutes: outboundWindow.totalMinutes,
            earliestArrivalTime: outboundWindow.earliestArrivalTime,
          })
          setArrivalTime((prev) => {
            if (!prev) return prev
            return isArrivalTimeWithinOutboundWindow(prev, outboundWindow.earliestArrivalTime) ? prev : ''
          })
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setRouteCheck({
            status: 'error',
            message: 'We could not check the earliest arrival time. Check the route details and try again.',
          })
        })
    }, 500)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [hydrated, state.groupSize, state.pickupPassengerCounts, state.pickups, validDropoff, validPickups.length])

  const handleContinue = () => {
    const result = dropoffSchema.safeParse({ dropoff, arrivalTime })
    if (!result.success) {
      const fields = firstErrorByField(result.error)
      setErrors({ dropoff: fields.dropoff, time: fields.arrivalTime })
      return
    }
    if (routeCheck.status !== 'ready') {
      setErrors({ time: 'Wait for the route check before continuing' })
      return
    }
    if (!isArrivalTimeWithinOutboundWindow(result.data.arrivalTime, routeCheck.earliestArrivalTime)) {
      setErrors({ time: 'Choose an arrival time that gives enough time for pickup, travel, and drop-off.' })
      return
    }

    setDropoff(result.data.dropoff, result.data.arrivalTime)

    if (state.journeyType === 'return') {
      setReturnPickups([...state.pickups].reverse())
      router.push('/book/return')
    } else {
      router.push('/book/quote')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Where are you dropping off?</h1>
      <p className="text-sm text-slate-11 mb-8">Enter the destination and when you need to arrive.</p>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_18rem]">
          <Input
            id="dropoff"
            label="Drop-off location"
            type="text"
            value={dropoff}
            onChange={(e) => { setDropoffLocal(e.target.value); setErrors((p) => ({ ...p, dropoff: undefined })) }}
            placeholder="e.g. IV2 3BW or Inverness city centre"
            maxLength={100}
            error={errors.dropoff}
            required
          />

          <TimePicker
            id="arrivalTime"
            label="Arrival time"
            min={routeCheck.status === 'ready' ? routeCheck.earliestArrivalTime ?? undefined : undefined}
            value={arrivalTime}
            onChange={(value) => { setArrivalTime(value); setErrors((p) => ({ ...p, time: undefined })) }}
            error={errors.time}
            required
            labelInfo={
              routeCheck.status === 'loading'
                ? 'Checking the earliest possible same-day arrival...'
                : routeCheck.status === 'ready'
                  ? routeCheck.earliestArrivalTime
                    ? `Outbound journey takes about ${formatDuration(routeCheck.totalMinutes)} including boarding and drop-off. Earliest arrival: ${routeCheck.earliestArrivalTime}.`
                    : 'This outbound route cannot be completed in one day. Please call us to arrange this journey.'
                  : undefined
            }
          />
        </div>

        {routeCheck.status === 'error' && (
          <p role="alert" className="rounded-sm border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {routeCheck.message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button intent="secondary" fullWidth onClick={() => router.back()}>Back</Button>
          <Button fullWidth onClick={handleContinue} disabled={routeCheck.status === 'loading' || routeCheck.status === 'error'}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
