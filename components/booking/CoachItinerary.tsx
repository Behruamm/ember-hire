import { BOARDING_MINUTES, formatTime, parseTime, formatJourneyDuration } from '@/lib/pickup-times'
import type { OutboundJourneyDetail, ReturnJourneyDetail } from '@/lib/quote-engine'
import type { CoachPlan } from '@/lib/coach-allocation'

type TimelineStep = {
  time: string
  title: string
  detail?: string
  tone: TimelineTone
}

type WaitingDivider = {
  title: string
  duration: string
  tone: 'waiting'
}

type TimelineTone = 'section' | 'boarding' | 'travel' | 'arrival' | 'dropoff' | 'complete' | 'waiting'

const TIMELINE_COPY = {
  outboundSection: 'Outbound journey',
  returnSection: 'Return journey',
  boardAt: (stop: string) => `Board at ${stop}`,
  travelTo: (stop: string) => `Travel to ${stop}`,
  arriveAt: (stop: string) => `Arrive at ${stop}`,
  returnDropoffDetail: (passengers: number) => `${passengers} passenger${passengers === 1 ? '' : 's'} drop off`,
  outboundComplete: 'Drop-off complete',
  returnComplete: 'Return complete',
  waitingAtDestination: 'Waiting at destination',
} as const

const TIMELINE_DOT_CLASS: Record<Exclude<TimelineTone, 'section'>, string> = {
  boarding: 'border-border bg-white',
  travel: 'border-brand-green bg-white',
  arrival: 'border-border bg-white',
  dropoff: 'border-border bg-white',
  complete: 'border-brand-green bg-brand-green',
  waiting: 'border-border bg-white',
}

function addMinutes(time: string, minutes: number): string {
  return formatTime(parseTime(time) + minutes)
}

function subtractMinutes(time: string, minutes: number): string {
  return formatTime(parseTime(time) - minutes)
}

function passengersAtStop(plan: CoachPlan, stop: string): number {
  return plan.pickups
    .filter((pickup) => pickup.address === stop)
    .reduce((sum, pickup) => sum + pickup.passengers, 0)
}

function buildOutboundTimeline({
  detail,
  plan,
  arrivalTime,
  showExactPassengers,
}: {
  detail: OutboundJourneyDetail
  plan: CoachPlan
  arrivalTime: string
  showExactPassengers: boolean
}): TimelineStep[] {
  const pickupStops = detail.route.slice(0, -1)
  const pickupBoardingMinutes = pickupStops.length * BOARDING_MINUTES
  let cursor = subtractMinutes(arrivalTime, detail.driveMinutes + pickupBoardingMinutes + BOARDING_MINUTES)
  const steps: TimelineStep[] = [{
    time: '',
    title: TIMELINE_COPY.outboundSection,
    detail: formatJourneyDuration(detail.totalMinutes),
    tone: 'section',
  }]

  pickupStops.forEach((stop, i) => {
    const passengers = passengersAtStop(plan, stop)
    const passengerCopy = showExactPassengers && passengers > 0 ? `${passengers} passengers` : undefined
    steps.push({ time: cursor, title: TIMELINE_COPY.boardAt(stop), detail: passengerCopy, tone: 'boarding' })
    cursor = addMinutes(cursor, BOARDING_MINUTES)
    const segment = detail.segments[i]
    steps.push({ time: cursor, title: TIMELINE_COPY.travelTo(segment.to), tone: 'travel' })
    cursor = addMinutes(cursor, segment.driveMinutes)
  })

  const destination = detail.route[detail.route.length - 1]
  steps.push({ time: cursor, title: TIMELINE_COPY.arriveAt(destination), tone: 'arrival' })
  cursor = addMinutes(cursor, BOARDING_MINUTES)
  steps.push({ time: cursor, title: TIMELINE_COPY.outboundComplete, tone: 'complete' })

  return steps
}

function buildReturnTimeline({
  returnJourney,
  plan,
  returnDepartTime,
  showExactPassengers,
}: {
  returnJourney: ReturnJourneyDetail
  plan: CoachPlan
  returnDepartTime: string
  showExactPassengers: boolean
}): TimelineStep[] {
  let cursor = returnDepartTime
  const destination = returnJourney.route[0]
  const steps: TimelineStep[] = [
    { time: '', title: TIMELINE_COPY.returnSection, detail: formatJourneyDuration(returnJourney.totalMinutes), tone: 'section' },
    { time: cursor, title: TIMELINE_COPY.boardAt(destination), detail: `${plan.passengers} passengers`, tone: 'boarding' },
  ]

  cursor = addMinutes(cursor, BOARDING_MINUTES)

  returnJourney.segments.forEach((segment, i) => {
    steps.push({ time: cursor, title: TIMELINE_COPY.travelTo(segment.to), tone: 'travel' })
    cursor = addMinutes(cursor, segment.driveMinutes)
    const passengers = passengersAtStop(plan, segment.to)
    const passengerCopy = showExactPassengers && passengers > 0
      ? TIMELINE_COPY.returnDropoffDetail(passengers)
      : undefined
    steps.push({
      time: cursor,
      title: TIMELINE_COPY.arriveAt(segment.to),
      detail: passengerCopy,
      tone: 'arrival',
    })
    cursor = addMinutes(cursor, BOARDING_MINUTES)
  })

  steps.push({ time: cursor, title: TIMELINE_COPY.returnComplete, tone: 'complete' })
  return steps
}

