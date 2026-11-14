import type { ComponentType } from 'react'
import { BloodPressureIcon, CabinAirIcon, HeartRateIcon, MoodIcon, PvtIcon, SleepIcon, Spo2Icon } from './icons'

/** Icon per READINGS key, shared by the Latest readings tiles and the check-in steps. */
export const READING_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  spo2: Spo2Icon,
  heartRate: HeartRateIcon,
  sleep: SleepIcon,
  mood: MoodIcon,
  bloodPressure: BloodPressureIcon,
  cabinCo2: CabinAirIcon,
  pvt: PvtIcon,
}
