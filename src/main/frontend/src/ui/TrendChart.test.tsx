import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ChartPoint } from '../domain/rules'
import { RULES } from '../test/rules'
import { smoothPath, TrendChart } from './TrendChart'

const SPO2 = RULES.filter((r) => r.indicator === 'spo2Percent')
const NOW = new Date('2026-11-14T09:30:00Z')
const MIN = 60_000

// Point on a cubic Bézier segment at t.
const bezier = (p0: number, c1: number, c2: number, p1: number, t: number) =>
  (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3 * p1

describe('smoothPath', () => {
  it('passes through every point', () => {
    const d = smoothPath([
      { cx: 0, cy: 10 },
      { cx: 10, cy: 20 },
      { cx: 30, cy: 5 },
    ])
    expect(d.startsWith('M0,10')).toBe(true)
    expect(d).toMatch(/ 10,20 C/)
    expect(d.endsWith(' 30,5')).toBe(true)
  })

  it('never overshoots between two readings', () => {
    const pts = [
      { cx: 0, cy: 100 },
      { cx: 10, cy: 100 },
      { cx: 20, cy: 40 },
      { cx: 100, cy: 30 },
      { cx: 110, cy: 90 },
    ]
    const segments = smoothPath(pts)
      .split(' C')
      .slice(1)
      .map((s) => s.split(' ').flatMap((xy) => xy.split(',').map(Number)))
    segments.forEach(([, c1y, , c2y, , p1y], i) => {
      const [lo, hi] = [Math.min(pts[i].cy, p1y), Math.max(pts[i].cy, p1y)]
      for (let t = 0; t <= 1; t += 0.05) {
        const y = bezier(pts[i].cy, c1y, c2y, p1y, t)
        expect(y).toBeGreaterThanOrEqual(lo - 1e-9)
        expect(y).toBeLessThanOrEqual(hi + 1e-9)
      }
    })
  })
})

describe('TrendChart hover readout', () => {
  const points: ChartPoint[] = [
    { recordedAt: new Date(NOW.getTime() - 3 * 24 * 60 * MIN).toISOString(), value: 97, source: 'manual', status: 'nominal' },
    { recordedAt: new Date(NOW.getTime() - 10 * MIN).toISOString(), value: 92, source: 'manual', status: 'check', rule: SPO2[0] },
  ]

  function renderChart() {
    const { container } = render(<TrendChart rules={SPO2} points={points} now={NOW} windowMs={7 * 24 * 60 * MIN} />)
    const svg = container.querySelector('svg') as SVGSVGElement
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 236, right: 640, bottom: 236, x: 0, y: 0, toJSON: () => ({}) })
    return svg
  }

  it('hides nominal dots on a line but keeps flagged ones', () => {
    const svg = renderChart()
    expect([...svg.querySelectorAll('circle.chart-point')].map((c) => c.getAttribute('r'))).toEqual(['0', '6'])
  })

  it('shows a crosshair and the nearest reading with level, UTC time and source', () => {
    const svg = renderChart()
    fireEvent.pointerMove(svg, { clientX: 615 })

    expect(svg.querySelector('.chart-crosshair')).not.toBeNull()
    expect(svg.querySelector('.chart-readout')).toHaveTextContent('92 % · Check')
    expect(svg.querySelector('.chart-readout svg.chart-readout-icon')).toHaveClass('tabler-icon-alert-triangle')
    expect(svg.querySelector('.chart-readout')).toHaveTextContent('14 Nov 09:20 UTC · manual')
  })

  it('clears the readout when the pointer leaves', () => {
    const svg = renderChart()
    fireEvent.pointerMove(svg, { clientX: 615 })
    fireEvent.pointerLeave(svg)
    expect(svg.querySelector('.chart-readout')).toBeNull()
  })
})
