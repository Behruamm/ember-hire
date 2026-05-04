'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import { Button } from '@/components/ui'

export default function StepConfirmation() {
  const router = useRouter()
  const { state, hydrated, clearBooking } = useBooking()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (hydrated && !state.referenceNumber) router.replace('/book')
  }, [hydrated, state.referenceNumber, router])

  if (!hydrated || !state.referenceNumber) return null

  const fullRef = `EMB-${state.referenceNumber}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Success mark */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/10 mb-4">
          <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-ink mb-2">Enquiry submitted!</h1>
        <p className="text-sm text-slate-11">Your reference number</p>
        <div className="mt-3 inline-block bg-surface-light border border-border rounded-md px-6 py-3">
          <span className="text-xl font-bold tracking-widest text-ink">{fullRef}</span>
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-brand-green underline underline-offset-2 hover:text-brand-green-dark transition-colors"
          >
            {copied ? 'Copied!' : 'Copy reference'}
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-slate-11 mb-8">
        We&apos;ll call within 24 hours to confirm. Full details sent to your email.
      </p>

      <Button fullWidth onClick={() => { clearBooking(); router.push('/') }}>
        Back to Home
      </Button>
    </div>
  )
}

