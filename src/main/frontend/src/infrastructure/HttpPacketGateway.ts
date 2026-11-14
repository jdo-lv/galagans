import type { Packet } from '../domain/packet'
import type { PacketGateway } from '../domain/ports'

export class HttpPacketGateway implements PacketGateway {
  constructor(
    private readonly baseUrl = '',
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  /** Sends only the packet fields; the device's queue state stays on the device. */
  async send({ id, builtAt, oneWayDelayMs, note, items }: Packet): Promise<void> {
    const response = await this.fetchFn(`${this.baseUrl}/api/packets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, builtAt, oneWayDelayMs, note, items }),
    })
    if (!response.ok) throw new Error(`Packet upload failed with status ${response.status}`)
  }
}
