import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CoachItinerary } from '@/components/booking/CoachItinerary'
import type { CoachPlan } from '@/lib/coach-allocation'
import type { OutboundJourneyDetail, ReturnJourneyDetail } from '@/lib/quote-engine'

const plan: CoachPlan = {
  coachNumber: 1,
  passengers: 53,
  pickups: [{ address: 'EH10', passengers: 53 }],
}

const outboundDetail: OutboundJourneyDetail = {
  coachNumber: 1,
  route: ['EH10', 'Murrayfield'],
  driveMinutes: 19,
  boardingMinutes: 30,
  totalMinutes: 49,
  segments: [{ from: 'EH10', to: 'Murrayfield', driveMinutes: 19 }],
}

const returnJourney: ReturnJourneyDetail = {
  coachNumber: 1,
  route: ['Murrayfield', 'EH10'],
  driveMinutes: 18,
  stopMinutes: 30,
  totalMinutes: 48,
  segments: [{ from: 'Murrayfield', to: 'EH10', driveMinutes: 18 }],
}

describe('CoachItinerary', () => {
  it('uses consistent outbound, waiting, and return journey language', () => {
    render(
      <CoachItinerary
        plan={plan}
        outboundDetail={outboundDetail}
        returnJourney={returnJourney}
        arrivalTime="11:10"
        returnDepartTime="13:10"
        showExactPassengers
      />,
    )

    expect(screen.getByText('Outbound journey')).toBeInTheDocument()
    expect(screen.getByText('Board at EH10')).toBeInTheDocument()
    expect(screen.getByText('Travel to Murrayfield')).toBeInTheDocument()
    expect(screen.getByText('Arrive at Murrayfield')).toBeInTheDocument()
    expect(screen.getByText('Drop-off complete')).toBeInTheDocument()
    expect(screen.getByText('Waiting at destination')).toBeInTheDocument()

    expect(screen.getByText('Return journey')).toBeInTheDocument()
    expect(screen.getByText('Board at Murrayfield')).toBeInTheDocument()
    expect(screen.getByText('Travel to EH10')).toBeInTheDocument()
    expect(screen.getByText('Arrive at EH10')).toBeInTheDocument()
    expect(screen.getByText('53 passengers drop off')).toBeInTheDocument()
    expect(screen.getByText('Return complete')).toBeInTheDocument()
    expect(screen.queryByText('Final drop-off at EH10')).not.toBeInTheDocument()
    expect(screen.queryByText('Drop off at EH10')).not.toBeInTheDocument()
  })

  it('maps timeline tones to the expected dot treatment', () => {
    const { container } = render(
      <CoachItinerary
        plan={plan}
        outboundDetail={outboundDetail}
        returnJourney={returnJourney}
        arrivalTime="11:10"
        returnDepartTime="13:10"
        showExactPassengers
      />,
    )

    const travelDots = container.querySelectorAll('[data-timeline-tone="travel"]')
    const completeDots = container.querySelectorAll('[data-timeline-tone="complete"]')
    const waitingDot = container.querySelector('[data-timeline-tone="waiting"]')
    const timeline = within(container)

    expect(timeline.getByText('Travel to Murrayfield')).toBeInTheDocument()
    expect(travelDots[0]).toHaveClass('border-brand-green', 'bg-white')
    expect(completeDots[0]).toHaveClass('border-brand-green', 'bg-brand-green')
    expect(waitingDot).toHaveClass('border-border', 'bg-white')
  })
})
