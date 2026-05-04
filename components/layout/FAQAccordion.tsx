'use client'

import { useState } from 'react'
import { BUSINESS_RULES } from '@/lib/business-rules'

const FAQS = [
  {
    q: 'Is your pricing really that simple?',
    a: `Yes. £${BUSINESS_RULES.baseRateGbp} base fee per coach, then £${BUSINESS_RULES.driveRatePerHourGbp} per hour of driving or passenger stops and £${BUSINESS_RULES.waitRatePerHourGbp} per hour of waiting. No hidden fuel surcharges.`,
  },
  {
    q: 'How do I pay?',
    a: 'Payment is arranged after your booking is confirmed. Our team will be in touch to collect payment details. We accept all major bank transfers and cards.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes. Contact us as soon as possible and we will do our best to accommodate. Cancellation terms depend on how close to the journey date you cancel.',
  },
  {
    q: 'How many passengers can the coach carry?',
    a: `Our coaches seat up to ${BUSINESS_RULES.coachCapacity} passengers. If your group is larger, the quote will factor in multiple coaches.`,
  },
  {
    q: 'What if my journey takes longer than estimated?',
    a: 'No problem. Your booking is based on estimated hours, and we can adjust the final cost if the journey runs over. Our drivers are flexible and experienced.',
  },
  {
    q: 'Are your coaches really 100% electric?',
    a: 'Yes. Every Ember coach is fully electric — zero tailpipe emissions, quiet rides, and USB charging at every seat.',
  },
]

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-border">
      {FAQS.map((faq, i) => {
        const isOpen = open === i
        return (
        <div key={i}>
          <button
            type="button"
            className="w-full flex items-center justify-between py-5 text-left gap-4
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded-sm"
            onClick={() => setOpen(isOpen ? null : i)}
            aria-controls={`faq-answer-${i}`}
          >
            <span className="text-ink font-medium text-sm sm:text-base">{faq.q}</span>
            <svg
              className={`w-5 h-5 text-slate-11 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === i && (
            <p id={`faq-answer-${i}`} className="pb-5 text-sm text-slate-11 leading-relaxed">
              {faq.a}
            </p>
          )}
        </div>
        )
      })}
    </div>
  )
}
