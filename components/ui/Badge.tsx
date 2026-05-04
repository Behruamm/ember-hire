import { HTMLAttributes } from 'react'
import type { Intent } from './types'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: Intent
}

const intentClasses: Record<Intent, string> = {
  primary: 'bg-brand-green/10 text-brand-green-dark',
  secondary: 'bg-surface-mid text-slate-11',
  ghost: 'bg-transparent text-slate-11 border border-border',
  danger: 'bg-red-50 text-red-700',
}

function Badge({ intent = 'secondary', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
        'text-xs font-medium',
        intentClasses[intent],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps }
