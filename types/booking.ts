export type JourneyType = 'oneway' | 'return'

export interface QuoteBreakdown {
  baseRate: number
  drivingCost: number
  waitingCost: number
  coachCount: number
  subtotal: number
  total: number
}

export interface ContactDetails {
  name: string
  email: string
  phone: string
  notes?: string
}

export interface BookingState {
  journeyType: JourneyType | null
  groupSize: number | null
  date: string | null          // ISO date YYYY-MM-DD
  pickups: string[]            // addresses/postcodes in order
  pickupPassengerCounts: number[] // passengers per pickup, required for multi-coach multi-pickup
  dropoff: string | null
  arrivalTime: string | null   // HH:MM
  returnDepartTime: string | null
  returnPickups: string[]      // pre-filled from outbound pickups
  contact: ContactDetails | null
  quote: QuoteBreakdown | null
  referenceNumber: string | null
}

export const DEFAULT_STATE: BookingState = {
  journeyType: null,
  groupSize: null,
  date: null,
  pickups: [],
  pickupPassengerCounts: [],
  dropoff: null,
  arrivalTime: null,
  returnDepartTime: null,
  returnPickups: [],
  contact: null,
  quote: null,
  referenceNumber: null,
}
