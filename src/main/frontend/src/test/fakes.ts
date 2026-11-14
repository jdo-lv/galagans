import { CombinedObservationHistory } from '../application/CombinedObservationHistory'
import type { CheckIn } from '../domain/checkIn'
import type { Observation } from '../domain/observation'
import type { Packet, StoredPacket } from '../domain/packet'
import type {
  CheckInGateway,
  CheckInHistory,
  CheckInRepository,
  ConnectivityMonitor,
  ObservationRepository,
  PacketGateway,
  PacketRepository,
  ReadingSource,
  RuleSource,
  SpeechInput,
  SpeechOutput,
  VoiceInterpreter,
  VoiceScreen,
} from '../domain/ports'
import type { Rule } from '../domain/rules'
import { AudioUnavailableError, type VoiceCommand, type VoiceState, type VoiceTarget } from '../domain/voice'

export class FakeRepository implements CheckInRepository, CheckInHistory {
  items = new Map<string, { checkIn: CheckIn; pending: boolean }>()
  failList = false
  failAdd = false

  async list() {
    if (this.failList) throw new Error('storage failed')
    return [...this.items.values()].map((i) => i.checkIn)
  }

  async add(checkIn: CheckIn) {
    if (this.failAdd) throw new Error('storage failed')
    this.items.set(checkIn.id, { checkIn, pending: true })
  }
  async listPending() {
    return [...this.items.values()].filter((i) => i.pending).map((i) => i.checkIn)
  }
  async countPending() {
    return (await this.listPending()).length
  }
  async markSynced(ids: string[]) {
    ids.forEach((id) => {
      const item = this.items.get(id)
      if (item) item.pending = false
    })
  }
}

export class FakeGateway implements CheckInGateway {
  sent: CheckIn[][] = []
  fail = false

  async send(checkIns: CheckIn[]) {
    if (this.fail) throw new Error('offline')
    this.sent.push(checkIns)
    return checkIns.map((c) => c.id)
  }
}

export class FakeRuleSource implements RuleSource {
  fail = false

  constructor(private readonly rules: Rule[] = []) {}

  async load() {
    if (this.fail) throw new Error('rules failed')
    return this.rules
  }
}

export class FakeConnectivity implements ConnectivityMonitor {
  online = true
  private listeners = new Set<(online: boolean) => void>()

  isOnline() {
    return this.online
  }
  subscribe(listener: (online: boolean) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  set(online: boolean) {
    this.online = online
    this.listeners.forEach((l) => l(online))
  }
}

export const checkIn = (id: string): CheckIn => ({ id, recordedAt: '2026-11-14T08:00:00Z', symptoms: [] })

const byBuiltAt = (a: StoredPacket, b: StoredPacket) => Date.parse(a.builtAt) - Date.parse(b.builtAt)

export class FakePacketRepository implements PacketRepository {
  items = new Map<string, StoredPacket>()
  failAdd = false
  failLatest = false

  async add(packet: Packet) {
    if (this.failAdd) throw new Error('storage failed')
    this.items.set(packet.id, { ...packet, state: 'queued' })
  }
  async listQueued() {
    return [...this.items.values()].filter((p) => p.state === 'queued').sort(byBuiltAt)
  }
  async markSent(id: string, sentAt: string) {
    const stored = this.items.get(id)
    if (stored) this.items.set(id, { ...stored, state: 'sent', sentAt })
  }
  async latest() {
    if (this.failLatest) throw new Error('storage failed')
    return [...this.items.values()].sort(byBuiltAt).at(-1)
  }
}

export class FakePacketGateway implements PacketGateway {
  sent: Packet[] = []
  calls = 0
  /** 0-based call numbers that fail like a network error or a non-2xx. */
  failCalls = new Set<number>()

  async send(packet: Packet) {
    if (this.failCalls.has(this.calls++)) throw new Error('offline')
    this.sent.push(packet)
  }
}

export const packet = (id: string, builtAt: string): Packet => ({ id, builtAt, oneWayDelayMs: 845_000, note: '', items: [] })

/** Hears `said` in order, then waits like a quiet room until the signal aborts; `onListen` runs before each turn. */
export class FakeSpeechInput implements SpeechInput {
  said: string[] = []
  onListen = () => {}
  audioBlocked = false

  async listen(signal: AbortSignal) {
    this.onListen()
    if (this.audioBlocked) throw new AudioUnavailableError('microphone blocked')
    if (signal.aborted) return ''
    const next = this.said.shift()
    if (next !== undefined) return next
    return new Promise<string>((resolve) => signal.addEventListener('abort', () => resolve(''), { once: true }))
  }
}

export class FakeSpeechOutput implements SpeechOutput {
  spoken: string[] = []
  onSpeak: (text: string) => void = () => {}

  async speak(text: string) {
    this.spoken.push(text)
    this.onSpeak(text)
  }
}

export class FakeVoiceInterpreter implements VoiceInterpreter {
  commands: Record<string, VoiceCommand> = {}
  unreachable = false
  onInterpret = () => {}

  async interpret(transcript: string): Promise<VoiceCommand> {
    if (this.unreachable) throw new Error('voice host down')
    this.onInterpret()
    return Object.hasOwn(this.commands, transcript) ? this.commands[transcript] : { kind: 'none' }
  }
}

export class FakeVoiceScreen implements VoiceScreen {
  opened: VoiceTarget[] = []
  /** True when the last screen opened after a state other than "speaking": the words came first. */
  openedAfterSpeaking = false
  states: VoiceState[] = []
  savedCount = 0

  open(target: VoiceTarget) {
    this.opened.push(target)
    this.openedAfterSpeaking = this.states.at(-1) === 'speaking'
  }
  saved() {
    this.savedCount++
  }
  show(state: VoiceState) {
    this.states.push(state)
  }
}
export class FakeObservationRepository implements ObservationRepository {
  items = new Map<string, Observation>()
  failPut = false

  async list() {
    return [...this.items.values()]
  }
  async put(observation: Observation) {
    if (this.failPut) throw new Error('storage failed')
    this.items.set(observation.id, observation)
  }
}

export class FakeReadingSource implements ReadingSource {
  private listeners = new Set<(message: unknown) => void>()

  subscribe(listener: (message: unknown) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  emit(message: unknown) {
    this.listeners.forEach((l) => l(message))
  }
}

/** The history the rules read: the check-in store plus a device Observation store. */
export const combinedHistory = (checkIns: CheckInHistory, observations = new FakeObservationRepository()) =>
  new CombinedObservationHistory(checkIns, observations)

/** Stands in for the browser `WebSocket`: records every socket and `send`, and lets a test fire its events. */
export class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static throwOnCreate = false

  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  readonly sent: string[] = []

  constructor(readonly url: string) {
    if (FakeWebSocket.throwOnCreate) throw new SyntaxError('bad url')
    FakeWebSocket.instances.push(this)
  }

  static reset() {
    FakeWebSocket.instances = []
    FakeWebSocket.throwOnCreate = false
  }
  static get last(): FakeWebSocket {
    return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
  }

  send(data: string) {
    this.sent.push(data)
  }
  open() {
    this.onopen?.()
  }
  close() {
    this.onclose?.()
  }
  error() {
    this.onerror?.()
  }
  message(data: unknown) {
    this.onmessage?.({ data })
  }
}

export const fakeWebSocketCtor = FakeWebSocket as unknown as typeof WebSocket
