import {
  differenceInCalendarDays,
  isAfter,
  isBefore,
  max as maxDate,
  min as minDate,
  startOfDay,
} from 'date-fns'
import type {
  EmploymentSpan,
  EADPeriod,
  MergedSpan,
  UnemploymentSummary,
  CalculationResult,
  ComplianceStatus,
} from '../types'

// Constants for unemployment limits
const OPT_UNEMPLOYMENT_LIMIT = 90 // days
const TOTAL_UNEMPLOYMENT_LIMIT_WITH_STEM = 150 // days (total across OPT + STEM)

type ReferenceDate = Date

/**
 * Normalizes a date to midnight UTC to avoid timezone issues
 */
function normalizeDate(date: Date): Date {
  return startOfDay(date)
}

function getNormalizedReferenceDate(referenceDate?: ReferenceDate): Date {
  return normalizeDate(referenceDate ?? new Date())
}

/**
 * Calculates the number of calendar days between two dates (inclusive)
 */
function calculateDaysBetween(start: Date, end: Date): number {
  return differenceInCalendarDays(normalizeDate(end), normalizeDate(start)) + 1
}

/**
 * Clamps an employment span to fit within an EAD period
 * Returns null if the span doesn't overlap with the EAD period
 */
function clampSpanToEAD(
  span: EmploymentSpan,
  eadPeriod: EADPeriod,
  referenceDate: Date
): MergedSpan | null {
  const spanStart = normalizeDate(span.startDate)
  const spanEnd = span.endDate
    ? normalizeDate(span.endDate)
    : referenceDate // Treat ongoing as today
  const eadStart = normalizeDate(eadPeriod.startDate)
  const eadEnd = normalizeDate(eadPeriod.endDate)

  // Check if span overlaps with EAD period
  if (isAfter(spanStart, eadEnd) || isBefore(spanEnd, eadStart)) {
    return null // No overlap
  }

  // Clamp to EAD boundaries
  return {
    startDate: maxDate([spanStart, eadStart]),
    endDate: minDate([spanEnd, eadEnd]),
  }
}

/**
 * Merges overlapping or contiguous employment spans
 * Assumes spans are already sorted by start date
 */
function mergeOverlappingSpans(spans: MergedSpan[]): MergedSpan[] {
  if (spans.length === 0) return []

  const merged: MergedSpan[] = []
  let current: MergedSpan = spans[0]!

  for (let i = 1; i < spans.length; i++) {
    const next = spans[i]!

    // Check if current and next overlap or are contiguous (within 1 day)
    const daysBetween = differenceInCalendarDays(
      next.startDate,
      current.endDate
    )

    if (daysBetween <= 1) {
      // Merge: extend current to the max end date
      current = {
        startDate: current.startDate,
        endDate: maxDate([current.endDate, next.endDate]),
      }
    } else {
      // No overlap: push current and start new span
      merged.push(current)
      current = next
    }
  }

  merged.push(current)
  return merged
}

/**
 * Calculates total employed days within an EAD period
 */
function calculateEmployedDays(
  employmentSpans: EmploymentSpan[],
  eadPeriod: EADPeriod,
  referenceDate: Date
): number {
  // Clamp all spans to the EAD period
  const clampedSpans = employmentSpans
    .map((span) => clampSpanToEAD(span, eadPeriod, referenceDate))
    .filter((span): span is MergedSpan => span !== null)

  // Sort by start date
  clampedSpans.sort((a, b) =>
    differenceInCalendarDays(a.startDate, b.startDate)
  )

  // Merge overlapping spans
  const mergedSpans = mergeOverlappingSpans(clampedSpans)

  // Sum up employed days
  return mergedSpans.reduce((total, span) => {
    return total + calculateDaysBetween(span.startDate, span.endDate)
  }, 0)
}

/**
 * Calculates unemployment days for a specific EAD period
 */
