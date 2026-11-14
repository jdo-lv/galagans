import type { CheckIn } from './checkIn'

export interface CheckInRepository {
  add(checkIn: CheckIn): Promise<void>
  listPending(): Promise<CheckIn[]>
  countPending(): Promise<number>
  markSynced(ids: string[]): Promise<void>
}

export interface CheckInGateway {
  /** Sends check-ins to the server. Resolves with the ids the server accepted. */
  send(checkIns: CheckIn[]): Promise<string[]>
}

export interface ConnectivityMonitor {
  isOnline(): boolean
  subscribe(listener: (online: boolean) => void): () => void
}
