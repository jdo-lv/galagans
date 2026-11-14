import type { ObservationSource } from './observation'
import { STALE_AFTER_MS, type Indicator, type Rule, type Status } from './rules'

export interface ReadingSpec {
  key: string
  label: string
  labelSuffix?: string
  unit: string
  indicator: Indicator
  /** Input limits of the check-in form, the server DTO and the devices, not medical thresholds. */
  validMin: number
  validMax: number
  staleAfterMs: number
  /** Second value of the same measurement, shown after a slash ("108/70"). */
  pairIndicator?: Indicator
}

export interface LatestReading {
  spec: ReadingSpec
  state: Status | 'no-data' | 'stale'
  value?: number
  /** Only for a paired reading: "108/70". */
  text?: string
  recordedAt?: string
  /** Only when a value is shown. */
  source?: ObservationSource
  /** Only for caution and warning: the row that decided it. */
  rule?: Rule
  /** The indicator has no rule rows, so its state is not a judgement. */
  unrated?: true
}

/** One row per "Latest readings" tile, in display order (ideas/mockups/01-body-map.png). */
export const READINGS: ReadingSpec[] = [
  { key: 'spo2', label: 'SpO₂', unit: '%', indicator: 'spo2Percent', validMin: 50, validMax: 100, staleAfterMs: STALE_AFTER_MS },
  { key: 'heartRate', label: 'Heart rate', unit: 'bpm', indicator: 'heartRateBpm', validMin: 20, validMax: 250, staleAfterMs: STALE_AFTER_MS },
  { key: 'sleep', label: 'Sleep', unit: 'h', indicator: 'sleepHours', validMin: 0, validMax: 24, staleAfterMs: STALE_AFTER_MS },
  { key: 'mood', label: 'Mood', unit: '/ 5', indicator: 'mood', validMin: 1, validMax: 5, staleAfterMs: STALE_AFTER_MS },
  {
    key: 'bloodPressure',
    label: 'Blood pressure',
    unit: 'mmHg',
    indicator: 'systolicMmHg',
    pairIndicator: 'diastolicMmHg',
    validMin: 50,
    validMax: 250,
    staleAfterMs: STALE_AFTER_MS,
  },
  { key: 'bodyTemp', label: 'Temperature', unit: '°C', indicator: 'bodyTempC', validMin: 30, validMax: 43, staleAfterMs: STALE_AFTER_MS },
  {
    key: 'cabinCo2',
    label: 'Cabin CO₂',
    labelSuffix: '(1-h avg)',
    unit: 'mmHg',
    indicator: 'cabinCo2MmHg',
    validMin: 0,
    validMax: 20,
    staleAfterMs: STALE_AFTER_MS,
  },
  { key: 'cabinTemp', label: 'Cabin temp', unit: '°C', indicator: 'cabinTempC', validMin: 0, validMax: 50, staleAfterMs: STALE_AFTER_MS },
  { key: 'cabinHumidity', label: 'Cabin humidity', unit: '% RH', indicator: 'cabinHumidityPct', validMin: 0, validMax: 100, staleAfterMs: STALE_AFTER_MS },
  { key: 'doseRate', label: 'Dose rate', unit: 'mSv/day', indicator: 'doseRateMsvDay', validMin: 0, validMax: 100, staleAfterMs: STALE_AFTER_MS },
  // Stale after 4 d: team heuristic from the every-4th-day PVT schedule (health-indicators §13 [S28]).
  {
    key: 'pvt',
    label: 'Reaction time',
    unit: 'ms',
    indicator: 'pvtMedianMs',
    validMin: 130,
    validMax: 10000,
    staleAfterMs: 4 * 24 * 60 * 60 * 1000,
  },
]

export function readingSpec(indicator: Indicator): ReadingSpec {
  for (const spec of READINGS) if (spec.indicator === indicator) return spec
  // Unreachable: domain/readings.test.ts checks every rule's indicator has a spec.
  throw new Error(`No READINGS spec for ${indicator}`)
}
