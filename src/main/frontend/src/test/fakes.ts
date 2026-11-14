import type { CheckIn } from '../domain/checkIn'
import type { CheckInGateway, CheckInHistory, CheckInRepository, ConnectivityMonitor, RuleSource } from '../domain/ports'
import type { Rule } from '../domain/rules'

export class FakeRepository implements CheckInRepository, CheckInHistory {
  items = new Map<string, { checkIn: CheckIn; pending: boolean }>()
  failList = false

  async list() {
    if (this.failList) throw new Error('storage failed')
    return [...this.items.values()].map((i) => i.checkIn)
  }

  async add(checkIn: CheckIn) {
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
