import { useEffect, useId, useRef } from 'react'

/** The symptom form the bar's + offers (#57). Blank until its fields are specified; it says so, so the demo doesn't look broken. */
export function SymptomLogScreen() {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="stack" aria-labelledby={headingId}>
      <h2 id={headingId} ref={heading} tabIndex={-1} className="section-heading">
        Log symptoms
      </h2>
      <form aria-labelledby={headingId}>
        <p className="muted">Symptom fields come next.</p>
      </form>
    </section>
  )
}
