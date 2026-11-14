import { useEffect, useId, useRef } from 'react'
import { acknowledge } from '../application/acknowledgement'
import { formatDuration, formatTime } from '../application/formatAge'
import type { CheckIn } from '../domain/checkIn'
import { answeredCount, CHECK_IN_STEPS } from '../domain/checkInSteps'
import { RoutineStreakCard } from './RoutineStreakCard'
import { useServices } from './ServicesContext'
import { usePeriodicRead } from './usePeriodicRead'

/** The end of the morning check-in (F13, mockup 09): what was logged, what happens next, and the routine streak. */
export function CheckInComplete({ checkIn, openedAt, onDone }: { checkIn: CheckIn; openedAt: Date; onDone: () => void }) {
  const { streakReader } = useServices()
  const { state } = usePeriodicRead(streakReader)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const headingId = useId()
  const nextId = useId()

  useEffect(() => headingRef.current?.focus(), [])

  const { headline, reported, nextSteps } = acknowledge(checkIn, state.kind === 'ready' ? state.data.symptomDays : undefined)
  const duration = formatDuration(Date.parse(checkIn.recordedAt) - openedAt.getTime())

  return (
    <div className="check-in-complete">
      <section className="card complete" aria-labelledby={headingId}>
        <div className="complete__top">
          {/* A completed task, not the level-0 Nominal icon: no status shows here. */}
          <span className="done-mark" aria-hidden="true">
            ✓
          </span>
          <div>
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className="complete__title">
              Check-in complete · {formatTime(checkIn.recordedAt)}
            </h2>
            <p className="complete__summary muted">
              <span>{CHECK_IN_STEPS.length} steps</span> · <span>{answeredCount(checkIn)} answered</span> · <span>{duration}</span>
            </p>
          </div>
        </div>
        <p className="complete__ack">
          <strong>{headline}</strong>
        </p>
        {reported && (
          <>
            <p>Reporting a symptom counts as a completed check-in and never breaks your streak.</p>
            <div className="complete__next">
              <h3 id={nextId}>What happens next</h3>
              <ul aria-labelledby={nextId}>
                {nextSteps.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
      <RoutineStreakCard state={state} />
      <div className="complete__actions">
        <button type="button" className="button-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
