import type { StoredPacket } from '../domain/packet'
import type { PacketRepository } from '../domain/ports'

/** The newest stored packet, for the store-and-forward timeline. */
export class LastPacketReader {
  constructor(
    private readonly repository: PacketRepository,
    /** Public so the timeline compares arrival times with the same clock. */
    readonly now: () => Date = () => new Date(),
  ) {}

  read(): Promise<StoredPacket | undefined> {
    return this.repository.latest()
  }
}
