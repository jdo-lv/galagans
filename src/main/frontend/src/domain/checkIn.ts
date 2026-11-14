export interface CheckIn {
  id: string
  recordedAt: string
  heartRateBpm?: number
  spo2Percent?: number
  sleepHours?: number
  mood?: number
  symptoms: string[]
}

export type CheckInDraft = Omit<CheckIn, 'id' | 'recordedAt'>
