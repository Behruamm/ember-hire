'use client'

import { Badge } from '@/components/ui'

type SummaryIconName = 'calendar' | 'users' | 'oneway' | 'return' | 'coach'

export function SummaryChip({
  icon,
  label,
  mobileLabel,
}: {
  icon: SummaryIconName
  label: string
  mobileLabel?: string
}) {
  return (
    <Badge intent="secondary" className="gap-1.5 py-1.5 px-3 rounded-full border border-border">
      <SummaryIcon icon={icon} />
      {mobileLabel ? (
        <>
          <span className="sm:hidden">{mobileLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </Badge>
  )
}

function SummaryIcon({ icon }: { icon: SummaryIconName }) {
  const cls = 'h-4 w-4 text-brand-green'
  if (icon === 'calendar') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
    </svg>
  )
  if (icon === 'users') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6.5 8v-1.5a3 3 0 0 0-2.2-2.9M17 5.2a3 3 0 0 1 0 5.6M5.5 20v-1.5a3 3 0 0 1 2.2-2.9M7 5.2a3 3 0 0 0 0 5.6" />
    </svg>
  )
  if (icon === 'coach') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17V7a3 3 0 013-3h8a3 3 0 013 3v10M5 13h14M7 19h.01M17 19h.01M7 17h10" />
    </svg>
  )
  if (icon === 'return') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10a4 4 0 0 1 0 8H6m0 0 4-4m-4 4 4 4" />
    </svg>
  )
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-5-5m5 5l-5 5" />
    </svg>
  )
}

export function LineItem({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
      <span className="min-w-0 flex-1">
        <span className="block text-slate-11">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-5 text-slate-9">{description}</span>
        )}
      </span>
      <span className="shrink-0 text-right font-normal text-ink">{value}</span>
    </div>
  )
}
