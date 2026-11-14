export type Indicator = 'heartRateBpm' | 'spo2Percent' | 'sleepHours' | 'mood'

export type Status = 'nominal' | 'caution' | 'warning'

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
  source: 'manual'
  /** Only for caution and warning. */
  rule?: Rule
}
