'use client'

import { usePathname } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'

const STEPS_ONEWAY = ['Journey', 'Pickups', 'Drop-off', 'Quote', 'Contact', 'Confirm']
const STEPS_RETURN  = ['Journey', 'Pickups', 'Drop-off', 'Return', 'Quote', 'Contact', 'Confirm']

const STEP_BY_PATH: Record<string, { oneway: number; return: number }> = {
  '/book':              { oneway: 1, return: 1 },
  '/book/pickups':      { oneway: 2, return: 2 },
  '/book/dropoff':      { oneway: 3, return: 3 },
  '/book/return':       { oneway: 4, return: 4 },
  '/book/quote':        { oneway: 4, return: 5 },
  '/book/contact':      { oneway: 5, return: 6 },
  '/book/confirmation': { oneway: 6, return: 7 },
}

export default function BookingProgressLine() {
  const pathname = usePathname()
  const { state } = useBooking()

  const isReturn = state.journeyType === 'return'
  const steps = isReturn ? STEPS_RETURN : STEPS_ONEWAY
  const stepMap = STEP_BY_PATH[pathname]
  if (!stepMap) return null

  const current = isReturn ? stepMap.return : stepMap.oneway
  const total = steps.length
  const label = steps[current - 1]

  return (
    <div
      role="progressbar"
      aria-label={`Booking progress: Step ${current} of ${total}, ${label}`}
      className="absolute bottom-0 left-0 right-0 h-[3px] bg-surface-mid overflow-hidden"
    >
      <div
        className="progress-fill"
        style={{ '--progress-percent': `${(current / total) * 100}%` } as React.CSSProperties}
      />
    </div>
  )
}
