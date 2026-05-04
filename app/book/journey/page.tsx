'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StepJourneyRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/book')
  }, [router])

  return null
}
