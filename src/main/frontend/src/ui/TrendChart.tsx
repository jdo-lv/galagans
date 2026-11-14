import { CHART_WINDOW_MS, type ChartPoint, type Indicator, type Rule } from '../domain/rules'

// Plot area in viewBox units.
const LEFT = 72
const RIGHT = 620
const TOP = 16
const BOTTOM = 200
const DAY = 24 * 60 * 60 * 1000

/** Fixed Y axis per indicator [min, max, step], so threshold lines always show. */
const Y_RANGE: Partial<Record<Indicator, [number, number, number]>> = { spo2Percent: [80, 100, 5], pvtMedianMs: [200, 400, 50] }

const MARKER: Partial<Record<ChartPoint['status'], string>> = { caution: '▲', warning: '!' }

const dayLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const timeLabel = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})

export function TrendChart({ rules, points, now, source }: { rules: Rule[]; points: ChartPoint[]; now: Date; source: string }) {
  const { indicator, label, unit, validMin, validMax } = rules[0]
  const [min, max, step] = Y_RANGE[indicator] ?? [validMin, validMax, (validMax - validMin) / 4]
  const to = now.getTime()
  const from = to - CHART_WINDOW_MS
  const x = (time: number) => LEFT + ((time - from) / CHART_WINDOW_MS) * (RIGHT - LEFT)
  // Values outside the axis sit on its edge; the title keeps the real value.
  const y = (value: number) => BOTTOM - ((Math.min(Math.max(value, min), max) - min) / (max - min)) * (BOTTOM - TOP)

  const grid: number[] = []
  for (let v = min; v <= max; v += step) grid.push(v)
  const midnights: number[] = []
  for (let t = Math.ceil(from / DAY) * DAY; t <= to; t += DAY) midnights.push(t)
  const drawn = points.map((p) => ({ ...p, cx: x(Date.parse(p.recordedAt)), cy: y(p.value) }))

  return (
    <svg
      className="trend-chart"
      viewBox="0 0 640 236"
      role="img"
      aria-label={`${label}, last 7 days, ${points.length} ${points.length === 1 ? 'reading' : 'readings'}`}
    >
      {grid.map((v) => (
        <g key={v}>
          <line className="chart-grid" data-value={v} x1={LEFT} x2={RIGHT} y1={y(v)} y2={y(v)} />
          <text className="chart-label" x={LEFT - 6} y={y(v) + 5} textAnchor="end">{`${v} ${unit}`}</text>
        </g>
      ))}
      {midnights.map((t) => (
        <text key={t} className="chart-label" x={x(t)} y={228} textAnchor="middle">
          {dayLabel.format(t)}
        </text>
      ))}
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
            <title>{`${p.value} ${unit} · ${p.status} · ${timeLabel.format(Date.parse(p.recordedAt)).replace(',', '')} UTC · ${source}`}</title>
          </circle>
          {MARKER[p.status] && (
            <text className="chart-marker" x={p.cx} y={p.cy - 12} textAnchor="middle">
              {MARKER[p.status]}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
