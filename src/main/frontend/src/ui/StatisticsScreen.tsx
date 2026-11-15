import { useId } from 'react'

/** Placeholder until statistics are designed: it says so, so the demo doesn't look broken. */
export function StatisticsScreen() {
  const headingId = useId()

  return (
    <section className="stack" aria-labelledby={headingId}>
      <h2 id={headingId} className="section-heading">
        Statistics
      </h2>
      <p className="muted">Not built yet.</p>
    </section>
  )
}
