export interface CheckIn {
  id: string
  recordedAt: string
  heartRateBpm?: number
  spo2Percent?: number
  sleepHours?: number
  mood?: number
  /** PVT-B result in whole ms and counts (#16). */
  pvtMedianMs?: number
  pvtLapses?: number
  pvtFalseStarts?: number
  /** Karolinska Sleepiness Scale, 1–9 (#29). */
  kss?: number
  /** Symptom ids from `SYMPTOMS`; empty when none or not answered. */
  symptoms: string[]
  /** True when the symptom step was answered, so "none reported" differs from "skipped" (#29). */
  symptomsAnswered?: boolean
}

export type CheckInDraft = Omit<CheckIn, 'id' | 'recordedAt'>
