export interface OximeterMessage {
  id: string
  t: string
  spo2_pct: number
  pulse_bpm?: number
  src: 'synthetic'
}

/** #22's oximeter payload, keys in contract order. */
export function oximeterMessage(reading: { spo2: number; pulse?: number }, now: Date, newId: () => string): OximeterMessage {
  return {
    id: newId(),
    t: now.toISOString(),
    spo2_pct: reading.spo2,
    ...(reading.pulse === undefined ? {} : { pulse_bpm: reading.pulse }),
    src: 'synthetic',
  }
}
