import { describe, expect, it } from 'vitest'
import { ONE_WAY_DELAY_MS, type StoredPacket } from '../domain/packet'
import { packetDelivery } from './packetDelivery'

// Local times, so the tests pass in any TZ.
const at = (h: number, m: number, s = 0, day = 14) => new Date(2026, 10, day, h, m, s)
const packet = (fields: Partial<StoredPacket> = {}): StoredPacket => ({
  id: 'p1',
  builtAt: at(7, 0).toISOString(),
  oneWayDelayMs: ONE_WAY_DELAY_MS,
  note: '',
  items: [],
  state: 'queued',
  ...fields,
})

describe('packetDelivery', () => {
  it('AC21: a queued packet is queued', () => {
    expect(packetDelivery(packet(), at(7, 10))).toEqual({ kind: 'queued' })
  })

  it('AC21: a sent packet is in transit until sentAt + its one-way delay, then arrived', () => {
    const sent = packet({ state: 'sent', sentAt: at(7, 1).toISOString(), oneWayDelayMs: 845_000 })
    const times = { sentAt: at(7, 1).toISOString(), arrivesAt: at(7, 15, 5).toISOString() }

    expect(packetDelivery(sent, at(7, 10))).toEqual({ kind: 'in-transit', ...times })
    expect(packetDelivery(sent, at(7, 15, 5))).toEqual({ kind: 'arrived', ...times })
    expect(packetDelivery(sent, at(7, 20))).toEqual({ kind: 'arrived', ...times })
  })
})
