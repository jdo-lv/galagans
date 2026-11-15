import type { CheckIn } from './checkIn'
import type { Observation } from './observation'
import type { Packet, StoredPacket } from './packet'
import type { Rule } from './rules'
import type { VoiceCommand, VoiceState, VoiceTarget } from './voice'

export interface CheckInRepository {
  add(checkIn: CheckIn): Promise<void>
  listPending(): Promise<CheckIn[]>
  countPending(): Promise<number>
  markSynced(ids: string[]): Promise<void>
}

export interface CheckInHistory {
  list(): Promise<CheckIn[]>
}

export interface RuleSource {
  load(): Promise<Rule[]>
}

export interface CheckInGateway {
  /** Sends check-ins to the server. Resolves with the ids the server accepted. */
  send(checkIns: CheckIn[]): Promise<string[]>
}

export interface ConnectivityMonitor {
  isOnline(): boolean
  subscribe(listener: (online: boolean) => void): () => void
}

export interface PacketRepository {
  /** Stores the packet as queued. */
  add(packet: Packet): Promise<void>
  /** Queued packets, oldest `builtAt` first. */
  listQueued(): Promise<StoredPacket[]>
  markSent(id: string, sentAt: string): Promise<void>
  /** The packet with the newest `builtAt`. */
  latest(): Promise<StoredPacket | undefined>
  /** Every stored packet, queued or sent, newest `builtAt` first. */
  listAll(): Promise<StoredPacket[]>
}

export interface PacketGateway {
  /** Sends one packet to the ground station; rejects unless it was accepted. */
  send(packet: Packet): Promise<void>
}

export interface SpeechInput {
  /** Records until the speaker pauses; resolves with the transcript, '' when nothing was said. */
  listen(signal: AbortSignal): Promise<string>
}

export interface SpeechOutput {
  /** Resolves when the text has been spoken, or as soon as the signal aborts. */
  speak(text: string, signal: AbortSignal): Promise<void>
}

export interface VoiceInterpreter {
  /** The one command in a transcript; `none` when there is none. */
  interpret(transcript: string): Promise<VoiceCommand>
}

/** The screen a voice session moves; the UI provides it. */
export interface VoiceScreen {
  open(target: VoiceTarget): void
  /** A check-in was saved by voice. */
  saved(): void
  show(state: VoiceState): void
}

export interface ObservationHistory {
  list(): Promise<Observation[]>
}

export interface ObservationRepository extends ObservationHistory {
  /** Upserts by `id`, so a redelivered reading replaces itself. */
  put(observation: Observation): Promise<void>
  /** Deletes every Observation whose `effectiveDateTime` is before `time` (ISO 8601). */
  deleteBefore(time: string): Promise<void>
}

export interface ReadingSource {
  /** Calls `listener` with each parsed device message; the message is untrusted. Returns the unsubscribe. */
  subscribe(listener: (message: unknown) => void): () => void
}
