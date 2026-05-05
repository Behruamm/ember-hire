'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { PickerSheet } from '@/components/ui'

interface TimePickerProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  error?: string
  hint?: string
  labelInfo?: string
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

function InfoIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v5m0-8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

export default function TimePicker({ id: idProp, label, value, onChange, min, max, error, hint, labelInfo, required }: TimePickerProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const labelInfoId = `${id}-label-info`
  const panelId = `${id}-panel`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const fallbackTime = useMemo(() => closestEnabledTime(value || min || '09:00', min, max), [value, min, max])
  const selected = value || fallbackTime
  const selectedHour = selected.slice(0, 2)
  const selectedMinute = selected.slice(3, 5)
  const describedBy = [error ? errorId : null, hint ? hintId : null, labelInfo ? labelInfoId : null].filter(Boolean).join(' ')

  const selectHour = (hour: string) => {
    const next = closestEnabledTime(`${hour}:${selectedMinute}`, min, max)
    onChange(next)
  }

  const selectMinute = (minute: string) => {
    const next = closestEnabledTime(`${selectedHour}:${minute}`, min, max)
    onChange(next)
    setOpen(false)
  }

  return (
    <div className="relative flex w-full flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-xs font-medium text-ink">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
        </label>
        {labelInfo && (
          <span className="group relative inline-flex">
            <button
              type="button"
              aria-label={`${label} information`}
              aria-describedby={labelInfoId}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-10 transition-colors hover:bg-surface-light hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand-green/25"
            >
              <InfoIcon />
            </button>
            <span
              id={labelInfoId}
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-6 z-20 w-64 -translate-x-1/2 rounded-sm border border-border bg-white px-3 py-2 text-xs font-medium leading-5 text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {labelInfo}
            </span>
          </span>
        )}
      </div>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={describedBy || undefined}
        aria-invalid={!!error}
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex h-12 w-full items-center gap-2 rounded-sm border bg-white px-4 py-2.5 text-left text-sm font-medium',
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
        <PickerSheet
          id={panelId}
          ariaLabel={`${label} picker`}
          onClose={() => setOpen(false)}
          returnFocusRef={triggerRef}
        >
          <div className="grid grid-cols-2 divide-x divide-border-subtle border-y border-border-subtle">
            <div className="min-w-0 py-3 pr-3">
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-9">Hour</p>
              <div className="max-h-64 overflow-y-auto pr-1">
                {HOURS.map((hour) => {
                  const disabled = MINUTES.every((minute) => isDisabledTime(`${hour}:${minute}`, min, max))
                  const active = hour === selectedHour

                  return (
                    <button
                      key={hour}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => selectHour(hour)}
                      className={[
                        'mb-1 flex min-h-11 w-full items-center justify-center rounded-sm text-sm font-semibold tabular-nums transition-colors',
                        active ? 'bg-brand-green text-white' : 'text-ink hover:bg-surface-light',
                        disabled ? 'cursor-not-allowed text-slate-8 hover:bg-transparent' : '',
                      ].join(' ')}
                    >
                      {hour}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-w-0 py-3 pl-3">
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-9">Minute</p>
              <div className="max-h-64 overflow-y-auto pl-1">
                {MINUTES.map((minute) => {
                  const disabled = isDisabledTime(`${selectedHour}:${minute}`, min, max)
                  const active = minute === selectedMinute

                  return (
                    <button
                      key={minute}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => selectMinute(minute)}
                      className={[
                        'mb-1 flex min-h-11 w-full items-center justify-center rounded-sm text-sm font-semibold tabular-nums transition-colors',
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
        </PickerSheet>
      )}
    </div>
  )
}
