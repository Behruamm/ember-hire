'use client'

import { forwardRef, InputHTMLAttributes, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id: idProp, className = '', ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium text-ink"
          >
            {label}
            {props.required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          className={[
            'w-full rounded-sm border bg-white px-4 py-2.5',
            'text-sm text-ink placeholder:text-slate-9',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-500 focus:ring-red-500/30'
              : 'border-border hover:border-slate-8 focus:border-brand-green focus:ring-brand-green/20',
            'disabled:cursor-not-allowed disabled:bg-surface-light disabled:text-slate-9',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-xs text-slate-11">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
