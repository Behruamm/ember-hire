'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import { Input, Button } from '@/components/ui'
import { generateReference } from '@/lib/reference'
import { contactSchema, firstErrorByField } from '@/lib/schemas'
import { BUSINESS_RULES } from '@/lib/business-rules'

export default function StepContact() {
  const router = useRouter()
  const { state, hydrated, setContact, setReference } = useBooking()

  const [name, setName] = useState(state.contact?.name ?? '')
  const [email, setEmail] = useState(state.contact?.email ?? '')
  const [phone, setPhone] = useState(state.contact?.phone ?? '')
  const [notes, setNotes] = useState(state.contact?.notes ?? '')
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

  useEffect(() => {
    if (hydrated && !state.quote) router.replace('/book')
  }, [hydrated, state.quote, router])

  const handleSubmit = () => {
    const result = contactSchema.safeParse({ name, email, phone, notes })
    if (!result.success) {
      const fields = firstErrorByField(result.error)
      setErrors({ name: fields.name, email: fields.email, phone: fields.phone })
      return
    }
    setContact(result.data)
    setReference(generateReference())
    router.push('/book/confirmation')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Your contact details</h1>
      <p className="text-sm text-slate-11 mb-8">Our team will call to confirm the journey and arrange payment.</p>

      <div className="space-y-5">
        <Input
          id="name"
          label="Full name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
          placeholder="Jane Smith"
          error={errors.name}
          required
        />

        <Input
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
          placeholder="jane@example.com"
          error={errors.email}
          required
        />

        <Input
          id="phone"
          label="Phone number"
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })) }}
          placeholder="07700 900000"
          error={errors.phone}
          required
        />

        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-ink mb-1.5">
            Anything else we should know? <span className="text-slate-11 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Accessibility needs, large luggage, special requests…"
            maxLength={BUSINESS_RULES.maxNotesLength}
            rows={3}
            className="w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-8 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button intent="secondary" fullWidth onClick={() => router.back()}>Back</Button>
          <Button fullWidth className="whitespace-nowrap" onClick={handleSubmit}>Submit enquiry</Button>
        </div>
      </div>
    </div>
  )
}
