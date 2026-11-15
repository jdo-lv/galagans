import { useId } from 'react'
import { formatAge, formatOldAge } from '../application/formatAge'
import type { LatestReading } from '../domain/readings'
import { isFlagged } from '../domain/rules'
import { READING_ICONS } from './readingIcons'
import { Badge, TodoBadge } from './SystemStatusList'
import type { LatestReadingsState } from './useLatestReadings'

function Reading({ reading }: { reading: LatestReading }) {
  const shown = reading.text ?? (reading.value !== undefined ? String(reading.value) : undefined)
  if (shown === undefined) {
    return (
      <span className="metric-tile__reading">
        <span className="value" aria-hidden="true">
          —
        </span>
        <span className="visually-hidden">No reading</span>
      </span>
    )
  }
  return (
    <span className="metric-tile__reading">
      <span className="value">{shown}</span> <span className="metric-tile__unit">{reading.spec.unit}</span>
    </span>
  )
}

/** The badge or icon on a tile's right: a level 2–5 flag outranks To do (level 1). */
function TileMark({ reading, todo }: { reading: LatestReading; todo: boolean }) {
  if (isFlagged(reading.state)) return <Badge state={reading.state} rule={reading.rule} />
  if (todo) return <TodoBadge />
  const Icon = READING_ICONS[reading.spec.key]
  return Icon ? <Icon className="metric-tile__icon" /> : null
}

function ReadingTile({ reading, now, todo }: { reading: LatestReading; now: Date; todo: boolean }) {
  const { spec, state, recordedAt, source } = reading
  const age = recordedAt && (state === 'stale' ? formatOldAge(recordedAt, now) : formatAge(recordedAt, now))
  const suffix = [spec.labelSuffix, age && `/ ${age}`].filter(Boolean).join(' ')
  const className = ['metric-tile', state === 'stale' && 'metric-tile--stale', todo && 'metric-tile--todo'].filter(Boolean).join(' ')
  return (
    <li className={className}>
      <div className="metric-tile__top">
        <Reading reading={reading} />
        <TileMark reading={reading} todo={todo} />
      </div>
      <div className="tile-label">
        {spec.label}
        {suffix && (
          <>
            {' '}
            <span className="tile-label__suffix">{suffix}</span>
          </>
        )}
      </div>
      {source && (
        <div>
          <span className="tag">{source}</span>
        </div>
      )}
    </li>
  )
}

/** `first`: READINGS keys shown first, in that order; the rest follow in READINGS order. `todo`: keys an owed input asks for. */
export function LatestReadings({
  state,
  heading = 'Latest readings',
  first = [],
  todo = [],
}: {
  state: LatestReadingsState
  heading?: string
  first?: string[]
  todo?: string[]
}) {
  const headingId = useId()
  const ordered =
    state.kind === 'ready'
      ? [
          ...first.flatMap((key) => state.data.filter((r) => r.spec.key === key)),
          ...state.data.filter((r) => !first.includes(r.spec.key)),
        ]
      : []
  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        {heading}
      </h2>
      {state.kind === 'unavailable' && <p className="muted">Readings unavailable</p>}
      {state.kind === 'ready' && (
        <ul className="tile-grid">
          {ordered.map((reading) => (
            <ReadingTile key={reading.spec.key} reading={reading} now={state.now} todo={todo.includes(reading.spec.key)} />
          ))}
        </ul>
      )}
    </section>
  )
}
