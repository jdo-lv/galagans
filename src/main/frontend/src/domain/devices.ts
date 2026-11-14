import type { Indicator } from './rules'

export interface DeviceField {
  /** Payload key, e.g. `spo2_pct`. */
  key: string
  indicator: Indicator
  unit: string
  /** Input limits, not medical thresholds; equal to the READINGS limits where the indicator has a tile. */
  validMin: number
  validMax: number
  /** A message without a valid required field is dropped; an invalid optional field is skipped. */
  required: boolean
}

export interface DeviceSpec {
  /** Prefix of the stored Observation ids. */
  id: string
  /** Shown in the source tag: `<label> · <src>`. */
  label: string
  topic: string
  fields: readonly DeviceField[]
}

/** Every device the Personal Health Gateway accepts; JSON payloads `{id, t, <fields>, src}` (#22 contract). */
export const DEVICES = [
  {
    id: 'oximeter',
    label: 'oximeter',
    topic: 'crew/a1/oximeter',
    fields: [
      { key: 'spo2_pct', indicator: 'spo2Percent', unit: '%', validMin: 50, validMax: 100, required: true },
      { key: 'pulse_bpm', indicator: 'heartRateBpm', unit: 'bpm', validMin: 20, validMax: 250, required: false },
    ],
  },
  {
    id: 'bracelet',
    label: 'bracelet',
    topic: 'crew/a1/wrist/hr',
    fields: [{ key: 'hr_bpm', indicator: 'heartRateBpm', unit: 'bpm', validMin: 20, validMax: 250, required: true }],
  },
  {
    id: 'bp-cuff',
    label: 'BP cuff',
    topic: 'crew/a1/bp',
    fields: [
      { key: 'systolic_mmhg', indicator: 'systolicMmHg', unit: 'mmHg', validMin: 50, validMax: 250, required: true },
      { key: 'diastolic_mmhg', indicator: 'diastolicMmHg', unit: 'mmHg', validMin: 30, validMax: 150, required: true },
      { key: 'pulse_bpm', indicator: 'heartRateBpm', unit: 'bpm', validMin: 20, validMax: 250, required: false },
    ],
  },
  {
    id: 'thermometer',
    label: 'thermometer',
    topic: 'crew/a1/thermometer',
    fields: [{ key: 'temp_c', indicator: 'bodyTempC', unit: '°C', validMin: 30, validMax: 43, required: true }],
  },
  {
    id: 'env-node',
    label: 'environment node',
    topic: 'module/hab/env',
    fields: [
      { key: 'co2_mmhg_1h', indicator: 'cabinCo2MmHg', unit: 'mmHg', validMin: 0, validMax: 20, required: true },
      { key: 'temp_c', indicator: 'cabinTempC', unit: '°C', validMin: 0, validMax: 50, required: false },
      { key: 'rh_pct', indicator: 'cabinHumidityPct', unit: '% RH', validMin: 0, validMax: 100, required: false },
    ],
  },
  {
    id: 'dosimeter',
    label: 'dosimeter',
    topic: 'module/hab/dose',
    fields: [
      { key: 'dose_rate_msv_day', indicator: 'doseRateMsvDay', unit: 'mSv/day', validMin: 0, validMax: 100, required: true },
      // Accumulated blood-forming-organ dose, as a Crew Active Dosimeter reports it; the 30-day limit is in mGy-Eq.
      { key: 'dose_30d_mgy_eq', indicator: 'bfoDose30dMgyEq', unit: 'mGy-Eq', validMin: 0, validMax: 2000, required: true },
    ],
  },
] as const satisfies readonly DeviceSpec[]

export type DeviceLabel = (typeof DEVICES)[number]['label']
