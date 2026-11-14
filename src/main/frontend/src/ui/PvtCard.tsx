import { useId } from 'react'
import { PVT_HASH } from './useHashRoute'

/** Home entry to the PVT; secondary, like the routine's Start, so nothing on Home outranks the other. */
export function PvtCard() {
  const headingId = useId()
  return (
    <section className="card stack" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Reaction test
      </h2>
      <p>3 minutes. Every 4th day.</p>
      <button type="button" className="button-secondary" onClick={() => (window.location.hash = PVT_HASH)}>
        Start reaction test
      </button>
    </section>
  )
}
