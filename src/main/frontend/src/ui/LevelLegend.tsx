import { useId } from 'react'
import type { Rule } from '../domain/rules'
import { LevelCheckIcon, LevelEmergencyIcon, LevelTreatIcon, LevelWatchUpIcon, NominalIcon, type AppIcon } from './icons'
import { LEVEL_WORDS, TodoBadge } from './SystemStatusList'

// Levels 2–5 as their badges show them (ideas/alert-levels.md); Watch with its up arrow, as a drifting value shows it.
const FLAGS: [Rule['status'], AppIcon][] = [
  ['watch', LevelWatchUpIcon],
  ['check', LevelCheckIcon],
  ['treat', LevelTreatIcon],
  ['emergency', LevelEmergencyIcon],
]

/** The 0–5 alert levels under the body figure (#52), each as the badge the app shows for it. */
export function LevelLegend() {
  const headingId = useId()
  return (
    <div className="level-legend">
      <h3 id={headingId} className="level-legend__heading">
        Alert levels
      </h3>
      <ul aria-labelledby={headingId}>
        <li>
          <span className="badge badge--nominal">
            <NominalIcon size={18} />
            Nominal
          </span>
        </li>
        <li>
          <TodoBadge />
        </li>
        {FLAGS.map(([level, Icon]) => (
          <li key={level}>
            <span className={`badge badge--${level}`}>
              <Icon size={18} />
              {LEVEL_WORDS[level]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
