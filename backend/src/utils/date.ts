import { DateInput } from '../types/index.js'
import { ValidationError } from './Errors.js'

/**
 * Convert input into a UTC Date object.
 * - If input is already a Date, it’s returned as-is (still an absolute UTC instant).
 * - If input is a string with no timezone info, it’s assumed to be UTC.
 * - If input is YYYY-MM-DD (date-only), it’s normalized to 00:00:00.000Z.
 */
export function toUTC(input: DateInput): Date {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) throw new ValidationError('Invalid date')
    return input
  }

  const hasOffset = /[zZ]|[+-]\d{2}:\d{2}$/.test(input)

  if (!hasOffset && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(input + 'T00:00:00.000Z')
  }

  if (!hasOffset) {
    return new Date(input + 'Z')
  }

  const d = new Date(input)
  if (isNaN(d.getTime())) throw new ValidationError('Invalid date')
  return d
}

export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

export function endOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}

export function toDateOnlyUTC(input: DateInput): Date {
  const d = toUTC(input)
  return startOfDayUTC(d)
}
