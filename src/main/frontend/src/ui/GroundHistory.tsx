import { useEffect, useId, useRef } from 'react'
import type { StoredPacket } from '../domain/packet'
import { PrivateIcon } from './icons'
import './packet.css'
import { useServices } from './ServicesContext'
import { PACKET_HREF } from './useHashRoute'
import { usePeriodicRead, type PeriodicState } from './usePeriodicRead'

function PacketHistory({ state }: { state: PeriodicState<StoredPacket[]> }) {
  const headingId = useId()
  return (
    <section className="card" aria-labelledby={headingId}>
      <h3 id={headingId} className="card-heading">
        Packet history
      </h3>
      {state.kind === 'ready' && state.data.length === 0 && <p className="muted">No packets sent yet.</p>}
    </section>
  )
}

/** The crew's side of the ground link (#57): what was sent to flight medicine, and the way to a new packet. */
export function GroundHistory() {
  const { packetHistoryReader } = useServices()
  const history = usePeriodicRead(packetHistoryReader)
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  // Once per opening, so a re-read never steals focus.
  useEffect(() => heading.current?.focus(), [])

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
