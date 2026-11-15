import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { formatAge, formatStaleAge } from '../application/formatAge'
import type { ChartPoint, Indicator, Rule } from '../domain/rules'
import { levelIcon } from './SystemStatusList'

// Plot area in viewBox units.
const LEFT = 72
const RIGHT = 620
const TOP = 16
const BOTTOM = 200
const WIDTH = 640
const HEIGHT = 236
const CHAR = 9.6 // DM Mono advance at 16 px
const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

/** Fixed Y axis per indicator [min, max, step], so threshold lines always show. */
const Y_RANGE: Partial<Record<Indicator, [number, number, number]>> = { spo2Percent: [80, 100, 5], pvtMedianMs: [200, 400, 50] }
/** Drift charts (daily resting value) zoom in on the baseline and limit. */
const DRIFT_Y_RANGE: Partial<Record<Indicator, [number, number, number]>> = { heartRateBpm: [50, 80, 10] }

const MARKER_SIZE = 18
const READOUT_ICON = 16
const READOUT_HEIGHT = 60
const READOUT_PAD = 12
const HIT_MARGIN = 8

/** Most severe first; the readout shows the first of the readings at one time. */
const SEVERITY: ChartPoint['status'][] = ['emergency', 'treat', 'check', 'watch', 'nominal', 'stale']

/** Same level from the same rule: consecutive points like this form one run. */
const sameRun = (a: ChartPoint, b: ChartPoint | undefined) => b !== undefined && a.status === b.status && a.rule?.id === b.rule?.id

/** The level icon of the newest point of each run, so a reading per second doesn't stack markers. A stale point never has one. */
function marker(points: ChartPoint[], i: number) {
  const point = points[i]
  if (point.status === 'stale' || sameRun(point, points[i + 1])) return undefined
  return levelIcon(point.status, point.rule)
}

/** Above the point, or below it when above would be clipped by the top of the chart. */
const markerY = (cy: number) => (cy - 30 >= 0 ? cy - 30 : cy + 12)

/** "last 7 days", "last minute". */
export function windowLabel(windowMs: number): string {
  if (windowMs >= DAY) return `last ${Math.round(windowMs / DAY)} days`
  if (windowMs === MINUTE) return 'last minute'
  return `last ${Math.round(windowMs / MINUTE)} minutes`
}

interface Tick {
  time: number
  text: string
  anchor: 'middle' | 'end'
}

const dayLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const clockLabel = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })

/** Day windows: the UTC midnights. Shorter windows: five clock times at the quarters, the last one end-anchored. */
function ticks(from: number, to: number): Tick[] {
  if (to - from >= DAY) {
    const midnights: Tick[] = []
    for (let t = Math.ceil(from / DAY) * DAY; t <= to; t += DAY) midnights.push({ time: t, text: dayLabel.format(t), anchor: 'middle' })
    return midnights
  }
  return [0, 1, 2, 3, 4].map((i) => {
    const time = from + ((to - from) * i) / 4
    return { time, text: clockLabel.format(time), anchor: i === 4 ? 'end' : 'middle' }
  })
}
const timeLabel = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})

interface XY {
  cx: number
  cy: number
}

/** Monotone cubic Hermite with Fritsch–Butland tangents (as PCHIP): smooth, and never overshoots between two readings. */
export function smoothPath(pts: XY[]): string {
  const n = pts.length
  if (n < 2) return ''
  const dx = pts.slice(1).map((p, i) => p.cx - pts[i].cx)
  const slope = dx.map((d, i) => (d === 0 ? 0 : (pts[i + 1].cy - pts[i].cy) / d))
  const tangent = pts.map((_, i) => {
    if (i === 0) return slope[0]
    if (i === n - 1) return slope[n - 2]
    const [s0, s1, d0, d1] = [slope[i - 1], slope[i], dx[i - 1], dx[i]]
    return s0 * s1 <= 0 ? 0 : (3 * (d0 + d1)) / ((2 * d1 + d0) / s0 + (d1 + 2 * d0) / s1)
  })
  let d = `M${pts[0].cx},${pts[0].cy}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C${pts[i].cx + h},${pts[i].cy + tangent[i] * h} ${pts[i + 1].cx - h},${pts[i + 1].cy - tangent[i + 1] * h} ${pts[i + 1].cx},${pts[i + 1].cy}`
  }
  return d
}

function mostSevere<T extends ChartPoint>(points: T[]): T | undefined {
  return points.reduce<T | undefined>((best, p) => (best === undefined || SEVERITY.indexOf(p.status) <= SEVERITY.indexOf(best.status) ? p : best), undefined)
}

function nearest(points: XY[], vx: number): number {
  let best = 0
  points.forEach((p, i) => {
    if (Math.abs(p.cx - vx) < Math.abs(points[best].cx - vx)) best = i
  })
  return best
}

