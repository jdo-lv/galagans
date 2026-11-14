import { useEffect, useId, useRef } from 'react'
import { formatDelay } from '../application/formatAge'
import { ONE_WAY_DELAY_MS } from '../domain/packet'
import { PrivateIcon } from './icons'
import './packet.css'

/** The surgeon packet screen (F14, issue #19). */
export function SurgeonPacket() {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  // Once per opening, so a re-read never steals focus.
  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="packet stack" aria-labelledby={headingId}>
      <a href="#/" className="packet-home">
        ← Home
      </a>
      <div className="packet-head">
        <h2 id={headingId} ref={heading} tabIndex={-1} className="section-heading">
          Surgeon packet
        </h2>
        <p className="muted packet-privacy">
          <PrivateIcon size={18} />
          <span>{`Shared with flight medicine only · Mars transit, one-way delay ${formatDelay(ONE_WAY_DELAY_MS)} (demo value)`}</span>
        </p>
      </div>
    </section>
  )
}
