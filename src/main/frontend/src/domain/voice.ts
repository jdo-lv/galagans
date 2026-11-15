/** A screen a voice command can open; the UI maps each one to its route. */
export type VoiceTarget = { screen: 'home' } | { screen: 'system'; system: string } | { screen: 'pvt' } | { screen: 'packet' } | { screen: 'check-in' }

export type VoiceCommand = { kind: 'open'; target: VoiceTarget } | { kind: 'briefing' } | { kind: 'none' }

/** What the astronaut said to one check-in step; the screen validates it. */
export type StepAnswer = { kind: 'value'; value: number } | { kind: 'symptoms'; symptoms: string[] | 'none' } | { kind: 'none' }

export type VoiceState = 'listening' | 'thinking' | 'speaking'

/** The microphone or the speaker can't be used: permission denied, no device, or playback blocked. */
export class AudioUnavailableError extends Error {}
