'use client'

import { useEffect, useId, useMemo, useState } from 'react'

interface TimePickerProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  error?: string
  hint?: string
  required?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-11" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function toMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function isDisabledTime(value: string, min?: string, max?: string): boolean {
  const minutes = toMinutes(value)
  const minMinutes = min ? toMinutes(min) : null
  const maxMinutes = max ? toMinutes(max) : null

  if (minutes === null) return true
  if (minMinutes !== null && minutes < minMinutes) return true
  if (maxMinutes !== null && minutes > maxMinutes) return true
  return false
}

function closestEnabledTime(preferred: string, min?: string, max?: string): string {
  const candidates = HOURS.flatMap((hour) => MINUTES.map((minute) => `${hour}:${minute}`))
  if (!isDisabledTime(preferred, min, max)) return preferred
  return candidates.find((candidate) => !isDisabledTime(candidate, min, max)) ?? '09:00'
}

export default function TimePicker({ id: idProp, label, value, onChange, min, max, error, hint, required }: TimePickerProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const [open, setOpen] = useState(false)

  const fallbackTime = useMemo(() => closestEnabledTime(value || min || '09:00', min, max), [value, min, max])
  const selected = value || fallbackTime
  const selectedHour = selected.slice(0, 2)
  const selectedMinute = selected.slice(3, 5)
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const selectHour = (hour: string) => {
    const next = closestEnabledTime(`${hour}:${selectedMinute}`, min, max)
    onChange(next)
  }

  const selectMinute = (minute: string) => {
    const next = closestEnabledTime(`${selectedHour}:${minute}`, min, max)
    onChange(next)
    setOpen(false)
  }

  const panel = (
    <div className="overflow-hidden rounded-md border border-border bg-white shadow-card">
      <div className="grid grid-cols-2 divide-x divide-border-subtle">
        <div className="max-h-64 overflow-y-auto p-2">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-slate-9">Hour</p>
          {HOURS.map((hour) => {
            const disabled = MINUTES.every((minute) => isDisabledTime(`${hour}:${minute}`, min, max))
            const active = hour === selectedHour

            return (
              <button
                key={hour}
                type="button"
                disabled={disabled}
                onClick={() => selectHour(hour)}
                className={[
                  'mb-1 flex h-10 w-full items-center justify-center rounded-sm text-sm font-semibold tabular-nums transition-colors',
                  active ? 'bg-brand-green text-white' : 'text-ink hover:bg-surface-light',
                  disabled ? 'cursor-not-allowed text-slate-8 hover:bg-transparent' : '',
                ].join(' ')}
              >
                {hour}
              </button>
            )
          })}
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-slate-9">Minute</p>
          {MINUTES.map((minute) => {
            const disabled = isDisabledTime(`${selectedHour}:${minute}`, min, max)
            const active = minute === selectedMinute

            return (
              <button
                key={minute}
                type="button"
                disabled={disabled}
                onClick={() => selectMinute(minute)}
                className={[
                  'mb-1 flex h-10 w-full items-center justify-center rounded-sm text-sm font-semibold tabular-nums transition-colors',
                  active ? 'bg-brand-green text-white' : 'text-ink hover:bg-surface-light',
                  disabled ? 'cursor-not-allowed text-slate-8 hover:bg-transparent' : '',
                ].join(' ')}
              >
                {minute}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy || undefined}
        aria-invalid={!!error}
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex w-full items-center gap-2 rounded-sm border bg-white px-4 py-2.5 text-left text-sm font-medium',
          'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-500 text-red-700 focus:ring-red-500/30'
            : value
              ? 'border-brand-green/50 text-ink focus:border-brand-green focus:ring-brand-green/20'
              : 'border-border text-slate-9 hover:border-slate-8 focus:border-brand-green focus:ring-brand-green/20',
        ].join(' ')}
      >
        <span className="tabular-nums">{value || 'Select a time'}</span>
        <span className="ml-auto">
          <ClockIcon />
        </span>
      </button>

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-11">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-end bg-ink/55 px-4 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 sm:block sm:w-72 sm:bg-transparent sm:px-0"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full rounded-t-md bg-white shadow-card sm:rounded-none sm:bg-transparent sm:shadow-none"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="p-5 sm:p-0">
                {panel}
              </div>
              <div className="px-5 pb-5 sm:hidden">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-12 w-full rounded-sm bg-surface-mid text-sm font-semibold text-ink transition-colors hover:bg-slate-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
