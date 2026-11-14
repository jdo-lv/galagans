import type { ProcessCounter, SeedDay } from '../domain/streak'

/** Synthetic demo history before the first real check-in (mockup 09 cells 133–145). Not measurements. */
export const mockStreakSeed: SeedDay[] = [
  ...[13, 12, 11, 10, 9, 8].map((daysBefore) => ({ daysBefore, kind: 'done' as const })),
  { daysBefore: 7, kind: 'paused' },
  { daysBefore: 6, kind: 'paused' },
  { daysBefore: 5, kind: 'reported' },
  { daysBefore: 4, kind: 'reported' },
  { daysBefore: 3, kind: 'done' },
  { daysBefore: 2, kind: 'reported' },
  { daysBefore: 1, kind: 'reported' },
]

/**
 * Synthetic process counters until exercise and fluids (F17) are logged in the app. ISS crew average about 600 min/week of
 * exercise [C3]; the water provision is 2.5 L/day [C2][C13] (research/countermeasures.md). "540" matches mockStatuses.
 */
export const mockCounters: ProcessCounter[] = [
  { label: 'Exercise this week', value: '540 / 600 min', detail: 'countermeasure minutes done', source: 'synthetic' },
  { label: 'Fluid log', value: '4 of 7 days', detail: 'days you logged to target', source: 'synthetic' },
]