function calculateUnemploymentForPeriod(
  employmentSpans: EmploymentSpan[],
  eadPeriod: EADPeriod,
  limitDays: number,
  referenceDate: Date
): UnemploymentSummary {
  const eadStart = normalizeDate(eadPeriod.startDate)
  const eadEnd = normalizeDate(eadPeriod.endDate)
  const effectiveEnd = minDate([eadEnd, referenceDate])

  // No unemployment has accrued if the period hasn't begun yet
  if (isBefore(effectiveEnd, eadStart)) {
    return {
      phase: eadPeriod.type,
      usedDays: 0,
      remainingDays: limitDays,
      limitDays,
      percentage: 0,
    }
  }

  const adjustedPeriod: EADPeriod = {
    ...eadPeriod,
    startDate: eadStart,
    endDate: effectiveEnd,
  }

  const totalDaysInPeriod = calculateDaysBetween(
    adjustedPeriod.startDate,
    adjustedPeriod.endDate
  )
  const employedDays = calculateEmployedDays(
    employmentSpans,
    adjustedPeriod,
    referenceDate
  )
  const usedDays = Math.max(0, totalDaysInPeriod - employedDays)
  const remainingDays = Math.max(0, limitDays - usedDays)
  const percentage =
    limitDays > 0
      ? (usedDays / limitDays) * 100
      : usedDays > 0
        ? 100
        : 0

  return {
    phase: eadPeriod.type,
    usedDays,
    remainingDays,
    limitDays,
    percentage,
  }
}

/**
 * Determines compliance status based on unemployment days used
 */
function determineStatus(
  totalUsedDays: number,
  totalAllowedDays: number
): { status: ComplianceStatus; message: string } {
  if (totalUsedDays > totalAllowedDays) {
    return {
      status: 'violation',
      message:
        'You have exceeded the allowed unemployment days. You may be out of status. Please consult your international student office immediately.',
    }
  }

  const percentage = (totalUsedDays / totalAllowedDays) * 100

  if (percentage >= 80) {
    return {
      status: 'warning',
      message:
        'You are approaching the unemployment limit. Please find employment soon to maintain status.',
    }
  }

  return {
    status: 'normal',
    message: 'Your unemployment days are within the allowed limit.',
  }
}

/**
 * Main calculation function that computes unemployment for OPT and STEM periods
 */
export function calculateUnemployment(
  optPeriod: EADPeriod | null,
  stemPeriod: EADPeriod | null,
  employmentSpans: EmploymentSpan[],
  options?: { referenceDate?: Date }
): CalculationResult | null {
  if (!optPeriod) {
    return null // Can't calculate without at least OPT period
  }

  const referenceDate = getNormalizedReferenceDate(options?.referenceDate)

  // Calculate Phase 1 (OPT)
  const phase1 = calculateUnemploymentForPeriod(
    employmentSpans,
    optPeriod,
    OPT_UNEMPLOYMENT_LIMIT,
    referenceDate
  )

  let phase2: UnemploymentSummary | null = null
  let totalUsedDays = phase1.usedDays
  let totalAllowedDays = OPT_UNEMPLOYMENT_LIMIT

  // Calculate Phase 2 (STEM) if applicable
  if (stemPeriod) {
    const availableStemDays = Math.max(
      0,
      TOTAL_UNEMPLOYMENT_LIMIT_WITH_STEM - phase1.usedDays
    )
    phase2 = calculateUnemploymentForPeriod(
      employmentSpans,
      stemPeriod,
      availableStemDays, // STEM limit is reduced by OPT usage
      referenceDate
    )
    totalUsedDays = phase1.usedDays + phase2.usedDays
    totalAllowedDays = TOTAL_UNEMPLOYMENT_LIMIT_WITH_STEM
  }

  // Determine overall status
  const { status, message } = determineStatus(totalUsedDays, totalAllowedDays)

  return {
    phase1,
    phase2,
    totalUsedDays,
    totalAllowedDays,
    status,
    statusMessage: message,
  }
}

/**
 * Validates an employment span
 */
export function validateEmploymentSpan(span: EmploymentSpan): string | null {
  if (!span.employerName || span.employerName.trim() === '') {
    return 'Employer name is required'
  }

  if (!span.startDate) {
    return 'Start date is required'
  }

  if (span.endDate && isBefore(span.endDate, span.startDate)) {
    return 'End date must be after start date'
  }

  return null
}

/**
 * Validates an EAD period
 */
export function validateEADPeriod(period: EADPeriod): string | null {
  if (!period.startDate) {
    return 'Start date is required'
  }

  if (!period.endDate) {
    return 'End date is required'
  }

  if (isBefore(period.endDate, period.startDate)) {
    return 'End date must be after start date'
  }

  return null
}
