import type { CheckIn } from '../domain/checkIn'
import type { Packet, StoredPacket } from '../domain/packet'
import type {
  CheckInGateway,
  CheckInHistory,
  CheckInRepository,
  ConnectivityMonitor,
  PacketGateway,
  PacketRepository,
  RuleSource,
} from '../domain/ports'
import type { Rule } from '../domain/rules'

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
