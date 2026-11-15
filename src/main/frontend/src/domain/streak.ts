// The routine streak shown after a check-in (F13 "Reporting is a win", #40): it counts what the crew member does, never values.

export type DayKind = 'done' | 'reported' | 'paused' | 'missed'

/** `date` is the local calendar date "YYYY-MM-DD". */
export type StreakDay = { date: string; kind: DayKind; synthetic: boolean }

/** A synthetic history day, counted back from the first real check-in day (1 = the day before). */
export type SeedDay = { daysBefore: number; kind: 'done' | 'reported' | 'paused' }

export type ProcessCounter = { label: string; value: string; detail: string; source?: 'synthetic' }

export type RoutineStreak = {
  count: number
  /** 14 days, oldest first; the last is today. */
  days: StreakDay[]
  /** The first real day "YYYY-MM-DD", set when a shown or counted day is synthetic. */
  seededBefore?: string
  /** Placeholders first, then PVT sessions. */
  counters: ProcessCounter[]
  /** Symptom ids logged today → consecutive real days, ending today, on which each was logged. */
  symptomDays: Record<string, number>
}
