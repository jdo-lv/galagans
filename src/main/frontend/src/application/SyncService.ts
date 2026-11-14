import type { CheckInGateway, CheckInRepository, ConnectivityMonitor } from '../domain/ports'
import type { Synchronizer } from './Synchronizer'

export class SyncService implements Synchronizer {
  private inFlight: Promise<void> | null = null
  private listeners = new Set<() => void>()

  constructor(
    private readonly repository: CheckInRepository,
    private readonly gateway: CheckInGateway,
    private readonly connectivity: ConnectivityMonitor,
  ) {}

  /** Syncs now, then again whenever the connection comes back. Returns a stop function. */
  start(): () => void {
    void this.sync()
    return this.connectivity.subscribe((online) => {
      if (online) void this.sync()
    })
  }

  sync(): Promise<void> {
    if (this.inFlight) return this.inFlight
    this.inFlight = this.flush().finally(() => {
      this.inFlight = null
      this.listeners.forEach((listener) => listener())
    })
    return this.inFlight
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private async flush(): Promise<void> {
    if (!this.connectivity.isOnline()) return
    const pending = await this.repository.listPending()
    if (pending.length === 0) return
    try {
      const acceptedIds = await this.gateway.send(pending)
      await this.repository.markSynced(acceptedIds)
    } catch {
      // stays pending, retried on the next sync
    }
  }
}