export function TrendChart({ rules, points, now, windowMs }: { rules: Rule[]; points: ChartPoint[]; now: Date; windowMs: number }) {
  const { indicator, label, unit, validMin, validMax, baseline, atLeast } = rules[0]
  const ranges = atLeast !== undefined ? DRIFT_Y_RANGE : Y_RANGE
  const [min, max, step] = ranges[indicator] ?? [validMin, validMax, (validMax - validMin) / 4]
  const to = now.getTime()
  const from = to - windowMs
  const x = (time: number) => LEFT + ((time - from) / windowMs) * (RIGHT - LEFT)
  // Values outside the axis sit on its edge; the title keeps the real value.
  const y = (value: number) => BOTTOM - ((Math.min(Math.max(value, min), max) - min) / (max - min)) * (BOTTOM - TOP)

  const grid: number[] = []
  for (let v = min; v <= max; v += step) grid.push(v)
  const drawn = points.map((p, i) => ({ ...p, cx: x(Date.parse(p.recordedAt)), cy: y(p.value), Marker: marker(points, i) }))
  const [hover, setHover] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const tap = useRef<number | null>(null)
  const hovered = hover === null ? undefined : mostSevere(drawn.filter((p) => p.recordedAt === hover))
  const isPinned = pinned && hovered !== undefined

  // The reading left the window: drop the readout and its pin.
  useEffect(() => {
    if (hover !== null && !hovered) {
      setHover(null)
      setPinned(false)
    }
  }, [hover, hovered])

  // A touch outside the chart unpins.
  useEffect(() => {
    if (!pinned) return
    const away = (e: Event) => {
      if (e.target instanceof Node && svgRef.current?.contains(e.target)) return
      setHover(null)
      setPinned(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [pinned])

  /** Viewbox x of the pointer inside the plot range, else undefined. */
  const plotX = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    if (box.width === 0 || drawn.length === 0) return undefined
    const vx = ((e.clientX - box.left) / box.width) * WIDTH
    return vx < LEFT - HIT_MARGIN || vx > RIGHT + HIT_MARGIN ? undefined : vx
  }
  const show = (vx: number) => setHover(drawn[nearest(drawn, vx)].recordedAt)
  const unpin = () => {
    setHover(null)
    setPinned(false)
  }
  const isTouch = (e: PointerEvent) => e.pointerType === 'touch' || e.pointerType === 'pen'

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const vx = plotX(e)
    if (!isTouch(e)) return vx === undefined ? setHover(null) : show(vx)
    if (pinned && vx !== undefined) show(vx)
  }
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const vx = plotX(e)
    if (!isTouch(e)) return vx === undefined ? setHover(null) : show(vx)
    if (vx === undefined) {
      tap.current = null
      return unpin()
    }
    tap.current = vx
  }
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    if (!isTouch(e) || tap.current === null) return
    show(tap.current)
    setPinned(true)
    tap.current = null
  }
  const onPointerLeave = (e: PointerEvent<SVGSVGElement>) => {
    if (!isTouch(e)) setHover(null)
  }

  return (
    <svg
      ref={svgRef}
      className={isPinned ? 'trend-chart trend-chart--pinned' : 'trend-chart'}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (tap.current = null)}
      onPointerLeave={onPointerLeave}
      role="img"
      aria-label={`${label}, ${windowLabel(windowMs)}, ${points.length} ${points.length === 1 ? 'reading' : 'readings'}`}
    >
      {grid.map((v) => (
        <g key={v}>
          <line className="chart-grid" data-value={v} x1={LEFT} x2={RIGHT} y1={y(v)} y2={y(v)} />
          <text className="chart-label" x={LEFT - 6} y={y(v) + 5} textAnchor="end">{`${v} ${unit}`}</text>
        </g>
      ))}
      {ticks(from, to).map((tick) => (
        <text key={tick.time} className="chart-label" x={x(tick.time)} y={228} textAnchor={tick.anchor}>
          {tick.text}
        </text>
      ))}
      {baseline && (
        <g>
          <line
            className="chart-baseline"
            data-value={baseline.value}
            x1={LEFT}
            x2={RIGHT}
            y1={y(baseline.value)}
            y2={y(baseline.value)}
          />
          <text className="chart-label" x={RIGHT} y={y(baseline.value) + 16} textAnchor="end">
            {`your pre-flight normal · ${baseline.value} ${unit} · ${baseline.source}`}
          </text>
        </g>
      )}
      {rules.map((rule) => {
        const limit = rule.below ?? rule.above ?? rule.atLeast ?? min
        const sign = rule.below !== undefined ? '<' : rule.atLeast !== undefined ? '≥' : '>'
        const days = rule.days !== undefined ? ` ${rule.days} days` : ''
        return (
          <g key={rule.id}>
            <line className="chart-threshold" x1={LEFT} x2={RIGHT} y1={y(limit)} y2={y(limit)} />
            <text className="chart-label" x={LEFT + 6} y={y(limit) - 5}>{`${rule.id} · ${sign} ${limit} ${unit}${days} ${rule.status}`}</text>
          </g>
        )
      })}
      {hovered && <line className="chart-crosshair" x1={hovered.cx} x2={hovered.cx} y1={TOP} y2={BOTTOM} />}
      {drawn.length > 1 && <path className="chart-line" d={smoothPath(drawn)} />}
      {drawn.map((p) => (
        <g key={p.recordedAt + p.value}>
          <circle
            className={p.status === 'nominal' ? 'chart-point' : `chart-point chart-point--${p.status}`}
            cx={p.cx}
            cy={p.cy}
            r={p.status !== 'nominal' ? 6 : drawn.length > 1 ? 0 : 4}
          >
            <title>{`${p.value} ${unit} · ${p.status} · ${timeLabel.format(Date.parse(p.recordedAt)).replace(',', '')} UTC · ${p.source}`}</title>
          </circle>
          {p.Marker && <p.Marker className="chart-marker" size={MARKER_SIZE} x={p.cx - MARKER_SIZE / 2} y={markerY(p.cy)} />}
        </g>
      ))}
      {hovered && <Readout point={hovered} unit={unit} now={now} />}
    </svg>
  )
}

