'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import { SummaryChip, LineItem } from '@/components/booking/QuoteBreakdown'
import { CoachItinerary } from '@/components/booking/CoachItinerary'
import { Button, Card } from '@/components/ui'
import { formatGBP } from '@/lib/pricing'
import { formatHours } from '@/lib/pickup-times'
import { formatShortDate } from '@/lib/format'
import { calculateQuote, type JourneyDetail } from '@/lib/quote-engine'
import { BUSINESS_RULES } from '@/lib/business-rules'

async function fetchSegments(stops: string[]) {
  const res = await fetch('/api/route-segments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stops }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Route calculation failed')
  return data.segments
}

export default function StepQuote() {
  const router = useRouter()
  const { state, hydrated, setQuote } = useBooking()
  const {
    pickups,
    pickupPassengerCounts,
    dropoff,
    arrivalTime,
    journeyType,
    returnPickups,
    returnDepartTime,
    groupSize,
    date,
    quote,
    contact,
    referenceNumber,
  } = state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'network' | 'address' | null>(null)
  const [driveMinutes, setDriveMinutes] = useState(0)
  const [waitMinutes, setWaitMinutes] = useState(0)
  const [journeyDetail, setJourneyDetail] = useState<JourneyDetail | null>(null)

  useEffect(() => {
    const missingReturn = journeyType === 'return' && (!returnDepartTime || !returnPickups.length)
    if (hydrated && (!dropoff || missingReturn)) router.replace('/book')
  }, [hydrated, dropoff, journeyType, returnDepartTime, returnPickups.length, router])

  const calcRoute = useCallback(async () => {
    if (!pickups.length || !dropoff || !arrivalTime || !groupSize) return
    setLoading(true)
    setError(null)
    try {
      setJourneyDetail(null)
      const result = await calculateQuote(
        { journeyType, groupSize, date, pickups, pickupPassengerCounts, dropoff, arrivalTime, returnDepartTime, returnPickups, contact, quote: null, referenceNumber },
        { getSegments: fetchSegments },
      )
      setJourneyDetail(result.journeyDetail)
      setDriveMinutes(result.driveMinutes)
      setWaitMinutes(result.waitMinutes)
      setQuote(result.quote)
    } catch (err) {
      setError(err instanceof TypeError ? 'network' : 'address')
    } finally {
      setLoading(false)
    }
  }, [journeyType, groupSize, date, pickups, pickupPassengerCounts, dropoff, arrivalTime, returnDepartTime, returnPickups, contact, referenceNumber, setQuote])

  useEffect(() => {
    if (!hydrated) return
    const timer = window.setTimeout(() => { void calcRoute() }, 0)
    return () => window.clearTimeout(timer)
  }, [hydrated, calcRoute])

  const q = quote
  const isReturnJourney = journeyType === 'return'
  const journeyLabel = isReturnJourney ? 'Return' : 'One way'
  const perPerson = q && groupSize ? q.total / groupSize : null
  const depositEstimate = q ? q.total * BUSINESS_RULES.depositRate : null
  const quoteAnnouncement = q && groupSize ? `Your quote is ready: ${formatGBP(q.total)} for ${groupSize} passengers.` : null
  const showExactPickupPassengers = pickupPassengerCounts.length === pickups.length || pickups.length === 1

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Your quote</h1>
      <p className="text-sm text-slate-11 mb-8">Based on real drive times for your route.</p>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          aria-label="Calculating your route…"
          className="flex items-center gap-3 py-12 justify-center text-slate-11 text-sm"
        >
          <svg className="w-5 h-5 animate-spin text-brand-green" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Calculating your route…
        </div>
      ) : error ? (
        <div className="space-y-5">
          <div className="bg-red-50 border border-red-100 rounded-sm px-4 py-4 text-sm text-red-700">
            {error === 'network'
              ? 'Connection problem — please check your internet and try again.'
              : 'We couldn\'t calculate a route for those locations. Check your pickup and drop-off addresses are correct.'}
          </div>
          <div className="flex gap-3">
            <Button intent="secondary" fullWidth onClick={() => router.push('/book/pickups')}>Edit locations</Button>
            {error === 'network' && <Button fullWidth onClick={calcRoute}>Try again</Button>}
          </div>
          <p className="text-xs text-center text-slate-11">
            Having trouble? Call us on {BUSINESS_RULES.emberPhone}.
          </p>
        </div>
      ) : q && (
        <div className="space-y-8">
          {quoteAnnouncement && (
            <p aria-live="polite" aria-atomic="true" className="sr-only">{quoteAnnouncement}</p>
          )}

          <section data-testid="quote-hero">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-green">Estimated total</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
              <p className="text-4xl font-semibold leading-none text-ink sm:text-5xl">{formatGBP(q.total)}</p>
              {perPerson !== null && (
                <div
                  data-testid="per-person-badge"
                  className="mb-0.5 rounded-md border border-border-subtle bg-surface-light px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  {formatGBP(perPerson)} <span className="font-medium text-slate-11">per person</span>
                </div>
              )}
            </div>
            <div data-testid="quote-summary-chips" className="mt-5 flex flex-wrap gap-2">
              <SummaryChip icon="calendar" label={date ? formatShortDate(date) : 'Date not set'} />
              <SummaryChip icon={isReturnJourney ? 'return' : 'oneway'} label={journeyLabel} />
              <SummaryChip icon="users" label={`${groupSize} passengers`} mobileLabel={`${groupSize}`} />
            </div>
          </section>

          <Card padding="none" shadow={false}>
            <div className="border-b border-border-subtle bg-surface-light px-4 py-3">
              <p className="text-sm font-semibold text-ink">Price summary</p>
            </div>
            <div className="divide-y divide-border-subtle">
              <LineItem label={`Base rate (${q.coachCount} coach${q.coachCount !== 1 ? 'es' : ''})`} value={formatGBP(q.baseRate)} />
              <LineItem label={`Driving & boarding (${formatHours(driveMinutes)})`} value={formatGBP(q.drivingCost)} />
              {waitMinutes > 0 && (
                <LineItem label={`Waiting (${formatHours(waitMinutes)})`} value={formatGBP(q.waitingCost)} />
              )}
            </div>
            <div className="px-4 py-4 bg-brand-green/5 border-t border-brand-green/20 flex justify-between items-center">
              <span className="font-semibold text-ink">Estimated total</span>
              <span className="text-lg font-semibold text-ink">{formatGBP(q.total)}</span>
            </div>
          </Card>

          {journeyDetail && (
            <details data-testid="route-details" className="group overflow-hidden rounded-md border border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-surface-light px-4 py-3 text-left transition-colors hover:bg-surface-mid/50">
                <span className="block text-sm font-semibold text-ink">View journey details</span>
                <svg className="h-4 w-4 shrink-0 text-slate-11 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 py-4">
                {journeyDetail.coachPlans.map((plan) => {
                  const outboundDetail = journeyDetail.outbound.find((d) => d.coachNumber === plan.coachNumber)
                  const returnJourney = journeyDetail.returnJourneys.find((d) => d.coachNumber === plan.coachNumber) ?? null
                  if (!outboundDetail || !arrivalTime) return null
                  return (
                    <CoachItinerary
                      key={plan.coachNumber}
                      plan={plan}
                      outboundDetail={outboundDetail}
                      returnJourney={returnJourney}
                      arrivalTime={arrivalTime}
                      returnDepartTime={returnDepartTime}
                      showExactPassengers={showExactPickupPassengers}
                    />
                  )
                })}
              </div>
            </details>
          )}

          <div className="space-y-3 border-t border-border-subtle pt-2">
            <div className="text-center text-xs leading-5 text-slate-11">
              <p>No payment is taken now. Ember confirms the final details before booking.</p>
              {depositEstimate !== null && (
                <p>Estimated deposit after confirmation: {formatGBP(depositEstimate)} ({BUSINESS_RULES.depositRate * 100}%).</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button intent="secondary" fullWidth disabled={loading} onClick={() => router.back()}>Back</Button>
              <Button fullWidth onClick={() => router.push('/book/contact')}>Continue</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