function buildWaitingStep(outboundSteps: TimelineStep[], returnDepartTime: string): WaitingDivider | null {
  const outboundComplete = [...outboundSteps].reverse().find((step) => step.tone === 'complete')
  if (!outboundComplete) return null
  const waitMinutes = parseTime(returnDepartTime) - parseTime(outboundComplete.time)
  // midnight wraparound: return depart is next-day relative to drop-off complete
  const DAY_MINUTES = 24 * 60
  const sameDayWait = waitMinutes >= 0 ? waitMinutes : waitMinutes + DAY_MINUTES
  if (sameDayWait <= 0) return null
  return { title: TIMELINE_COPY.waitingAtDestination, duration: formatJourneyDuration(sameDayWait), tone: 'waiting' }
}

function TimelineRow({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  if (step.tone === 'section') {
    return (
      <div className="flex items-baseline justify-between gap-3 border-t border-border-subtle pb-2 pt-2 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-9">{step.title}</p>
        {step.detail && <p className="text-sm font-semibold text-ink">{step.detail}</p>}
      </div>
    )
  }

  const dotClass = TIMELINE_DOT_CLASS[step.tone]

  return (
    <div className="grid grid-cols-[52px_20px_1fr] gap-3 text-sm">
      <time className="pt-px text-right text-sm font-semibold tabular-nums text-ink">{step.time}</time>
      <div className="flex flex-col items-center">
        <span className={`mt-1 block h-3 w-3 shrink-0 rounded-full border-2 ${dotClass}`} data-timeline-tone={step.tone} />
        {!isLast && <span className="mt-1 h-full min-h-7 w-px bg-border" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium leading-5 text-ink">{step.title}</p>
        {step.detail && <p className="mt-0.5 text-xs leading-5 text-slate-11">{step.detail}</p>}
      </div>
    </div>
  )
}

function WaitingDividerRow({ wait }: { wait: WaitingDivider }) {
  return (
    <div className="grid grid-cols-[52px_20px_1fr] gap-3 text-sm">
      <span />
      <div className="flex flex-col items-center">
        <span className={`mt-2 block h-3 w-3 shrink-0 rounded-full border-2 ${TIMELINE_DOT_CLASS[wait.tone]}`} data-timeline-tone={wait.tone} />
        <span className="mt-1 h-full min-h-8 w-px bg-border" />
      </div>
      <div className="mb-4 mt-1 text-sm leading-5">
        <span className="font-medium text-ink">{wait.title}</span>
        <span className="text-slate-11"> · {wait.duration}</span>
      </div>
    </div>
  )
}

function TimelineBlock({
  outboundSteps,
  waiting,
  returnSteps,
}: {
  outboundSteps: TimelineStep[]
  waiting: WaitingDivider | null
  returnSteps: TimelineStep[] | null
}) {
  const totalRows = outboundSteps.length + (returnSteps?.length ?? 0)
  return (
    <section>
      <div>
        {outboundSteps.map((step, i) => (
          <TimelineRow
            key={`outbound-${step.time}-${step.title}-${i}`}
            step={step}
            isLast={!waiting && !returnSteps && i === totalRows - 1}
          />
        ))}
        {waiting && <WaitingDividerRow wait={waiting} />}
        {returnSteps?.map((step, i) => (
          <TimelineRow
            key={`return-${step.time}-${step.title}-${i}`}
            step={step}
            isLast={i === returnSteps.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

export function CoachItinerary({
  plan,
  outboundDetail,
  returnJourney,
  arrivalTime,
  returnDepartTime,
  showExactPassengers,
}: {
  plan: CoachPlan
  outboundDetail: OutboundJourneyDetail
  returnJourney: ReturnJourneyDetail | null
  arrivalTime: string
  returnDepartTime: string | null
  showExactPassengers: boolean
}) {
  const outboundSteps = buildOutboundTimeline({ detail: outboundDetail, plan, arrivalTime, showExactPassengers })
  const returnSteps = returnJourney && returnDepartTime
    ? buildReturnTimeline({ returnJourney, plan, returnDepartTime, showExactPassengers })
    : null
  const waitingStep = returnSteps && returnDepartTime ? buildWaitingStep(outboundSteps, returnDepartTime) : null

  return (
    <section className="border-t border-border-subtle py-4 first:border-t-0 first:pt-0">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="text-base font-semibold text-ink">Coach {plan.coachNumber}</p>
        <span className="text-sm font-medium text-slate-11">{plan.passengers} passengers</span>
      </div>
      <div>
        <TimelineBlock outboundSteps={outboundSteps} waiting={waitingStep} returnSteps={returnSteps} />
        {!returnSteps && (
          <section className="rounded-sm border border-dashed border-border-subtle bg-surface-light px-3 py-3 text-sm text-slate-11">
            No return journey for this quote.
          </section>
        )}
      </div>
    </section>
  )
}
