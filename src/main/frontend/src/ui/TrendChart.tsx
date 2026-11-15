import type { ChartPoint, Indicator, Rule } from '../domain/rules'

// Plot area in viewBox units.
const LEFT = 72
const RIGHT = 620
const TOP = 16
const BOTTOM = 200
const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

/** Fixed Y axis per indicator [min, max, step], so threshold lines always show. */
const Y_RANGE: Partial<Record<Indicator, [number, number, number]>> = { spo2Percent: [80, 100, 5], pvtMedianMs: [200, 400, 50] }

/** Level glyphs from ideas/alert-levels.md "Icon" column; watch points by their rule's direction. */
function marker({ status, rule }: ChartPoint): string | undefined {
  switch (status) {
    case 'watch':
      return rule?.below !== undefined ? '↘' : '↗'
    case 'check':
      return '▲'
    case 'treat':
      return '✚'
    case 'emergency':
      return '⬣'
  }
}

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

export function TrendChart({ rules, points, now, windowMs }: { rules: Rule[]; points: ChartPoint[]; now: Date; windowMs: number }) {
  const { indicator, label, unit, validMin, validMax, baseline } = rules[0]
  const [min, max, step] = Y_RANGE[indicator] ?? [validMin, validMax, (validMax - validMin) / 4]
  const to = now.getTime()
  const from = to - windowMs
  const x = (time: number) => LEFT + ((time - from) / windowMs) * (RIGHT - LEFT)
  // Values outside the axis sit on its edge; the title keeps the real value.
  const y = (value: number) => BOTTOM - ((Math.min(Math.max(value, min), max) - min) / (max - min)) * (BOTTOM - TOP)

  const grid: number[] = []
  for (let v = min; v <= max; v += step) grid.push(v)
  const drawn = points.map((p) => ({ ...p, cx: x(Date.parse(p.recordedAt)), cy: y(p.value), mark: marker(p) }))

  return (
    <svg
      className="trend-chart"
      viewBox="0 0 640 236"
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
        const limit = rule.below ?? rule.above ?? min
        const sign = rule.below !== undefined ? '<' : '>'
        return (
          <g key={rule.id}>
            <line className="chart-threshold" x1={LEFT} x2={RIGHT} y1={y(limit)} y2={y(limit)} />
            <text className="chart-label" x={LEFT + 6} y={y(limit) - 5}>{`${rule.id} · ${sign} ${limit} ${unit} ${rule.status}`}</text>
          </g>
        )
      })}
      {drawn.length > 1 && <polyline className="chart-line" points={drawn.map((p) => `${p.cx},${p.cy}`).join(' ')} />}
      {drawn.map((p) => (
        <g key={p.recordedAt + p.value}>
          <circle
            className={p.status === 'nominal' ? 'chart-point' : `chart-point chart-point--${p.status}`}
            cx={p.cx}
            cy={p.cy}
            r={p.status === 'nominal' ? 4 : 6}
          >
            <title>{`${p.value} ${unit} · ${p.status} · ${timeLabel.format(Date.parse(p.recordedAt)).replace(',', '')} UTC · ${p.source}`}</title>
          </circle>
          {p.mark && (
            <text className="chart-marker" x={p.cx} y={p.cy - 12} textAnchor="middle">
              {p.mark}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
