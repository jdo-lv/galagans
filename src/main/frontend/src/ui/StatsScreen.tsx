import { useEffect, useId, useRef } from 'react'
import type { Hazard, HazardId } from '../domain/hazards'
import { HazardLens } from './HazardLens'
import { ScreenLayout } from './ScreenLayout'
import { SystemStatusList } from './SystemStatusList'
import type { StatusListState } from './useSystemStatuses'

/** Stats (#52): the hazard lens and the Body systems rows it marks. The six categories' data view is not built yet, and says so. */
export function StatsScreen({
  statuses,
  lens,
  onToggleHazard,
}: {
  statuses: StatusListState
  lens: Hazard | null
  onToggleHazard: (id: HazardId) => void
}) {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [])

  return (
    <ScreenLayout
      side={
        <section className="side-section" aria-labelledby={headingId}>
          <h2 id={headingId} ref={heading} tabIndex={-1} className="section-heading">
            Stats
          </h2>
          <p className="muted">Data from all six categories will show here. Not built yet.</p>
        </section>
      }
      primary={<HazardLens selected={lens} onToggle={onToggleHazard} />}
      secondary={<SystemStatusList state={statuses} lens={lens} />}
    />
  )
}
