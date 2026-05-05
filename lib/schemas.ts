import { z } from 'zod'
import { BUSINESS_RULES } from '@/lib/business-rules'
import { COACH_CAPACITY } from '@/lib/coach-allocation'
import type { JourneyType } from '@/types/booking'

export const VALIDATION_RULES = {
  emberPhone: BUSINESS_RULES.emberPhone,
  minBookingDays: BUSINESS_RULES.minBookingNoticeDays,
  maxBookingDays: BUSINESS_RULES.maxBookingWindowDays,
  largeGroupLimit: BUSINESS_RULES.largeGroupLimit,
  maxLocationLength: BUSINESS_RULES.maxLocationLength,
} as const

const isoDateSchema = z.string().min(1, 'Please select a travel date').regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a travel date')

function timeSchema(requiredMessage: string) {
  return z
    .string()
    .min(1, requiredMessage)
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please enter a valid time')
}

function toPassengerCount(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return Number.NaN
  return Number(trimmed)
}

function requiredLocation(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .max(VALIDATION_RULES.maxLocationLength, `Please keep this location under ${VALIDATION_RULES.maxLocationLength} characters`)
}

export function createJourneySetupSchema(options: { minDate: string; maxDate: string }) {
  return z.object({
    journeyType: z.enum(['oneway', 'return'], {
      message: 'Please select a journey type',
    }),
    groupSize: z.preprocess(
      toPassengerCount,
      z
        .number()
        .int('Passenger count must be a whole number')
        .min(1, 'Please enter at least 1 passenger')
        .max(
          VALIDATION_RULES.largeGroupLimit,
          `For large group bookings please call us on ${VALIDATION_RULES.emberPhone}`,
        ),
    ),
    date: isoDateSchema
      .refine((date) => date >= options.minDate, {
        message: `Please allow at least ${VALIDATION_RULES.minBookingDays} days for us to arrange your hire`,
      })
      .refine((date) => date <= options.maxDate, {
        message: 'Please choose a date within the next year',
      }),
  })
}

export const dropoffSchema = z.object({
  dropoff: requiredLocation('Drop-off location is required'),
  arrivalTime: timeSchema('Arrival time is required'),
})

export const returnDetailsSchema = z.object({
  returnDepartTime: timeSchema('Return departure time is required'),
  returnPickups: z.array(requiredLocation('Return drop-off location is required')).min(1),
})

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  notes: z.string().trim().max(BUSINESS_RULES.maxNotesLength).optional(),
})

export function createPickupsSchema(groupSize: number | null) {
  return z.object({
    rows: z.array(z.object({
      stop: requiredLocation('Add at least one pickup location'),
      count: z.string(),
    })).min(1, 'Add at least one pickup location'),
  }).superRefine((value, ctx) => {
    const stops = value.rows.map((row) => row.stop)
    const duplicate = stops.find((stop, index) => stops.indexOf(stop) !== index)
    if (duplicate) {
      ctx.addIssue({
        code: 'custom',
        path: ['rows'],
        message: 'This pickup location is already added',
      })
    }

    const needsPassengerCounts = (groupSize ?? 0) > COACH_CAPACITY && value.rows.length > 1
    if (!needsPassengerCounts) return

    const counts = value.rows.map((row, index) => {
      const parsed = /^\d+$/.test(row.count) ? Number(row.count) : Number.NaN
      if (!Number.isInteger(parsed) || parsed < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['rows', index, 'count'],
          message: 'Enter passenger numbers for each pickup',
        })
        return 0
      }
      return parsed
    })

    const assigned = counts.reduce((sum, count) => sum + count, 0)
    if (assigned !== groupSize) {
      ctx.addIssue({
        code: 'custom',
        path: ['rows'],
        message: `Passenger counts must add up to ${groupSize}. Currently assigned: ${assigned}.`,
      })
    }
  })
}

export function firstErrorByField(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

export function parseJourneyType(value: JourneyType | ''): JourneyType | undefined {
  return value || undefined
}
