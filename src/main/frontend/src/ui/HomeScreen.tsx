import { useId } from 'react'
import type { RoutineItem } from '../domain/routine'
import { BodyFigure } from './BodyFigure'
import { LatestReadings } from './LatestReadings'
import { PvtCard } from './PvtCard'
import { ScreenLayout } from './ScreenLayout'
import { SystemStatusList } from './SystemStatusList'
import { TodaysRoutine } from './TodaysRoutine'
import { CHECK_IN_HASH } from './useHashRoute'
import type { LatestReadingsState } from './useLatestReadings'
import type { PeriodicState } from './usePeriodicRead'
import type { StatusListState } from './useSystemStatuses'
import './home.css'

function BodyCard({ statuses }: { statuses: StatusListState }) {
  const headingId = useId()
  return (
    <section className="card body-card" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Body
      </h2>
      <BodyFigure statuses={statuses} />
    </section>
  )
}

/** Home (F6, #52): readings in the side panel, the Body card, then the routine and Body systems. */
export function HomeScreen({
  statuses,
  readings,
  routine,
  returnedHome,
}: {
  statuses: StatusListState
  readings: LatestReadingsState
  routine: PeriodicState<RoutineItem[]>
  returnedHome: boolean
}) {
  return (
    <ScreenLayout
      side={<LatestReadings state={readings} />}
      primary={<BodyCard statuses={statuses} />}
      secondary={
        <>
          <TodaysRoutine
            state={routine}
            onStart={() => {
              window.location.hash = CHECK_IN_HASH
            }}
          />
          <PvtCard />
          <SystemStatusList state={statuses} focusHeading={returnedHome} />
        </>
      }
    />
  )
}
