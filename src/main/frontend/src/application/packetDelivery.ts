import type { StoredPacket } from '../domain/packet'

export type PacketDelivery = { kind: 'queued' } | { kind: 'in-transit' | 'arrived'; sentAt: string; arrivesAt: string }

/** Where a packet is on its way to the ground: arrived from `sentAt` plus its own stored one-way delay on. */
export function packetDelivery(packet: StoredPacket, now: Date): PacketDelivery {
  if (packet.state === 'queued' || !packet.sentAt) return { kind: 'queued' }
  const arrivesAt = new Date(Date.parse(packet.sentAt) + packet.oneWayDelayMs).toISOString()
  const kind = now.getTime() >= Date.parse(arrivesAt) ? 'arrived' : 'in-transit'
  return { kind, sentAt: packet.sentAt, arrivesAt }
}
