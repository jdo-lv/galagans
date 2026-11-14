import { formatDelay } from '../application/formatAge'
import { ONE_WAY_DELAY_MS } from '../domain/packet'
import { GroundLinkIcon } from './icons'
import { PACKET_HREF } from './useHashRoute'

/** Context pill on every screen: the one-way delay, and the way to the surgeon packet. */
export function GroundLinkPill({ current }: { current: boolean }) {
  const delay = formatDelay(ONE_WAY_DELAY_MS)
  return (
    <a
      className="pill pill--link"
      href={PACKET_HREF}
      aria-current={current ? 'page' : undefined}
      aria-label={`Surgeon packet. Ground link: one-way delay ${delay} (demo)`}
    >
      <GroundLinkIcon size={18} />
      <span>
        Ground link: one-way delay <b>{delay}</b> (demo)
      </span>
    </a>
  )
}
