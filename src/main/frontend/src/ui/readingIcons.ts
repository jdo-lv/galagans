import type { ComponentType } from 'react'
import {
  BloodPressureIcon,
  CabinAirIcon,
  HeartRateIcon,
  HumidityIcon,
  MoodIcon,
  PvtIcon,
  RadiationIcon,
  SleepIcon,
  Spo2Icon,
  TemperatureIcon,
} from './icons'

/** Icon per READINGS key, shared by the Latest readings tiles and the check-in steps. */
export const READING_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  spo2: Spo2Icon,
  heartRate: HeartRateIcon,
  sleep: SleepIcon,
  mood: MoodIcon,
  bloodPressure: BloodPressureIcon,
  bodyTemp: TemperatureIcon,
  cabinCo2: CabinAirIcon,
  cabinTemp: TemperatureIcon,
  cabinHumidity: HumidityIcon,
  doseRate: RadiationIcon,
  dose30d: RadiationIcon,
  pvt: PvtIcon,
}
