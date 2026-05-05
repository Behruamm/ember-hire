'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import type { Size, Intent } from './types'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: Exclude<Intent, 'danger'>
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const intentClasses: Record<Exclude<Intent, 'danger'>, string> = {
  primary:
    'bg-brand-green text-white hover:bg-brand-green-dark focus-visible:ring-brand-green disabled:bg-surface-mid disabled:text-slate-9',
  secondary:
    'bg-transparent text-ink border border-border hover:bg-surface-light focus-visible:ring-ink disabled:text-slate-9 disabled:border-border-subtle',
  ghost:
    'bg-transparent text-ink hover:bg-surface-light focus-visible:ring-ink disabled:text-slate-9',
}

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-11 px-3 text-xs gap-1.5',
  md: 'min-h-11 px-7 text-sm gap-2',
  lg: 'h-12 px-7 text-lg gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      intent = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          'inline-flex items-center justify-center rounded-[3px] font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'cursor-pointer disabled:cursor-not-allowed',
          intentClasses[intent],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
