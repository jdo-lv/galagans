import { describe, expect, it } from 'vitest'
import { ONE_WAY_DELAY_MS, type StoredPacket } from '../domain/packet'
import { packetTimeline } from './packetTimeline'

// Local times, so the tests pass in any TZ.
const at = (h: number, m: number, s = 0) => new Date(2026, 10, 14, h, m, s)
const packet = (fields: Partial<StoredPacket> = {}): StoredPacket => ({
  id: 'p1',
  builtAt: at(7, 31).toISOString(),
  oneWayDelayMs: ONE_WAY_DELAY_MS,
  note: '',
  items: [],
  state: 'queued',
  ...fields,
})

describe('packetTimeline', () => {
  it('AC25: no packet → no steps and no round trip', () => {
    expect(packetTimeline(undefined, at(7, 31))).toEqual({ steps: [] })
  })

  it('AC26: a queued packet is current at "Queued for uplink"', () => {
    expect(packetTimeline(packet(), at(7, 35)).steps).toEqual([
      { name: 'Packet built', detail: '07:31', state: 'done' },
      { name: 'Queued for uplink', detail: '07:31', state: 'current' },
      { name: 'In transit', detail: 'waits for ground link', state: 'pending' },
      { name: 'Earliest reply', detail: '—', state: 'pending' },
    ])
  })

  it('AC27: a sent packet is in transit until it arrives', () => {
    const sent = packet({ state: 'sent', sentAt: at(7, 40).toISOString() })

    expect(packetTimeline(sent, at(7, 40)).steps).toEqual([
      { name: 'Packet built', detail: '07:31', state: 'done' },
      { name: 'Queued for uplink', detail: '07:31', state: 'done' },
      { name: 'In transit', detail: 'arrives ~07:54', state: 'current' },
      { name: 'Earliest reply', detail: '~08:08 + surgeon time', state: 'pending' },
    ])
  })

  it('AC28: the stored delay sets the times and the round trip, not the constant', () => {
    const sent = packet({ state: 'sent', sentAt: at(7, 40).toISOString(), oneWayDelayMs: 60_000 })

    const timeline = packetTimeline(sent, at(7, 40, 30))

    expect(timeline.steps).toContainEqual({ name: 'In transit', detail: 'arrives ~07:41', state: 'current' })
    expect(timeline.steps).toContainEqual({ name: 'Earliest reply', detail: '~07:42 + surgeon time', state: 'pending' })
    expect(timeline.roundTripMs).toBe(120_000)
  })

  it('AC29: from the arrival time on, the packet has arrived and the reply is current', () => {
    const sent = packet({ state: 'sent', sentAt: at(7, 31).toISOString() })
    const arrived = [
      { name: 'Packet built', detail: '07:31', state: 'done' },
      { name: 'Queued for uplink', detail: '07:31', state: 'done' },
      { name: 'Arrived', detail: '~07:45', state: 'done' },
      { name: 'Earliest reply', detail: '~07:59 + surgeon time', state: 'current' },
    ]

    expect(packetTimeline(sent, at(7, 45, 4)).steps[2]).toEqual({ name: 'In transit', detail: 'arrives ~07:45', state: 'current' })
    expect(packetTimeline(sent, at(7, 45, 5)).steps).toEqual(arrived)
    expect(packetTimeline(sent, at(7, 46)).steps).toEqual(arrived)
    expect(packetTimeline(sent, at(8, 30)).steps).toEqual(arrived)
  })

  it('AC31: the round trip is twice the stored one-way delay, queued or sent', () => {
    expect(packetTimeline(packet(), at(7, 31)).roundTripMs).toBe(1_690_000)
    expect(packetTimeline(packet({ state: 'sent', sentAt: at(7, 31).toISOString() }), at(7, 31)).roundTripMs).toBe(1_690_000)
  })
})
