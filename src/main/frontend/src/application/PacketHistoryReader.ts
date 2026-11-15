import type { StoredPacket } from '../domain/packet'
import type { PacketRepository } from '../domain/ports'

/** Every stored packet, newest first, for the crew's Ground history. */
export class PacketHistoryReader {
  constructor(
    private readonly repository: PacketRepository,
    /** Public so the history compares arrival times with the same clock. */
    readonly now: () => Date = () => new Date(),
  ) {}

  read(): Promise<StoredPacket[]> {
    return this.repository.listAll()
  }
}
