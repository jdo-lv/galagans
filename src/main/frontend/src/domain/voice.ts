import type { CheckInDraft } from './checkIn'

/** A screen a voice command can open; the UI maps each one to its route. */
export type VoiceTarget = { screen: 'home' } | { screen: 'system'; system: string } | { screen: 'pvt' } | { screen: 'packet' }

/** Check-in values heard in one answer: only the fields the astronaut said. */
export type SpokenValues = Partial<Pick<CheckInDraft, 'sleepHours' | 'heartRateBpm' | 'spo2Percent' | 'mood'>>

export type VoiceCommand =
  | { kind: 'open'; target: VoiceTarget }
  | { kind: 'briefing' }
  | { kind: 'checkin'; values: SpokenValues; /** Heard but outside the check-in limits: named, never saved. */ outOfRange?: SpokenValues }
  | { kind: 'none' }

export type VoiceState = 'listening' | 'thinking' | 'speaking'

const SPOKEN: Record<keyof SpokenValues, (value: number) => string> = {
  sleepHours: (v) => `sleep ${v} hours`,
  heartRateBpm: (v) => `heart rate ${v} beats per minute`,
  spo2Percent: (v) => `oxygen ${v} percent`,
  mood: (v) => `mood ${v} of 5`,
}

/** "Sleep 6 hours, mood 4 of 5": the values read back before they are saved. */
export function speakValues(values: SpokenValues): string {
  const parts = (Object.keys(SPOKEN) as (keyof SpokenValues)[])
    .filter((key) => values[key] !== undefined)
    .map((key) => SPOKEN[key](values[key] as number))
  const text = parts.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}


/** The microphone or the speaker can't be used: permission denied, no device, or playback blocked. */
export class AudioUnavailableError extends Error {}