/** Rendered length of an SVG text; jsdom has no text measuring, so it falls back to characters × the DM Mono advance. */
function textLength(el: SVGTextElement | null, chars: number): number {
  const measured = el?.getComputedTextLength?.() ?? 0
  return measured > 0 ? measured : chars * CHAR
}

/** Hover readout: value, level icon + word, then age, UTC time and source of the nearest reading. */
function Readout({ point, unit, now }: { point: XY & ChartPoint; unit: string; now: Date }) {
  const { status } = point
  const Icon = levelIcon(status, point.rule)
  const word = status === 'nominal' ? '' : status
  const head = `${point.value} ${unit}${word ? ' ·' : ''}`
  const age = status === 'stale' ? formatStaleAge(point.recordedAt, now) : formatAge(point.recordedAt, now)
  const meta = `${age} · ${timeLabel.format(Date.parse(point.recordedAt)).replace(',', '')} UTC · ${point.source}`
  const headRef = useRef<SVGTextElement>(null)
  const wordRef = useRef<SVGTextElement>(null)
  const metaRef = useRef<SVGTextElement>(null)
  const [widths, setWidths] = useState<{ head: number; word: number; meta: number } | null>(null)

  useLayoutEffect(() => {
    const next = {
      head: textLength(headRef.current, head.length),
      word: textLength(wordRef.current, word.length),
      meta: textLength(metaRef.current, meta.length),
    }
    setWidths((prev) => (prev && prev.head === next.head && prev.word === next.word && prev.meta === next.meta ? prev : next))
  }, [head, word, meta])

  const w = widths ?? { head: head.length * CHAR, word: word.length * CHAR, meta: meta.length * CHAR }
  const iconW = Icon ? READOUT_ICON + CHAR : 0
  const line1 = w.head + (word ? CHAR + iconW + w.word : 0)
  const boxW = Math.max(line1, w.meta) + 2 * READOUT_PAD
  const right = point.cx + 14
  const leftSide = point.cx - 14 - boxW
  const left = right + boxW <= WIDTH ? right : leftSide >= 0 ? leftSide : Math.min(Math.max(leftSide, 0), WIDTH - boxW)
  const top = Math.min(Math.max(point.cy - READOUT_HEIGHT / 2, 0), HEIGHT - READOUT_HEIGHT)
  const iconX = left + READOUT_PAD + w.head + CHAR
  return (
    <g className="chart-readout" aria-hidden="true">
      <circle
        className={status === 'nominal' ? 'chart-hover chart-hover--nominal' : 'chart-hover'}
        cx={point.cx}
        cy={point.cy}
        r={status === 'nominal' ? 5 : 10}
      />
      <rect className="chart-readout-box" x={left} y={top} width={boxW} height={READOUT_HEIGHT} rx={8} />
      <text ref={headRef} className="chart-readout-value" x={left + READOUT_PAD} y={top + 24}>
        {head}
      </text>
      {Icon && <Icon className="chart-readout-icon" size={READOUT_ICON} x={iconX} y={top + 24 - READOUT_ICON + 2} />}
      {word && (
        <text ref={wordRef} className="chart-readout-value" x={iconX + iconW} y={top + 24}>
          {word}
        </text>
      )}
      <text ref={metaRef} className="chart-readout-meta" x={left + READOUT_PAD} y={top + 46}>
        {meta}
      </text>
    </g>
  )
}
