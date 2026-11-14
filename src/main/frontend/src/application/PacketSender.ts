import { ONE_WAY_DELAY_MS, type Packet } from '../domain/packet'
import type { PacketRepository } from '../domain/ports'
import type { LatestReadingsReader } from './LatestReadingsReader'
import { toPacketItem } from './packetItems'
import type { Synchronizer } from './Synchronizer'

/** Builds a packet from the readings at this moment, queues it on the device and nudges the uplink. */
export class PacketSender {
  constructor(
    private readonly readings: LatestReadingsReader,
    private readonly repository: PacketRepository,
    private readonly uplink: Synchronizer,
    private readonly newId: () => string = () => crypto.randomUUID(),
    /** Public so the confirm step estimates the arrival on the clock that stamps `builtAt`. */
    readonly now: () => Date = () => new Date(),
  ) {}

  async send(note: string): Promise<Packet> {
    const builtAt = this.now().toISOString()
    const items = (await this.readings.read()).map(toPacketItem)
    const packet: Packet = { id: this.newId(), builtAt, oneWayDelayMs: ONE_WAY_DELAY_MS, note: note.trim(), items }
    await this.repository.add(packet)
    void this.uplink.sync()
    return packet
  }
}
