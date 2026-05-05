'use client'

import { useState } from 'react'

interface DatePickerProps {
  value: string | null    // ISO YYYY-MM-DD
  onChange: (iso: string) => void
  minDate?: string        // ISO YYYY-MM-DD, defaults to today
  maxDate?: string        // ISO YYYY-MM-DD
  className?: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayISO(): string {
  const t = new Date()
  return toISO(t.getFullYear(), t.getMonth(), t.getDate())
}

export default function DatePicker({ value, onChange, minDate, maxDate, className }: DatePickerProps) {
  const min = minDate ?? todayISO()

  const initial = value
    ? { y: parseInt(value.slice(0, 4)), m: parseInt(value.slice(5, 7)) - 1 }
    : { y: new Date().getFullYear(), m: new Date().getMonth() }

  const [viewYear, setViewYear] = useState(initial.y)
  const [viewMonth, setViewMonth] = useState(initial.m)

  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = todayISO()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`

  return (
    <div
      className={[
        'bg-white border border-border rounded-md p-4 select-none w-full max-w-xs shadow-card',
        className,
      ].filter(Boolean).join(' ')}
      role="group"
      aria-label="Date picker"
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="min-h-11 min-w-11 flex items-center justify-center rounded-sm text-slate-11 hover:bg-surface-light hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-semibold text-ink" aria-live="polite">
          {monthLabel}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="min-h-11 min-w-11 flex items-center justify-center rounded-sm text-slate-11 hover:bg-surface-light hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1" aria-hidden="true">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-9 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} aria-hidden="true" />

          const iso = toISO(viewYear, viewMonth, day)
          const isSelected = iso === value
          const isDisabled = iso < min || (maxDate ? iso > maxDate : false)
          const isToday = iso === today

          return (
            <button
              key={iso}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(iso)}
              aria-label={`${day} ${MONTHS[viewMonth]} ${viewYear}${isSelected ? ', selected' : ''}${isToday ? ', today' : ''}`}
              aria-pressed={isSelected ? 'true' : 'false'}
              className={[
                'w-full aspect-square flex items-center justify-center rounded-sm text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-1',
                isSelected
                  ? 'bg-brand-green text-white'
                  : isDisabled
                    ? 'text-slate-8 cursor-not-allowed'
                    : isToday
                      ? 'text-brand-green font-semibold hover:bg-brand-green/10'
                      : 'text-ink hover:bg-surface-light',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
