'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'

interface PickerSheetProps {
  id: string
  ariaLabel: string
  children: ReactNode
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

export function PickerSheet({ id, ariaLabel, children, onClose, returnFocusRef }: PickerSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]:not(:disabled), button:not(:disabled)')
        ?.focus()
    }, 0)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      returnFocusRef?.current?.focus()
    }
  }, [returnFocusRef])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="w-full rounded-t-md bg-white px-4 pb-4 pt-5 shadow-card sm:max-w-[30rem] sm:rounded-md sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        {children}

        <div className="pt-5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-sm bg-surface-mid text-sm font-semibold text-ink transition-colors hover:bg-slate-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export type { PickerSheetProps }
