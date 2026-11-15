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
  /** Synthetic resting value; research/health-indicators.md where noted, else a team choice. */
  nominal: number
  /** Decimal places a synthetic value is drawn with. */
  decimals: number
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
    // SpO₂ 97 % inside Earth normal 95–100 % (health-indicators §4); pulse 63 bpm in-flight 24-h HR [S26].
    fields: [
      { key: 'spo2_pct', indicator: 'spo2Percent', unit: '%', validMin: 50, validMax: 100, required: true, nominal: 97, decimals: 0 },
      { key: 'pulse_bpm', indicator: 'heartRateBpm', unit: 'bpm', validMin: 20, validMax: 250, required: false, nominal: 63, decimals: 0 },
    ],
  },
  {
    id: 'bracelet',
    label: 'bracelet',
    topic: 'crew/a1/wrist/hr',
    // In-flight 24-h HR 63→64 bpm [S26].
    fields: [{ key: 'hr_bpm', indicator: 'heartRateBpm', unit: 'bpm', validMin: 20, validMax: 250, required: true, nominal: 63, decimals: 0 }],
  },
  {
    id: 'bp-cuff',
    label: 'BP cuff',
    topic: 'crew/a1/bp',
    // 108/70 mmHg: the #4 placeholder value (team choice); pulse as the bracelet.
    fields: [
      { key: 'systolic_mmhg', indicator: 'systolicMmHg', unit: 'mmHg', validMin: 50, validMax: 250, required: true, nominal: 108, decimals: 0 },
      { key: 'diastolic_mmhg', indicator: 'diastolicMmHg', unit: 'mmHg', validMin: 30, validMax: 150, required: true, nominal: 70, decimals: 0 },
      { key: 'pulse_bpm', indicator: 'heartRateBpm', unit: 'bpm', validMin: 20, validMax: 250, required: false, nominal: 63, decimals: 0 },
    ],
  },
  {
    id: 'thermometer',
    label: 'thermometer',
    topic: 'crew/a1/thermometer',
    // 36.8 °C inside Earth normal oral 36.1–37.2 °C (health-indicators §6).
    fields: [{ key: 'temp_c', indicator: 'bodyTempC', unit: '°C', validMin: 30, validMax: 43, required: true, nominal: 36.8, decimals: 1 }],
  },
  {
    id: 'env-node',
    label: 'environment node',
    topic: 'module/hab/env',
    // CO₂ 2.3 mmHg: the #4 placeholder, under the 3 mmHg limit; 22 °C and 45 % RH inside 18–27 °C and 25–75 % RH (health-indicators §22).
    fields: [
      { key: 'co2_mmhg_1h', indicator: 'cabinCo2MmHg', unit: 'mmHg', validMin: 0, validMax: 20, required: true, nominal: 2.3, decimals: 1 },
      { key: 'temp_c', indicator: 'cabinTempC', unit: '°C', validMin: 0, validMax: 50, required: false, nominal: 22, decimals: 1 },
      { key: 'rh_pct', indicator: 'cabinHumidityPct', unit: '% RH', validMin: 0, validMax: 100, required: false, nominal: 45, decimals: 0 },
    ],
  },
  {
    id: 'dosimeter',
    label: 'dosimeter',
    topic: 'module/hab/dose',
    // 0.5 mSv/day: surface-mission environment (health-indicators §19 [S7]); 95 mGy-Eq is 38 % of the 250 mGy-Eq 30-day limit, the #4 placeholder share.
    fields: [
      { key: 'dose_rate_msv_day', indicator: 'doseRateMsvDay', unit: 'mSv/day', validMin: 0, validMax: 100, required: true, nominal: 0.5, decimals: 2 },
      // Accumulated blood-forming-organ dose, as a Crew Active Dosimeter reports it; the 30-day limit is in mGy-Eq.
      { key: 'dose_30d_mgy_eq', indicator: 'bfoDose30dMgyEq', unit: 'mGy-Eq', validMin: 0, validMax: 2000, required: true, nominal: 95, decimals: 1 },
    ],
  },
] as const satisfies readonly DeviceSpec[]

export type DeviceLabel = (typeof DEVICES)[number]['label']

export type DeviceId = (typeof DEVICES)[number]['id']
