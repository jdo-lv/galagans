import { useId, useState, type ReactNode } from 'react'
import { homeVariant, type TodoItem } from '../application/homeVariant'
import type { RoutineItem } from '../domain/routine'
import { BodyFigure } from './BodyFigure'
import { LatestReadings } from './LatestReadings'
import { LevelLegend } from './LevelLegend'
import { PvtCard } from './PvtCard'
import { ScreenLayout } from './ScreenLayout'
import { SystemStatusList } from './SystemStatusList'
import { TodaysRoutine } from './TodaysRoutine'
import { TodoPanel } from './TodoPanel'
import { CHECK_IN_HASH } from './useHashRoute'
import type { LatestReadingsState } from './useLatestReadings'
import type { PeriodicState } from './usePeriodicRead'
import type { StatusListState } from './useSystemStatuses'
import './home.css'

function BodyCard({ statuses, todo }: { statuses: StatusListState; todo?: string[] }) {
  const headingId = useId()
  return (
    <section className="card body-card" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Body
      </h2>
      <BodyFigure statuses={statuses} todo={todo} />
      <LevelLegend />
    </section>
  )
}

/**
 * Home (F6, #52, ideas/home-variants.md): To do while an input is owed, otherwise Nominal. Neither shows until the
 * routine and readings have been read once, so Home never flashes the wrong variant.
 */
export function HomeScreen({
  statuses,
  readings,
  routine,
  returnedHome,
  onCheckInSaved,
}: {
  statuses: StatusListState
  readings: LatestReadingsState
  routine: PeriodicState<RoutineItem[]>
  returnedHome: boolean
  onCheckInSaved: () => void
}) {
  const [chosen, setChosen] = useState<TodoItem['id']>()
  const settled = routine.kind !== 'loading' && readings.kind !== 'loading'
  const { items } = homeVariant({
    routine: routine.kind === 'ready' ? routine.data : undefined,
    readings: readings.kind === 'ready' ? readings.data : undefined,
  })
  // To do: the item the user opened while it is still owed, otherwise the first. Nominal when nothing is owed.
  const open = settled ? (items.find((item) => item.id === chosen) ?? items[0]) : undefined

  let variantCards: ReactNode = null
  if (open) {
    variantCards = <TodoPanel items={items} openId={open.id} onOpen={setChosen} onSaved={onCheckInSaved} />
  } else if (settled) {
    variantCards = (
      <>
        <TodaysRoutine
          state={routine}
          onStart={() => {
            window.location.hash = CHECK_IN_HASH
          }}
        />
        <PvtCard />
      </>
    )
  }

  return (
    <ScreenLayout
      side={
        <LatestReadings
          state={readings}
          heading={open ? 'Relevant readings' : 'Latest readings'}
          first={open ? [...open.readingKeys, ...items.filter((i) => i !== open).flatMap((i) => i.readingKeys)] : undefined}
          todo={open?.readingKeys}
        />
      }
      primary={<BodyCard statuses={statuses} todo={open?.systems} />}
      secondary={
        <>
          {variantCards}
          <SystemStatusList state={statuses} focusHeading={returnedHome} />
        </>
      }
    />
  )
}
