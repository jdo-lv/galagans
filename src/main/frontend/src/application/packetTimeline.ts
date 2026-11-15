import type { StoredPacket } from '../domain/packet'
import { formatTime } from './formatAge'
import { packetDelivery } from './packetDelivery'

export type TimelineStep = { name: string; detail: string; state: 'done' | 'current' | 'pending' }

const shift = (iso: string, ms: number) => new Date(Date.parse(iso) + ms).toISOString()

/** Store-and-forward steps of the newest packet. Replies are out of scope, so "Earliest reply" never completes. */
export function packetTimeline(last: StoredPacket | undefined, now: Date): { steps: TimelineStep[]; roundTripMs?: number } {
  if (!last) return { steps: [] }

  const built = formatTime(last.builtAt)
  const roundTripMs = 2 * last.oneWayDelayMs
  const delivery = packetDelivery(last, now)
  if (delivery.kind === 'queued') {
    return {
      steps: [
        { name: 'Packet built', detail: built, state: 'done' },
        { name: 'Queued for uplink', detail: built, state: 'current' },
        { name: 'In transit', detail: 'waits for ground link', state: 'pending' },
        { name: 'Earliest reply', detail: '—', state: 'pending' },
      ],
      roundTripMs,
    }
  }

  const arrival = delivery.arrivesAt
  const reply = `~${formatTime(shift(delivery.sentAt, roundTripMs))} + surgeon time`
  const arrived = delivery.kind === 'arrived'
  return {
    steps: [
      { name: 'Packet built', detail: built, state: 'done' },
      { name: 'Queued for uplink', detail: built, state: 'done' },
      arrived
        ? { name: 'Arrived', detail: `~${formatTime(arrival)}`, state: 'done' }
        : { name: 'In transit', detail: `arrives ~${formatTime(arrival)}`, state: 'current' },
      { name: 'Earliest reply', detail: reply, state: arrived ? 'current' : 'pending' },
    ],
    roundTripMs,
  }
}
