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
  symptoms: string[]
}

export type CheckInDraft = Omit<CheckIn, 'id' | 'recordedAt'>
