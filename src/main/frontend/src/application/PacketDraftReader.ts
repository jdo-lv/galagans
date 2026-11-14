import type { PacketItem } from '../domain/packet'
import type { LatestReadingsReader } from './LatestReadingsReader'
import { toPacketItem } from './packetItems'

/** The items the next packet would hold if it were built now. */
export class PacketDraftReader {
  /** Public so the UI prints ages against the same clock the rules used. */
  readonly now: () => Date

  constructor(private readonly readings: LatestReadingsReader) {
    this.now = readings.now
  }

  async read(): Promise<PacketItem[]> {
    return (await this.readings.read()).map(toPacketItem)
  }
}
