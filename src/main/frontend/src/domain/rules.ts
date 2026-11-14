import type { ObservationSource } from './observation'

export type Indicator = 'heartRateBpm' | 'spo2Percent' | 'sleepHours' | 'mood' | 'pvtMedianMs'

export type Status = 'nominal' | 'caution' | 'warning'

/** A value older than this shows as stale. Team heuristic from #1, not from a source. */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000

/** The detail chart shows readings from the last 7 days (issue #9). */
export const CHART_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/** One threshold row. Exactly one of `below` (value < below) or `above` (value > above). */
export interface Rule {
  id: string
  system: string
  indicator: Indicator
  label: string
  unit: string
  validMin: number
  validMax: number
  below?: number
  above?: number
  status: Exclude<Status, 'nominal'>
  tier: string
  what: string
  why: string
  howDecided: string
  next: string
  source: string
}

export interface SystemStatus {
  system: string
  state: Status | 'no-data' | 'stale'
  label?: string
  unit?: string
  value?: number
  recordedAt?: string
  /** Free-text sub line, only on placeholders. */
  detail?: string
  /** Not set for no-data. */
  source?: ObservationSource | 'synthetic'
  /** Only for caution and warning. */
  rule?: Rule
}

/** Synthetic stand-in for a body system with no rules yet; always nominal, never explained or aged. */
export interface Placeholder {
  system: string
  state: 'nominal'
  detail: string
  source: 'synthetic'
}

export interface ChartPoint {
  recordedAt: string
  value: number
  source: ObservationSource
  status: Status | 'stale'
}

export interface SystemDetail {
  status: SystemStatus
  rules: Rule[]
  points: ChartPoint[]
}
