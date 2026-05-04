'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  BookingState,
  JourneyType,
  QuoteBreakdown,
  ContactDetails,
} from '@/types/booking'
import { DEFAULT_STATE } from '@/types/booking'

type Action =
  | { type: 'HYDRATE'; payload: BookingState }
  | { type: 'SET_JOURNEY_TYPE'; payload: JourneyType }
  | { type: 'SET_GROUP_SIZE'; payload: number }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_PICKUPS'; payload: string[] }
  | { type: 'SET_PICKUP_PASSENGER_COUNTS'; payload: number[] }
  | { type: 'SET_DROPOFF'; payload: { dropoff: string; arrivalTime: string } }
  | { type: 'SET_RETURN_DEPART_TIME'; payload: string }
  | { type: 'SET_RETURN_PICKUPS'; payload: string[] }
  | { type: 'SET_QUOTE'; payload: QuoteBreakdown }
  | { type: 'SET_CONTACT'; payload: ContactDetails }
  | { type: 'SET_REFERENCE'; payload: string }
  | { type: 'RESET' }

function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case 'HYDRATE': return action.payload
    case 'SET_JOURNEY_TYPE': return { ...state, journeyType: action.payload }
    case 'SET_GROUP_SIZE': return { ...state, groupSize: action.payload }
    case 'SET_DATE': return { ...state, date: action.payload }
    case 'SET_PICKUPS': return { ...state, pickups: action.payload }
    case 'SET_PICKUP_PASSENGER_COUNTS': return { ...state, pickupPassengerCounts: action.payload }
    case 'SET_DROPOFF': return { ...state, dropoff: action.payload.dropoff, arrivalTime: action.payload.arrivalTime }
    case 'SET_RETURN_DEPART_TIME': return { ...state, returnDepartTime: action.payload }
    case 'SET_RETURN_PICKUPS': return { ...state, returnPickups: action.payload }
    case 'SET_QUOTE': return { ...state, quote: action.payload }
    case 'SET_CONTACT': return { ...state, contact: action.payload }
    case 'SET_REFERENCE': return { ...state, referenceNumber: action.payload }
    case 'RESET': return DEFAULT_STATE
    default: return state
  }
}

type ContextValue = {
  state: BookingState
  dispatch: React.Dispatch<Action>
  hydrated: boolean
  clearBooking: () => void
}

const BookingContext = createContext<ContextValue | null>(null)
const STORAGE_KEY = 'ember-booking-v2'

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE)
  const hydratedRef = useRef(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as BookingState
        if (parsed && typeof parsed === 'object') {
          dispatch({ type: 'HYDRATE', payload: { ...DEFAULT_STATE, ...parsed } })
        }
      }
    } catch {
      try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    } finally {
      hydratedRef.current = true
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* unavailable */ }
  }, [state])

  const clearBooking = useCallback(() => {
    dispatch({ type: 'RESET' })
    try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  return (
    <BookingContext.Provider value={{ state, dispatch, hydrated, clearBooking }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider')
  const { state, dispatch, hydrated, clearBooking } = ctx

  const setJourneyType = useCallback((v: JourneyType) => dispatch({ type: 'SET_JOURNEY_TYPE', payload: v }), [dispatch])
  const setGroupSize = useCallback((v: number) => dispatch({ type: 'SET_GROUP_SIZE', payload: v }), [dispatch])
  const setDate = useCallback((v: string) => dispatch({ type: 'SET_DATE', payload: v }), [dispatch])
  const setPickups = useCallback((v: string[]) => dispatch({ type: 'SET_PICKUPS', payload: v }), [dispatch])
  const setPickupPassengerCounts = useCallback((v: number[]) => dispatch({ type: 'SET_PICKUP_PASSENGER_COUNTS', payload: v }), [dispatch])
  const setDropoff = useCallback(
    (dropoff: string, arrivalTime: string) =>
      dispatch({ type: 'SET_DROPOFF', payload: { dropoff, arrivalTime } }),
    [dispatch]
  )
  const setReturnDepartTime = useCallback((v: string) => dispatch({ type: 'SET_RETURN_DEPART_TIME', payload: v }), [dispatch])
  const setReturnPickups = useCallback((v: string[]) => dispatch({ type: 'SET_RETURN_PICKUPS', payload: v }), [dispatch])
  const setQuote = useCallback((v: QuoteBreakdown) => dispatch({ type: 'SET_QUOTE', payload: v }), [dispatch])
  const setContact = useCallback((v: ContactDetails) => dispatch({ type: 'SET_CONTACT', payload: v }), [dispatch])
  const setReference = useCallback((v: string) => dispatch({ type: 'SET_REFERENCE', payload: v }), [dispatch])

  return {
    state,
    dispatch,
    hydrated,
    clearBooking,
    setJourneyType,
    setGroupSize,
    setDate,
    setPickups,
    setPickupPassengerCounts,
    setDropoff,
    setReturnDepartTime,
    setReturnPickups,
    setQuote,
    setContact,
    setReference,
  }
}
