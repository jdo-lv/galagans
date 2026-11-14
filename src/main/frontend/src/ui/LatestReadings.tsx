import { useId, type ComponentType } from 'react'
import type { LatestReading } from '../domain/readings'
import { BloodPressureIcon, CabinAirIcon, HeartRateIcon, MoodIcon, SleepIcon, Spo2Icon } from './icons'
import type { LatestReadingsState } from './useLatestReadings'

// The first four are the icons of the same fields in CheckInForm.tsx.
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  spo2: Spo2Icon,
  heartRate: HeartRateIcon,
  sleep: SleepIcon,
  mood: MoodIcon,
  bloodPressure: BloodPressureIcon,
  cabinCo2: CabinAirIcon,
}

function Reading({ reading }: { reading: LatestReading }) {
  const shown = reading.value !== undefined ? String(reading.value) : reading.text
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

function ReadingTile({ reading }: { reading: LatestReading }) {
  const { spec, source } = reading
  const Icon = ICONS[spec.key]
  return (
    <li className="metric-tile">
      <div className="metric-tile__top">
        <Reading reading={reading} />
        {Icon && <Icon className="metric-tile__icon" />}
      </div>
      <div className="tile-label">
        {spec.label}
        {spec.labelSuffix && (
          <>
            {' '}
            <span className="tile-label__suffix">{spec.labelSuffix}</span>
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
