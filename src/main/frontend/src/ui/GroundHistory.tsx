import { useEffect, useId, useRef } from 'react'
import { formatDayTime, formatTime } from '../application/formatAge'
import { packetDelivery } from '../application/packetDelivery'
import type { PacketItem, StoredPacket } from '../domain/packet'
import { isFlagged } from '../domain/rules'
import { PrivateIcon } from './icons'
import './packet.css'
import { useServices } from './ServicesContext'
import { PACKET_HREF } from './useHashRoute'
import { usePeriodicRead, type PeriodicState } from './usePeriodicRead'

/** In words only, never a colour: the delivery is not a health status. */
function deliveryText(packet: StoredPacket, now: Date): string {
  const delivery = packetDelivery(packet, now)
  if (delivery.kind === 'queued') return 'Queued, waits for ground link'
  const arrival = `${delivery.kind === 'arrived' ? 'arrived' : 'arrives'} ~${formatTime(delivery.arrivesAt)}`
  return `Sent ${formatDayTime(delivery.sentAt)} · ${arrival}`
}

function contentsText(items: PacketItem[]): string {
  const count = `${items.length} ${items.length === 1 ? 'item' : 'items'}`
  const flagged = items.filter((item) => isFlagged(item.state)).length
  return flagged > 0 ? `${count} · ${flagged} flagged` : count
}

function PacketTable({ packets, now }: { packets: StoredPacket[]; now: Date }) {
  return (
    <table className="packet-table">
      <thead>
        <tr>
          <th scope="col">Built</th>
          <th scope="col">Delivery</th>
          <th scope="col">Contents</th>
          <th scope="col">Crew note</th>
        </tr>
      </thead>
      <tbody>
        {packets.map((packet) => (
          <tr key={packet.id}>
            <th scope="row" className="num">
              {formatDayTime(packet.builtAt)}
            </th>
            <td>{deliveryText(packet, now)}</td>
            <td>{contentsText(packet.items)}</td>
            <td>{packet.note === '' ? <span className="muted">No note</span> : packet.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PacketHistory({ state }: { state: PeriodicState<StoredPacket[]> }) {
  const headingId = useId()
  return (
    <section className="card" aria-labelledby={headingId}>
      <h3 id={headingId} className="card-heading">
        Packet history
      </h3>
      {state.kind === 'ready' &&
        (state.data.length === 0 ? <p className="muted">No packets sent yet.</p> : <PacketTable packets={state.data} now={state.now} />)}
    </section>
  )
}

/** The crew's side of the ground link (#57): what was sent to flight medicine, and the way to a new packet. */
export function GroundHistory() {
  const { packetHistoryReader, packetUplink } = useServices()
  const history = usePeriodicRead(packetHistoryReader)
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  // Once per opening, so a re-read never steals focus.
  useEffect(() => heading.current?.focus(), [])

  useEffect(() => packetUplink.subscribe(history.refresh), [packetUplink, history.refresh])

  return (
    <section className="stack" aria-labelledby={headingId}>
      <div className="packet-head">
        <h2 id={headingId} ref={heading} tabIndex={-1} className="section-heading">
          Ground
        </h2>
        <p className="muted packet-privacy">
          <PrivateIcon size={18} />
          <span>Shared with flight medicine only</span>
        </p>
      </div>
      <a href={PACKET_HREF} className="button-primary">
        New surgeon packet
      </a>
      <PacketHistory state={history.state} />
    </section>
  )
}
