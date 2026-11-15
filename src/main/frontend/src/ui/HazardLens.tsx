import { useId, type ComponentType } from 'react'
import { HAZARDS, type Hazard, type HazardId } from '../domain/hazards'
import './hazard.css'
import { DistanceFromEarthIcon, GravityIcon, HostileEnvironmentIcon, IsolationIcon, RadiationIcon } from './icons'

const ICONS: Record<HazardId, ComponentType> = {
  radiation: RadiationIcon,
  isolation: IsolationIcon,
  distance: DistanceFromEarthIcon,
  gravity: GravityIcon,
  hostile: HostileEnvironmentIcon,
}

function Caption({ hazard }: { hazard: Hazard | null }) {
  if (!hazard) return <p>Pick a hazard to see which body systems it affects.</p>
  const affects = hazard.systems === 'all' ? 'all systems, indirectly' : hazard.systems.join(' · ')
  return (
    <>
      <p>
        <b>{hazard.name}:</b> {hazard.effect}
      </p>
      <p>Affects: {affects}</p>
      <p>Watched by: {hazard.checks.join(' · ')}</p>
      <p className="muted">Source: {hazard.source}</p>
    </>
  )
}

/** Hazard lens (F12, on Stats since #52): pick one of NASA's five HRP hazards to see which Body systems rows it affects. */
export function HazardLens({ selected, onToggle }: { selected: Hazard | null; onToggle: (id: HazardId) => void }) {
  const headingId = useId()
  return (
    <section className="card lens" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        Hazard lens <span className="lens-heading__suffix">· NASA HRP five hazards</span>
      </h2>
      <div className="lens-chips" role="group" aria-label="Hazards">
        {HAZARDS.map((hazard) => {
          const Icon = ICONS[hazard.id]
          return (
            <button
              key={hazard.id}
              type="button"
              className="lens-chip"
              aria-pressed={selected?.id === hazard.id}
              onClick={() => onToggle(hazard.id)}
            >
              <Icon />
              {hazard.name}
            </button>
          )
        })}
      </div>
      <div className="lens-caption" aria-live="polite">
        <Caption hazard={selected} />
      </div>
    </section>
  )
}
