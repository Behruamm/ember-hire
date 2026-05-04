'use client'

import { usePathname } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'

const STEP_BY_PATH: Record<string, { oneway: number; return: number }> = {
  '/book':              { oneway: 1, return: 1 },
  '/book/pickups':      { oneway: 2, return: 2 },
  '/book/dropoff':      { oneway: 3, return: 3 },
  '/book/return':       { oneway: 4, return: 4 },
  '/book/quote':        { oneway: 4, return: 5 },
  '/book/contact':      { oneway: 5, return: 6 },
  '/book/confirmation': { oneway: 6, return: 7 },
}

const TOTAL = { oneway: 6, return: 7 }

export default function BookingStepLabel() {
  const pathname = usePathname()
  const { state } = useBooking()

  const isReturn = state.journeyType === 'return'
  const stepMap = STEP_BY_PATH[pathname]
  if (!stepMap) return null

  const current = isReturn ? stepMap.return : stepMap.oneway
  const total = isReturn ? TOTAL.return : TOTAL.oneway

  return (
    <p className="text-sm font-medium text-slate-9 mb-6" aria-hidden="true">
      Step {current} of {total}
    </p>
  )
}
