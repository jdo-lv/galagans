import { useId } from 'react'
import type { LatestReading } from '../domain/readings'
import type { LatestReadingsState } from './useLatestReadings'

function ReadingTile({ reading }: { reading: LatestReading }) {
  const { spec } = reading
  return (
    <li className="metric-tile">
      <div className="tile-label">
        {spec.label}
        {spec.labelSuffix && (
          <>
            {' '}
            <span className="tile-label__suffix">{spec.labelSuffix}</span>
          </>
        )}
      </div>
    </li>
  )
}

export function LatestReadings({ state }: { state: LatestReadingsState }) {
  const headingId = useId()
  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Latest readings
      </h2>
      {state.kind === 'ready' && (
        <ul className="tile-grid">
          {state.data.map((reading) => (
            <ReadingTile key={reading.spec.key} reading={reading} />
          ))}
        </ul>
      )}
    </section>
  )
}
