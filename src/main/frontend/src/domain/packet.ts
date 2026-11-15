import type { LatestReading } from './readings'

/** Demo Mars one-way light time, inside the 3–22 min range of research/nasa-hrp.md §5; not a measured delay. */
export const ONE_WAY_DELAY_MS = 845_000

/** Crew note limit, the same as the ground station's (#18). */
export const NOTE_MAX = 500

/** One "Latest readings" row as the crew saw it when the packet was built. */
export interface PacketItem {
  key: string
  /** With the label suffix: "Cabin CO₂ (1-h avg)". */
  label: string
  unit: string
  /** `unrated`: a value no rule row judged, so it is never called nominal. */
  state: LatestReading['state'] | 'unrated'
  value?: number
  text?: string
  recordedAt?: string
  source?: LatestReading['source']
  /** Only on levels 2–5: the rule that decided it and who acts. */
  ruleId?: string
  tier?: string
}

/** A surgeon packet: a snapshot of the readings plus the crew note, sent store-and-forward. */
export interface Packet {
  id: string
  /** ISO 8601 UTC; also the time it was queued. */
  builtAt: string
  oneWayDelayMs: number
  note: string
  items: PacketItem[]
}

export interface StoredPacket extends Packet {
  state: 'queued' | 'sent'
  /** ISO 8601 UTC time of the ground station's 2xx. */
  sentAt?: string
}
