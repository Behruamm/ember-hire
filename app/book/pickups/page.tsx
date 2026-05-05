'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import { Button, Input } from '@/components/ui'
import { createPickupsSchema } from '@/lib/schemas'
import { COACH_CAPACITY } from '@/lib/coach-allocation'
import { BUSINESS_RULES } from '@/lib/business-rules'
import { digitsOnly } from '@/lib/input-format'

type FieldErrors = Record<number, string>

function withoutIndex(errors: FieldErrors, index: number): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors)
      .map(([key, value]) => [Number(key), value] as const)
      .filter(([key]) => key !== index)
      .map(([key, value]) => [key > index ? key - 1 : key, value]),
  )
}

function initialCounts(
  groupSize: number | null,
  pickupCount: number,
  savedCounts: number[],
): string[] {
  if ((groupSize ?? 0) > COACH_CAPACITY && pickupCount <= 1) {
    return Array.from({ length: pickupCount }, () => '')
  }

  if (savedCounts.length) {
    return savedCounts.map((count) => count > COACH_CAPACITY ? '' : String(count))
  }

  return Array.from({ length: pickupCount }, () => '')
}

export default function StepPickups() {
  const router = useRouter()
  const { state, hydrated, setPickups, setPickupPassengerCounts } = useBooking()
  const [stops, setStops] = useState<string[]>(state.pickups.length ? state.pickups : [''])
  const [counts, setCounts] = useState<string[]>(
    initialCounts(
      state.groupSize,
      state.pickups.length ? state.pickups.length : 1,
      state.pickupPassengerCounts,
    )
  )
  const [stopErrors, setStopErrors] = useState<FieldErrors>({})
  const [countErrors, setCountErrors] = useState<FieldErrors>({})
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && !state.date) router.replace('/book')
  }, [hydrated, state.date, router])

  const update = (i: number, val: string) => {
    setStops((prev) => prev.map((s, idx) => (idx === i ? val.slice(0, BUSINESS_RULES.maxLocationLength) : s)))
    setStopErrors((prev) => {
      const next = { ...prev }
      delete next[i]
      return next
    })
    setFormError(null)
  }

  const updateCount = (i: number, val: string) => {
    setCounts((prev) => prev.map((s, idx) => (idx === i ? digitsOnly(val, BUSINESS_RULES.maxGroupSizeInputChars) : s)))
    setCountErrors((prev) => {
      const next = { ...prev }
      delete next[i]
      return next
    })
    setAssignmentError(null)
    setFormError(null)
  }

  const add = () => {
    setStops((prev) => [...prev, ''])
    setCounts((prev) => [...prev, ''])
  }

  const remove = (i: number) => {
    setStops((prev) => prev.filter((_, idx) => idx !== i))
    setCounts((prev) => prev.filter((_, idx) => idx !== i))
    setStopErrors((prev) => withoutIndex(prev, i))
    setCountErrors((prev) => withoutIndex(prev, i))
    setAssignmentError(null)
    setFormError(null)
  }

  const handleContinue = () => {
    const rows = stops.map((stop, i) => ({
      stop: stop.trim(),
      count: counts[i] ?? '',
      originalIndex: i,
    }))
    const nextStopErrors: FieldErrors = {}
    const nextCountErrors: FieldErrors = {}
    let nextAssignmentError: string | null = null

    for (const row of rows) {
      if (!row.stop) nextStopErrors[row.originalIndex] = 'Add a pickup location'
    }

    const seen = new Map<string, number>()
    for (const row of rows) {
      if (!row.stop) continue
      const key = row.stop.toLowerCase()
      if (seen.has(key)) {
        nextStopErrors[row.originalIndex] = 'This pickup location is already added'
      } else {
        seen.set(key, row.originalIndex)
      }
    }

    const validRows = rows.filter((row) => row.stop)
    const needsPassengerCountsForRows = (state.groupSize ?? 0) > COACH_CAPACITY && rows.length > 1
    if (needsPassengerCountsForRows) {
      for (const row of validRows) {
        const parsed = /^\d+$/.test(row.count) ? Number(row.count) : Number.NaN
        if (!Number.isInteger(parsed) || parsed < 0) {
          nextCountErrors[row.originalIndex] = 'Enter passenger numbers for this pickup'
        }
      }

      const assignedPassengers = validRows.reduce((sum, row) => {
        const parsed = /^\d+$/.test(row.count) ? Number(row.count) : Number.NaN
        return sum + (Number.isInteger(parsed) && parsed >= 0 ? parsed : 0)
      }, 0)
      if (assignedPassengers !== state.groupSize) {
        nextAssignmentError = `Passenger counts must add up to ${state.groupSize}`
      }
    }

    if (
      Object.keys(nextStopErrors).length ||
      Object.keys(nextCountErrors).length ||
      nextAssignmentError
    ) {
      setStopErrors(nextStopErrors)
      setCountErrors(nextCountErrors)
      setAssignmentError(nextAssignmentError)
      setFormError(null)
      return
    }

    const result = createPickupsSchema(state.groupSize).safeParse({
      rows: validRows.map(({ stop, count }) => ({ stop, count })),
    })
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Check your pickup details')
      return
    }

    const valid = result.data.rows.map((row) => row.stop)
    if (needsPassengerCountsForRows) {
      setPickupPassengerCounts(result.data.rows.map((row) => Number(row.count)))
    } else {
      setPickupPassengerCounts([])
    }

    setStopErrors({})
    setCountErrors({})
    setAssignmentError(null)
    setFormError(null)
    setPickups(valid)
    router.push('/book/dropoff')
  }

  const needsPassengerCounts = (state.groupSize ?? 0) > COACH_CAPACITY && stops.length > 1
  const hasCountErrors = Object.keys(countErrors).length > 0
  const assigned = counts.reduce((sum, raw, i) => {
    if (!stops[i]?.trim()) return sum
    const v = /^\d+$/.test(raw) ? Number(raw) : Number.NaN
    return sum + (Number.isInteger(v) ? v : 0)
  }, 0)
  const passengerStatusTone = assignmentError || hasCountErrors
    ? 'error'
    : assigned === state.groupSize
      ? 'ready'
      : 'neutral'
  const passengerStatusMessage = hasCountErrors
    ? 'Enter a valid number of passengers for each pickup.'
    : assignmentError
      ? `Adjust the pickup counts so they add up to ${state.groupSize}.`
      : assigned === state.groupSize
        ? 'Passenger counts are ready.'
        : 'Enter how many passengers board at each pickup.'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Where are you picking up?</h1>
      <p className="text-sm text-slate-11 mb-8">Enter postcodes or addresses in order.</p>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-medium text-ink">
            Pickup location
            <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>
          </p>
          {stops.map((stop, i) => (
            <div
              key={i}
              className={[
                'grid items-start gap-x-2 gap-y-2',
                stops.length > 1 && needsPassengerCounts
                  ? 'grid-cols-[1.5rem_minmax(0,1fr)_2.75rem] sm:grid-cols-[1.5rem_minmax(0,1fr)_9rem_2.75rem]'
                  : stops.length > 1
                    ? 'grid-cols-[1.5rem_minmax(0,1fr)_2.75rem] sm:grid-cols-[1.5rem_minmax(0,1fr)_2.75rem]'
                    : 'grid-cols-[1.5rem_minmax(0,1fr)]',
              ].join(' ')}
            >
              <div className={[
                'relative flex min-h-12 w-6 shrink-0 justify-center self-stretch',
                needsPassengerCounts ? 'row-span-2' : '',
              ].join(' ')}>
                {i > 0 && <span aria-hidden="true" className="absolute left-1/2 top-[-0.75rem] h-6 w-px -translate-x-1/2 bg-border" />}
                {i < stops.length - 1 && <span aria-hidden="true" className="absolute bottom-[-0.75rem] left-1/2 top-9 w-px -translate-x-1/2 bg-border" />}
                <div className="relative z-10 mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-green/10">
                  <span className="text-xs font-bold text-brand-green">{i + 1}</span>
                </div>
              </div>

              <div className="min-w-0">
                <Input
                  value={stop}
                  onChange={(e) => update(i, e.target.value)}
                  placeholder={i === 0 ? 'e.g. EH1 1YZ or Edinburgh Waverley' : `Stop ${i + 1} postcode or address`}
                  maxLength={BUSINESS_RULES.maxLocationLength}
                  aria-label={`Pickup stop ${i + 1}`}
                  error={stopErrors[i]}
                />
              </div>

              {needsPassengerCounts && (
                <div className="col-start-2 min-w-0 sm:col-start-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={counts[i] ?? ''}
                    onChange={(e) => updateCount(i, e.target.value)}
                    placeholder="People"
                    aria-label={`Passengers at pickup ${i + 1}`}
                    error={countErrors[i]}
                  />
                </div>
              )}

              {stops.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove stop ${i + 1}`}
                  className={[
                    'row-start-1 flex min-h-12 min-w-11 items-center justify-center rounded-sm text-slate-11 transition-colors hover:bg-surface-light hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green',
                    needsPassengerCounts ? 'col-start-3 sm:col-start-4' : 'col-start-3',
                  ].join(' ')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={add}
            className="flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add another pickup
          </button>
        </div>

        {needsPassengerCounts && (
          <div className={[
            'rounded-sm border px-4 py-3 text-sm',
            passengerStatusTone === 'error'
              ? 'border-red-100 bg-red-50 text-red-700'
              : passengerStatusTone === 'ready'
              ? 'border-brand-green/20 bg-brand-green/5 text-brand-green-dark'
              : 'border-border bg-surface-light text-slate-11',
          ].join(' ')}>
            <p className="font-medium">{assigned} / {state.groupSize} passengers assigned</p>
            <p role={passengerStatusTone === 'error' ? 'alert' : undefined} className={[
              'mt-1 text-xs',
              passengerStatusTone === 'error' ? 'font-medium text-red-600' : '',
            ].filter(Boolean).join(' ')}>
              {passengerStatusMessage}
            </p>
          </div>
        )}

        {formError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-sm px-4 py-3">{formError}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button intent="secondary" fullWidth onClick={() => router.back()}>Back</Button>
          <Button fullWidth onClick={handleContinue}>Continue</Button>
        </div>
      </div>
    </div>
  )
}
