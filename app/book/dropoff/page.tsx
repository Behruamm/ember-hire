'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/context/BookingContext'
import TimePicker from '@/components/booking/TimePicker'
import { Input, Button } from '@/components/ui'
import { dropoffSchema, firstErrorByField } from '@/lib/schemas'

export default function StepDropoff() {
  const router = useRouter()
  const { state, hydrated, setDropoff, setReturnPickups } = useBooking()
  const [dropoff, setDropoffLocal] = useState(state.dropoff ?? '')
  const [arrivalTime, setArrivalTime] = useState(state.arrivalTime ?? '')
  const [errors, setErrors] = useState<{ dropoff?: string; time?: string }>({})

  useEffect(() => {
    if (hydrated && !state.pickups.length) router.replace('/book')
  }, [hydrated, state.pickups.length, router])

  const handleContinue = () => {
    const result = dropoffSchema.safeParse({ dropoff, arrivalTime })
    if (!result.success) {
      const fields = firstErrorByField(result.error)
      setErrors({ dropoff: fields.dropoff, time: fields.arrivalTime })
      return
    }

    setDropoff(result.data.dropoff, result.data.arrivalTime)

    if (state.journeyType === 'return') {
      setReturnPickups([...state.pickups].reverse())
      router.push('/book/return')
    } else {
      router.push('/book/quote')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Where are you dropping off?</h1>
      <p className="text-sm text-slate-11 mb-8">Enter the destination and when you need to arrive.</p>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_18rem]">
          <Input
            id="dropoff"
            label="Drop-off location"
            type="text"
            value={dropoff}
            onChange={(e) => { setDropoffLocal(e.target.value); setErrors((p) => ({ ...p, dropoff: undefined })) }}
            placeholder="e.g. IV2 3BW or Inverness city centre"
            maxLength={100}
            error={errors.dropoff}
            required
          />

          <TimePicker
            id="arrivalTime"
            label="Arrival time"
            value={arrivalTime}
            onChange={(value) => { setArrivalTime(value); setErrors((p) => ({ ...p, time: undefined })) }}
            error={errors.time}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button intent="secondary" fullWidth onClick={() => router.back()}>Back</Button>
          <Button fullWidth onClick={handleContinue}>Continue</Button>
        </div>
      </div>
    </div>
  )
}
