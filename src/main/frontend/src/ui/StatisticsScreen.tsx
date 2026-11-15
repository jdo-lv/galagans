import { useEffect, useId, useRef } from 'react'

/** Placeholder until statistics are designed: it says so, so the demo doesn't look broken. */
export function StatisticsScreen() {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="stack" aria-labelledby={headingId}>
      <h2 id={headingId} ref={heading} tabIndex={-1} className="section-heading">
        Statistics
      </h2>
      <p className="muted">Not built yet.</p>
    </section>
  )
}
