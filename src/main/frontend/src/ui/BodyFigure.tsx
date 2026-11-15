import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { isFlagged, type SystemStatus } from '../domain/rules'
import { Badge, TodoBadge } from './SystemStatusList'
import type { StatusListState } from './useSystemStatuses'

interface Hotspot {
  label: string
  system: string
  side: 'left' | 'right'
  /** Label anchor in % of the drawing, where its leader line ends. */
  x: number
  y: number
  organ: (props: { className: string; 'data-system': string }) => ReactNode
  leader: [x1: number, y1: number, x2: number, y2: number]
}

// Shapes on the 532 × 362 drawing of docs/features/14-hazard-lens.mock.html. A new hotspot is a new row.
const HOTSPOTS: Hotspot[] = [
  {
    label: 'Cognition',
    system: 'Cognition',
    side: 'right',
    x: 67,
    y: 8.3,
    organ: (p) => <path {...p} d="M245 34 C245 18 256 10 266 10 C278 10 288 18 288 32 C288 42 282 48 274 48 L258 48 C250 48 245 42 245 34Z" />,
    leader: [290, 30, 352, 30],
  },
  {
    label: 'Eyes',
    system: 'Vision (SANS)',
    side: 'left',
    x: 33,
    y: 17.7,
    organ: (p) => (
      <g {...p}>
        <ellipse cx="257" cy="56" rx="4" ry="3" />
        <ellipse cx="275" cy="56" rx="4" ry="3" />
      </g>
    ),
    leader: [252, 56, 180, 64],
  },
  {
    label: 'Lungs',
    system: 'Respiratory',
    side: 'left',
    x: 33,
    y: 43.6,
    organ: (p) => (
      <g {...p}>
        <path d="M244 132 C236 150 236 176 246 186 C254 184 258 170 258 150 C258 138 252 130 244 132Z" />
        <path d="M288 132 C296 150 296 176 286 186 C278 184 274 170 274 150 C274 138 280 130 288 132Z" />
      </g>
    ),
    leader: [240, 158, 180, 158],
  },
  {
    label: 'Heart',
    system: 'Cardiovascular',
    side: 'right',
    x: 67,
    y: 33.1,
    organ: (p) => <path {...p} d="M276 146 C272 140 264 142 266 150 C268 158 276 162 278 166 C280 162 288 158 290 150 C292 142 284 140 280 146Z" />,
    leader: [290, 152, 352, 120],
  },
  {
    label: 'Kidneys',
    system: 'Kidney & hydration',
    side: 'right',
    x: 67,
    y: 58,
    organ: (p) => (
      <g {...p}>
        <path d="M248 194 C242 196 242 208 248 210 C252 210 252 204 250 202 C252 198 252 194 248 194Z" />
        <path d="M284 194 C290 196 290 208 284 210 C280 210 280 204 282 202 C280 198 280 194 284 194Z" />
      </g>
    ),
    leader: [288, 202, 352, 210],
  },
  {
    label: 'Bone & muscle',
    system: 'Bone & muscle',
    side: 'right',
    x: 67,
    y: 82.9,
    organ: (p) => <path {...p} d="M292 262 L288 300 M240 262 L244 300" />,
    leader: [292, 290, 352, 300],
  },
]

const SILHOUETTE =
  'M255,72 L255,88 C240,90 214,92 204,104 C196,112 194,128 192,146 L182,232 C180,246 184,256 192,256 C199,256 202,248 201,236 L208,150 C209,140 212,132 216,128 C218,160 220,182 220,200 C220,214 216,226 216,240 L226,336 C226,346 234,350 246,348 C252,347 252,340 250,334 L256,252 C258,246 262,244 266,244 C270,244 274,246 276,252 L282,334 C280,340 280,347 286,348 C298,350 306,346 306,336 L316,240 C316,226 312,214 312,200 C312,182 314,160 316,128 C320,132 323,140 324,150 L331,236 C330,248 333,256 340,256 C348,256 352,246 350,232 L340,146 C338,128 336,112 328,104 C318,92 292,90 277,88 L277,72 Z'

/**
 * Display-only body figure (F6) in Home's Body card: quiet labels, a level badge when a system is flagged, and the
 * level 1 mark (filled organ, To do badge) on the systems in `todo`, which the open to-do item feeds (#52).
 */
export function BodyFigure({ statuses, todo = [] }: { statuses: StatusListState; todo?: string[] }) {
  const bySystem = new Map<string, SystemStatus>(statuses.kind === 'ready' ? statuses.data.map((s) => [s.system, s]) : [])
  const spots = HOTSPOTS.map((spot) => {
    const status = bySystem.get(spot.system)
    return { ...spot, state: status?.state, rule: status?.rule, owed: todo.includes(spot.system) }
  })

  return (
    <div className="body-figure">
      <svg viewBox="0 0 532 362" aria-hidden="true" focusable="false">
        <path className="silhouette" d={SILHOUETTE} />
        <ellipse className="silhouette" cx="266" cy="40" rx="26" ry="32" />
        {spots.map(({ system, organ, owed }) => (
          <Fragment key={system}>{organ({ className: owed ? 'organ organ--todo' : 'organ', 'data-system': system })}</Fragment>
        ))}
        {spots.map(({ system, leader: [x1, y1, x2, y2] }) => (
          <line
            key={system}
            className="leader"
            data-system={system}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
          />
        ))}
      </svg>
      <ul className="hotspots" aria-label="Body figure">
        {spots.map(({ label, system, side, x, y, state, rule, owed }) => (
          <li
            key={system}
            data-system={system}
            className={['hotspot', `hotspot--${side}`, isFlagged(state) && 'hotspot--flagged', owed && 'hotspot--todo'].filter(Boolean).join(' ')}
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
