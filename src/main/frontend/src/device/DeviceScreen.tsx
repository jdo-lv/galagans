import { useEffect, useRef, useState } from 'react'
import type { DotFeed } from './DotFeed'
import { dataAgeText, sameView, viewFor, type DotBanner, type DotState, type DotView } from './dotDisplay'

// The panel in its own pixels (320 × 172 landscape) with the firmware's layout (src/Screen.cpp, mockup 13).
// The SVG scales it to the browser; text sizes are panel pixels too.
const WIDTH = 320
const HEIGHT = 172
const RADIUS = 23
const RING_WIDTH = 3
const STEP = 52
const FIRST_X = 30
const DOTS_Y = 86
const BANNER_Y = 32
const WORD_Y = 136
const AGE_Y = 160
const SLOTS = [0, 1, 2, 3, 4, 5]
const REFRESH_MS = 100

const QUIET_BANNERS: Partial<Record<DotBanner, string>> = {
  connecting: 'Connecting...',
  waiting: 'Waiting for data',
  simulated: 'SIMULATED',
}
const BANNER_LABELS: Record<DotBanner, string | undefined> = {
  none: undefined,
  connecting: 'connecting',
  waiting: 'waiting for data',
  noConnection: 'no connection',
  simulated: 'simulated',
}

function labelFor(view: DotView): string {
  const value = view.word ? `${view.lit} of 6 dots, ${view.word}` : 'No value yet'
  const age = view.ageS === undefined ? undefined : dataAgeText(view.ageS)
  return [value, BANNER_LABELS[view.banner], age].filter(Boolean).join(', ')
}

/** Paints one view of the panel. */
export function DotDisplay({ view }: { view: DotView }) {
  const quiet = QUIET_BANNERS[view.banner]
  return (
    <svg className="dot-display" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={labelFor(view)}>
      {quiet && <text className="dot-display__banner" x={WIDTH / 2} y={BANNER_Y}>{quiet}</text>}
      {view.banner === 'noConnection' && view.bannerOn && (
        <text className="dot-display__alarm" x={WIDTH / 2} y={BANNER_Y}>NO CONNECTION</text>
      )}
      <g className={view.dim ? 'dot-display__dots is-dim' : 'dot-display__dots'}>
        {SLOTS.map((i) =>
          i < view.lit && view.litOn ? (
            <circle key={i} className={`dot dot--${view.colour}`} cx={FIRST_X + i * STEP} cy={DOTS_Y} r={RADIUS} />
          ) : (
            <circle key={i} className="dot dot--empty" cx={FIRST_X + i * STEP} cy={DOTS_Y} r={RADIUS - RING_WIDTH / 2} />
          ),
        )}
      </g>
      {view.word && <text className="dot-display__word" x={WIDTH / 2} y={WORD_Y}>{view.word}</text>}
      {view.ageS !== undefined && (
        <text className="dot-display__age" x={WIDTH / 2} y={AGE_Y}>{dataAgeText(view.ageS)}</text>
      )}
    </svg>
  )
}

/** The firmware's loop: the feed updates what the display knows, and the view is worked out again every 100 ms. */
function useDotView(feed: DotFeed, now: () => number, fourDotsYellow: boolean): DotView {
  const state = useRef<DotState>({
    simulated: feed.simulated, connected: false, everConnected: false, hasValue: false, pct: 0, valueAtMs: 0,
  })
  const [view, setView] = useState(() => viewFor(state.current, now(), fourDotsYellow))

  useEffect(() => {
    const refresh = () => {
      const next = viewFor(state.current, now(), fourDotsYellow)
      setView((previous) => (sameView(previous, next) ? previous : next))
    }
    const stop = feed.start({
      value: (pct) => {
        state.current = { ...state.current, hasValue: true, pct, valueAtMs: now() }
        refresh()
      },
      link: (connected) => {
        state.current = { ...state.current, connected, everConnected: state.current.everConnected || connected }
        refresh()
      },
    })
    refresh()
    const timer = setInterval(refresh, REFRESH_MS)
    return () => {
      stop()
      clearInterval(timer)
    }
  }, [feed, now, fourDotsYellow])

  return view
}

const sincePageLoad = () => performance.now()

/** The dot display as the board runs it, scaled to the browser. `now` is milliseconds since start, like millis(). */
export function DeviceScreen({ feed, now = sincePageLoad, fourDotsYellow = false }: {
  feed: DotFeed
  now?: () => number
  fourDotsYellow?: boolean
}) {
  return <DotDisplay view={useDotView(feed, now, fourDotsYellow)} />
}
