import { describe, expect, it } from 'vitest'
import {
  contactSchema,
  createJourneySetupSchema,
  createPickupsSchema,
  dropoffSchema,
  firstErrorByField,
  returnDetailsSchema,
} from '@/lib/schemas'

describe('journey setup schema', () => {
  const schema = createJourneySetupSchema({
    minDate: '2026-05-04',
    maxDate: '2027-05-02',
  })

  it('coerces valid passenger input and keeps journey/date values', () => {
    const result = schema.parse({
      journeyType: 'return',
      groupSize: '54',
      date: '2026-05-04',
    })

    expect(result).toEqual({
      journeyType: 'return',
      groupSize: 54,
      date: '2026-05-04',
    })
  })

  it('rejects bookings inside the 48-hour window', () => {
    const result = schema.safeParse({
      journeyType: 'oneway',
      groupSize: '10',
      date: '2026-05-03',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).date).toContain('Please allow at least')
    }
  })

  it('rejects groups over the public booking limit', () => {
    const result = schema.safeParse({
      journeyType: 'oneway',
      groupSize: '501',
      date: '2026-05-04',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).groupSize).toContain('large group')
    }
  })

  it('rejects 0 passengers', () => {
    const result = schema.safeParse({
      journeyType: 'oneway',
      groupSize: '0',
      date: '2026-05-04',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).groupSize).toContain('at least 1')
    }
  })

  it('rejects negative passengers', () => {
    const result = schema.safeParse({
      journeyType: 'oneway',
      groupSize: '-1',
      date: '2026-05-04',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).groupSize).toContain('at least 1')
    }
  })

  it('rejects a date beyond the max booking window', () => {
    const result = schema.safeParse({
      journeyType: 'oneway',
      groupSize: '10',
      date: '2027-05-03',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).date).toContain('within the next year')
    }
  })
})

describe('pickup schema', () => {
  it('allows normal pickups without passenger counts for one coach groups', () => {
    const result = createPickupsSchema(40).parse({
      rows: [
        { stop: ' EH1 ', count: '' },
        { stop: 'EH10', count: '' },
      ],
    })

    expect(result.rows.map((row) => row.stop)).toEqual(['EH1', 'EH10'])
  })

  it('requires over-capacity multi-pickup passenger counts to match group size', () => {
    const result = createPickupsSchema(70).safeParse({
      rows: [
        { stop: 'A', count: '40' },
        { stop: 'B', count: '20' },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Passenger counts must add up to 70')
    }
  })

  it('rejects duplicate pickup locations', () => {
    const result = createPickupsSchema(40).safeParse({
      rows: [
        { stop: 'EH1', count: '' },
        { stop: 'EH1', count: '' },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('This pickup location is already added')
    }
  })
})

describe('dropoff and return schemas', () => {
  it('requires dropoff location', () => {
    const result = dropoffSchema.safeParse({ dropoff: '', arrivalTime: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).dropoff).toBe('Drop-off location is required')
    }
  })

  it('requires arrival time', () => {
    const result = dropoffSchema.safeParse({ dropoff: '', arrivalTime: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).arrivalTime).toBe('Arrival time is required')
    }
  })

  it('requires return departure time', () => {
    const result = returnDetailsSchema.safeParse({
      returnDepartTime: '',
      returnPickups: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).returnDepartTime).toBe('Return departure time is required')
    }
  })

  it('requires at least one return stop', () => {
    const result = returnDetailsSchema.safeParse({
      returnDepartTime: '',
      returnPickups: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).returnPickups).toBeDefined()
    }
  })
})

describe('contact schema', () => {
  it('accepts valid contact details', () => {
    const result = contactSchema.safeParse({
      name: 'Behram',
      email: 'behram@example.com',
      phone: '07700 900000',
    })

    expect(result.success).toBe(true)
  })

  it('trims whitespace from name, email, and phone', () => {
    expect(contactSchema.parse({
      name: ' Behram ',
      email: ' behram@example.com ',
      phone: ' 07700 900000 ',
    })).toEqual({
      name: 'Behram',
      email: 'behram@example.com',
      phone: '07700 900000',
    })
  })

  it('rejects invalid email addresses', () => {
    const result = contactSchema.safeParse({
      name: 'Behram',
      email: 'not-email',
      phone: '07700 900000',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).email).toBe('Valid email is required')
    }
  })

  it('accepts submission without notes', () => {
    const result = contactSchema.safeParse({
      name: 'Behram',
      email: 'behram@example.com',
      phone: '07700 900000',
    })

    expect(result.success).toBe(true)
  })

  it('rejects notes over 500 characters', () => {
    const result = contactSchema.safeParse({
      name: 'Behram',
      email: 'behram@example.com',
      phone: '07700 900000',
      notes: 'a'.repeat(501),
    })

    expect(result.success).toBe(false)
  })
})

describe('return details schema', () => {
  it('accepts an earlier return departure time because it only validates field shape', () => {
    const result = returnDetailsSchema.safeParse({
      returnDepartTime: '12:00',
      returnPickups: ['EH1 1YZ'],
      arrivalTime: '14:00',
    })

    expect(result.success).toBe(true)
  })

  it('rejects malformed return departure times', () => {
    const result = returnDetailsSchema.safeParse({
      returnDepartTime: '24:00',
      returnPickups: ['EH1 1YZ'],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstErrorByField(result.error).returnDepartTime).toBe('Please enter a valid time')
    }
  })
})
