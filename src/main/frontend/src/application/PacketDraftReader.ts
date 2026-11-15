import type { PacketItem } from '../domain/packet'
import type { Rule } from '../domain/rules'
import type { LatestReadingsReader } from './LatestReadingsReader'
import { toPacketItem } from './packetItems'

/** The items the next packet would hold if it were built now, and the rules that flagged them (for their badges). */
export class PacketDraftReader {
  /** Public so the UI prints ages against the same clock the rules used. */
  readonly now: () => Date

  constructor(private readonly readings: LatestReadingsReader) {
    this.now = readings.now
  }

  async read(): Promise<{ items: PacketItem[]; rules: Rule[] }> {
    const readings = await this.readings.read()
    const rules = [...new Set(readings.flatMap((r) => (r.rule ? [r.rule] : [])))]
    return { items: readings.map(toPacketItem), rules }
  }
}
