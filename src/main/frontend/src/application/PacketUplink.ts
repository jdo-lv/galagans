import type { ConnectivityMonitor, PacketGateway, PacketRepository } from '../domain/ports'
import type { Synchronizer } from './Synchronizer'

/** Sends queued surgeon packets to the ground station, one request each, so a rejected packet never blocks the rest. */
export class PacketUplink implements Synchronizer {
  private inFlight: Promise<void> | null = null
  private queued: Promise<void> | null = null
  private listeners = new Set<() => void>()

  constructor(
    private readonly repository: PacketRepository,
    private readonly gateway: PacketGateway,
    private readonly connectivity: ConnectivityMonitor,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Sends now, then again whenever the connection comes back. Returns a stop function. */
  start(): () => void {
    void this.sync()
    return this.connectivity.subscribe((online) => {
      if (online) void this.sync()
    })
  }

  /** A call during a pass gets one more pass after it, so a packet queued meanwhile doesn't wait for the next trigger. */
  sync(): Promise<void> {
    if (this.queued) return this.queued
    if (!this.inFlight) return this.runPass()
    const next = () => {
      this.queued = null
      return this.runPass()
    }
    this.queued = this.inFlight.then(next, next)
    return this.queued
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private runPass(): Promise<void> {
    this.inFlight = this.pass().finally(() => {
      this.inFlight = null
      this.listeners.forEach((listener) => listener())
    })
    return this.inFlight
  }

  private async pass(): Promise<void> {
    if (!this.connectivity.isOnline()) return
    for (const packet of await this.repository.listQueued()) {
      try {
        await this.gateway.send(packet)
        await this.repository.markSent(packet.id, this.now().toISOString())
      } catch {
        // stays queued, retried on the next pass
      }
    }
  }
}
