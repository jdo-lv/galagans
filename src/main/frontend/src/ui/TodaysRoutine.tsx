import { useId } from 'react'
import { formatTime } from '../application/formatAge'
import type { CheckInRoutineItem, RoutineItem, RoutinePlaceholder } from '../domain/routine'
import type { PeriodicState } from './usePeriodicRead'

function rightText(item: CheckInRoutineItem): string | undefined {
  if (item.state === 'upcoming') return `${item.window.start}–${item.window.end}`
  if (item.state === 'done' && item.doneAt) return `done ${formatTime(item.doneAt)}`
  if (item.state === 'missed') return 'not answered'
}

function CheckInRow({ item, onStart }: { item: CheckInRoutineItem; onStart: () => void }) {
  const text = rightText(item)
  return (
    <li className={`routine-item routine-item--${item.state}`}>
      <span>{item.label}</span>
      {item.state === 'due' && (
        <button type="button" className="button-secondary" onClick={onStart}>
          Start · {item.estimate}
        </button>
      )}
      {text && <span className="num">{text}</span>}
    </li>
  )
}

function PlaceholderRow({ item }: { item: RoutinePlaceholder }) {
  return (
    <li className="routine-item">
      <span>
        {item.label}
        <br />
        <span className="tag">{item.source}</span>
      </span>
      <span className="num muted">{item.detail}</span>
    </li>
  )
}

export function TodaysRoutine({ state, onStart }: { state: PeriodicState<RoutineItem[]>; onStart: () => void }) {
  const headingId = useId()
  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Today's routine
      </h2>
      {state.kind === 'unavailable' && <p className="muted">Routine unavailable</p>}
      {state.kind === 'ready' && (
        <ul className="routine-list">
          {state.data.map((item) =>
            item.kind === 'check-in' ? <CheckInRow key={item.label} item={item} onStart={onStart} /> : <PlaceholderRow key={item.label} item={item} />,
          )}
        </ul>
      )}
    </section>
  )
}
