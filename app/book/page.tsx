'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import DatePicker from '@/components/booking/DatePicker'
import { Button, Input } from '@/components/ui'
import { coachCount, capacityWarning } from '@/lib/coaches'
import { createJourneySetupSchema, firstErrorByField, parseJourneyType, VALIDATION_RULES } from '@/lib/schemas'
import { formatDisplay, addDays, toISO } from '@/lib/format'
import { BUSINESS_RULES } from '@/lib/business-rules'
import type { JourneyType } from '@/types/booking'
import type { ReactNode } from 'react'


function CalendarIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-11" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function ArrowIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-medium text-ink">
      {children}
      <span aria-hidden="true" className="ml-1 text-red-600">*</span>
    </p>
  )
}

function JourneyTypeToggle({ value, onChange }: { value: JourneyType | ''; onChange: (v: JourneyType) => void }) {
  const options: { value: JourneyType; label: string }[] = [
    { value: 'oneway', label: 'One way' },
    { value: 'return', label: 'Return' },
  ]
  return (
    <div className="inline-flex rounded-sm border border-border bg-surface-light p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value ? true : false}
          onClick={() => onChange(opt.value)}
          className={[
            'px-5 py-2 text-sm font-medium rounded-[2px] transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40',
            value === opt.value
              ? 'bg-brand-green text-white shadow-sm'
              : 'text-slate-11 hover:text-ink',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function StepJourneySetup() {
  const router = useRouter()
  const { state, setJourneyType, setGroupSize, setDate } = useBooking()
  const [journey, setJourney] = useState<JourneyType | ''>(state.journeyType ?? '')
  const [groupInput, setGroupInput] = useState(state.groupSize?.toString() ?? '')
  const [date, setDateLocal] = useState(state.date)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [errors, setErrors] = useState<{ journey?: string; group?: string; date?: string }>({})

  const minDate = toISO(addDays(new Date(), VALIDATION_RULES.minBookingDays))
  const maxDate = toISO(addDays(new Date(), VALIDATION_RULES.maxBookingDays))
  const parsedGroup = Number.parseInt(groupInput, 10)
  const validGroup = Number.isInteger(parsedGroup) && parsedGroup >= 1
  const coaches = validGroup ? coachCount(parsedGroup) : null
  const warning = validGroup ? capacityWarning(parsedGroup) : null

  const handleDate = (iso: string) => {
    setDateLocal(iso)
    setCalendarOpen(false)
    setErrors((prev) => ({ ...prev, date: undefined }))
  }

  const handleContinue = () => {
    const result = createJourneySetupSchema({ minDate, maxDate }).safeParse({
      journeyType: parseJourneyType(journey),
      groupSize: groupInput,
      date,
    })
    if (!result.success) {
      const fields = firstErrorByField(result.error)
      setErrors({ journey: fields.journeyType, group: fields.groupSize, date: fields.date })
      return
    }
    setJourneyType(result.data.journeyType)
    setGroupSize(result.data.groupSize)
    setDate(result.data.date)
    router.push('/book/pickups')
  }

  const dateBtnCls = (hasError: boolean) => [
    'flex h-12 w-full items-center gap-2 rounded-sm border bg-white px-4 text-left text-sm font-medium',
    'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-green/20',
    hasError
      ? 'border-red-400 text-red-700'
      : date
        ? 'border-brand-green/50 text-ink'
        : 'border-border text-slate-9',
  ].join(' ')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Plan your journey</h1>
      <p className="text-sm text-slate-11 mb-8">Get an estimated quote for single-day coach hire.</p>

      <div className="space-y-6">
        <section className="relative z-20">
          <FieldLabel>Travel date</FieldLabel>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={calendarOpen ? true : false}
            onClick={() => { setCalendarOpen((o) => !o); setErrors((p) => ({ ...p, date: undefined })) }}
            className={dateBtnCls(!!errors.date)}
          >
            <CalendarIcon />
            <span>{date ? formatDisplay(date) : 'Select a date'}</span>
            <svg className="ml-auto h-4 w-4 text-slate-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {errors.date && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{errors.date}</p>}

          {calendarOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end bg-ink/55 px-4 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-4 sm:block sm:w-80 sm:bg-transparent sm:px-0"
              onClick={() => setCalendarOpen(false)}
            >
              <div
                className="w-full rounded-t-md bg-white shadow-card sm:rounded-none sm:bg-transparent sm:shadow-none"
                onClick={(event) => event.stopPropagation()}
              >
                <DatePicker
                  value={date}
                  onChange={handleDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  className="max-w-none rounded-t-md border-0 p-5 shadow-none sm:max-w-xs sm:rounded-md sm:border sm:border-border sm:p-4 sm:shadow-card"
                />
                <div className="px-5 pb-5 sm:hidden">
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    className="h-12 w-full rounded-sm bg-surface-mid text-sm font-semibold text-ink transition-colors hover:bg-slate-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                label="Passengers"
                required
                value={groupInput}
                onChange={(e) => { setGroupInput(e.target.value.slice(0, BUSINESS_RULES.maxGroupSizeInputChars)); setErrors((p) => ({ ...p, group: undefined })) }}
                placeholder="e.g. 45"
                aria-label="Number of passengers"
                error={errors.group}
                className="h-12 text-base"
              />
            </div>
            <div className="shrink-0 flex flex-col gap-1.5">
              <p className="text-xs font-medium text-ink">Journey type <span aria-hidden="true" className="ml-0.5 text-red-500">*</span></p>
              <JourneyTypeToggle
                value={journey}
                onChange={(value) => { setJourney(value); setErrors((p) => ({ ...p, journey: undefined })) }}
              />
              {errors.journey && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.journey}</p>}
            </div>
          </div>
        </section>

        {/* Live capacity notice */}
        {validGroup && coaches !== null && coaches > 1 && parsedGroup <= BUSINESS_RULES.largeGroupLimit && (
          (
            <div className="flex items-start gap-3 rounded-sm border border-brand-green/20 bg-brand-green/5 px-4 py-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-brand-green">{warning}</p>
            </div>
          )
        )}

        {validGroup && parsedGroup > BUSINESS_RULES.largeGroupLimit && (
          <div className="flex items-start gap-3 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm font-medium text-amber-800">
              Group too large for online booking — please call us on {BUSINESS_RULES.emberPhone}
            </p>
          </div>
        )}

        <Button fullWidth size="lg" onClick={handleContinue}>
          Continue
          <ArrowIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
