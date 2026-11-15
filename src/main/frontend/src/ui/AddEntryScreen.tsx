import { useEffect, useId, useRef } from 'react'
import { QuestionnaireIcon, SymptomIcon } from './icons'
import './packet.css'
import { CHECK_IN_HASH, SYMPTOMS_HASH } from './useHashRoute'

/** The bar's centre + (#57): its own screen, so it works with back and needs no focus trap. */
export function AddEntryScreen() {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="stack" aria-labelledby={headingId}>
      <h2 id={headingId} ref={heading} tabIndex={-1} className="section-heading">
        Add entry
      </h2>
      <div className="add-choices">
        <a href={CHECK_IN_HASH} className="button-primary">
          <QuestionnaireIcon />
          Morning check-in
        </a>
        <a href={SYMPTOMS_HASH} className="button-secondary">
          <SymptomIcon />
          Log symptoms
        </a>
      </div>
    </section>
  )
}
