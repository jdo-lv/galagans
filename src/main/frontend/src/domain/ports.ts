import type { CheckIn } from './checkIn'
import type { Packet, StoredPacket } from './packet'
import type { Rule } from './rules'

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
}

export interface PacketGateway {
  /** Sends one packet to the ground station; rejects unless it was accepted. */
  send(packet: Packet): Promise<void>
}
