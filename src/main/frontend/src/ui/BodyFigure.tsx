import type { CSSProperties } from 'react'
import { isFlagged, type SystemStatus } from '../domain/rules'
import { BODY_OUTLINES, type BodyType } from './bodyOutlines'
import { BoneMuscleIcon, CognitionIcon, HeartRateIcon, KidneyIcon, RespiratoryIcon, VisionIcon, type AppIcon } from './icons'
import { Badge, TodoBadge } from './SystemStatusList'
import type { StatusListState } from './useSystemStatuses'

interface Hotspot {
  label: string
  system: string
  side: 'left' | 'right'
  /** The icon this system or its reading already uses elsewhere, so the body and the tiles share one symbol. */
  icon: AppIcon
  /** Icon box in drawing units: top-left corner and size. */
  box: [x: number, y: number, size: number]
  /** From the icon to the label; the label hangs off the second point. */
  leader: [x1: number, y1: number, x2: number, y2: number]
}

// The traced outlines (bodyOutlines.ts) sit on a 532 × 362 frame; the view crops its empty sides so the figure fills the
// Body card. Labels sit between the figure and the card edge; Bone & muscle is on the shin so its label clears the
// arms, and only the shins sit beside the bottom-left legend.
const VIEW = { x: 117, width: 264, height: 362 }

// Placed on both bodies (same frame). A new hotspot is a new row.
const HOTSPOTS: Hotspot[] = [
  { label: 'Cognition', system: 'Cognition', side: 'left', icon: CognitionIcon, box: [253, 6, 28], leader: [254, 20, 236, 20] },
  { label: 'Eyes', system: 'Vision (SANS)', side: 'right', icon: VisionIcon, box: [275, 28.5, 12], leader: [288, 34.5, 304, 40] },
  { label: 'Lungs', system: 'Respiratory', side: 'left', icon: RespiratoryIcon, box: [252, 104, 28], leader: [252, 118, 204, 118] },
  { label: 'Heart', system: 'Cardiovascular', side: 'right', icon: HeartRateIcon, box: [260, 85, 20], leader: [281, 95, 318, 95] },
  { label: 'Kidneys', system: 'Kidney & hydration', side: 'right', icon: KidneyIcon, box: [254, 141, 24], leader: [278, 153, 326, 153] },
  {
    label: 'Bone & muscle',
    system: 'Bone & muscle',
    side: 'right',
    icon: BoneMuscleIcon,
    box: [276, 280, 20],
    leader: [295, 290, 310, 296],
  },
]

/** Where a label hangs, in % of the view: the end of its leader. */
const anchor = ([, , x, y]: Hotspot['leader']) => ({ x: ((x - VIEW.x) / VIEW.width) * 100, y: (y / VIEW.height) * 100 })

/**
 * Display-only body figure (F6) in Home's Body card: quiet labels, a level badge when a system is flagged. Each system
 * is marked with its icon. `todo` systems (the open level 1 item, #52) get the to-do stroke on their icon and the To do
 * badge on their label. `body` picks the female (default) or male outline (#61).
 */
export function BodyFigure({ statuses, todo = [], body = 'female' }: { statuses: StatusListState; todo?: string[]; body?: BodyType }) {
  const bySystem = new Map<string, SystemStatus>(statuses.kind === 'ready' ? statuses.data.map((s) => [s.system, s]) : [])
  const spots = HOTSPOTS.map((spot) => {
    const status = bySystem.get(spot.system)
    return { ...spot, ...anchor(spot.leader), state: status?.state, rule: status?.rule, owed: todo.includes(spot.system) }
  })

  return (
    <div className="body-figure">
      <svg viewBox={`${VIEW.x} 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" focusable="false">
        <path className="silhouette" data-body={body} d={BODY_OUTLINES[body]} />
        {spots.map(({ system, icon: Icon, box: [x, y, size], owed }) => (
          <Icon key={system} x={x} y={y} width={size} height={size} className={owed ? 'organ organ--todo' : 'organ'} data-system={system} />
        ))}
        {spots.map(({ system, leader: [x1, y1, x2, y2] }) => (
          <line key={system} className="leader" data-system={system} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </svg>
      <ul className="hotspots" aria-label="Body figure">
        {spots.map(({ label, system, side, x, y, state, rule, owed }) => (
          <li
            key={system}
            data-system={system}
            className={['hotspot', `hotspot--${side}`, isFlagged(state) && 'hotspot--flagged', owed && 'hotspot--todo']
              .filter(Boolean)
              .join(' ')}
            style={{ '--x': `${x}%`, '--y': `${y}%` } as CSSProperties}
          >
            <span className="hotspot__label">{label}</span>
            {isFlagged(state) ? <Badge state={state} rule={rule} /> : owed && <TodoBadge />}
          </li>
        ))}
      </ul>
    </div>
  )
}
