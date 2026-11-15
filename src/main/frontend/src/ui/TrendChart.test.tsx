import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChartPoint } from '../domain/rules'
import { RULES } from '../test/rules'
import { smoothPath, TrendChart } from './TrendChart'

const SPO2 = RULES.filter((r) => r.indicator === 'spo2Percent')
const NOW = new Date('2026-11-14T09:30:00Z')
const MIN = 60_000
const DAYMS = 24 * 60 * MIN
const WEEK = 7 * DAYMS
const iso = (ms: number) => new Date(ms).toISOString()

// Point on a cubic Bézier segment at t.
const bezier = (p0: number, c1: number, c2: number, p1: number, t: number) =>
  (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3 * p1

describe('smoothPath', () => {
  it('AC2: every segment stays between the y values of its two end points', () => {
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
    expect(segments).toHaveLength(4)
    segments.forEach(([, c1y, , c2y, , p1y], i) => {
      const [lo, hi] = [Math.min(pts[i].cy, p1y), Math.max(pts[i].cy, p1y)]
      for (let t = 0; t <= 1.0000001; t += 0.05) {
        const y = bezier(pts[i].cy, c1y, c2y, p1y, t)
        expect(y).toBeGreaterThanOrEqual(lo - 1e-9)
        expect(y).toBeLessThanOrEqual(hi + 1e-9)
      }
    })
  })

  it('returns nothing for fewer than two points', () => {
    expect(smoothPath([{ cx: 1, cy: 2 }])).toBe('')
  })
})

const NOMINAL_97: ChartPoint = { recordedAt: iso(NOW.getTime() - 3 * DAYMS), value: 97, source: 'manual', status: 'nominal' }
const CHECK_92: ChartPoint = { recordedAt: iso(NOW.getTime() - 10 * MIN), value: 92, source: 'manual', status: 'check', rule: SPO2[0] }
const BOX = { left: 0, top: 0, width: 640, height: 236, right: 640, bottom: 236, x: 0, y: 0, toJSON: () => ({}) }

type Props = { points: ChartPoint[]; now?: Date; windowMs?: number }

function setup({ points, now = NOW, windowMs = WEEK }: Props) {
  const view = render(<TrendChart rules={SPO2} points={points} now={now} windowMs={windowMs} />)
  const svg = view.container.querySelector('svg') as SVGSVGElement
  svg.getBoundingClientRect = () => BOX
  const redraw = (next: Props) =>
    view.rerender(<TrendChart rules={SPO2} points={next.points} now={next.now ?? now} windowMs={next.windowMs ?? windowMs} />)
  return { svg, redraw, unmount: view.unmount }
}

const mouse = (clientX: number) => ({ clientX, pointerType: 'mouse' })
const touch = (clientX: number) => ({ clientX, pointerType: 'touch' })
const readout = (svg: SVGSVGElement) => svg.querySelector('.chart-readout')
// Line 1 is the value text, the level icon (no text) and the word; line 2 is the meta text.
const lines = (svg: SVGSVGElement) => {
  const g = readout(svg)
  return g && [[...g.querySelectorAll('.chart-readout-value')].map((t) => t.textContent).join(' '), g.querySelector('.chart-readout-meta')?.textContent]
}
const hoverCircle = (svg: SVGSVGElement) => svg.querySelector('circle.chart-hover')

describe('TrendChart line', () => {
  it('AC1: one path.chart-line, no polyline, through the readings', () => {
    const { svg } = setup({ points: [NOMINAL_97, CHECK_92] })
    const paths = svg.querySelectorAll('path.chart-line')
    expect(paths).toHaveLength(1)
    expect(svg.querySelector('polyline')).toBeNull()
    const d = paths[0].getAttribute('d') as string
    const circles = [...svg.querySelectorAll('circle.chart-point')]
    expect(d.startsWith(`M${circles[0].getAttribute('cx')},${circles[0].getAttribute('cy')} C`)).toBe(true)
    expect(d.endsWith(` ${circles[1].getAttribute('cx')},${circles[1].getAttribute('cy')}`)).toBe(true)
    expect(d.match(/C/g)).toHaveLength(1)
  })

  it('AC3: two readings at the same time give no NaN', () => {
    const { svg } = setup({ points: [NOMINAL_97, CHECK_92, { ...CHECK_92, value: 93 }] })
    expect(svg.querySelector('path.chart-line')?.getAttribute('d')).not.toContain('NaN')
  })

  it('AC4: nominal dots are hidden on a line, every other level keeps r=6', () => {
    const watch: ChartPoint = { ...CHECK_92, status: 'watch', recordedAt: iso(NOW.getTime() - 5 * MIN) }
    const stale: ChartPoint = { ...NOMINAL_97, status: 'stale', recordedAt: iso(NOW.getTime() - 2 * DAYMS) }
    const { svg } = setup({ points: [NOMINAL_97, stale, CHECK_92, watch] })
    const dots = [...svg.querySelectorAll('circle.chart-point')]
    expect(dots.map((c) => c.getAttribute('r'))).toEqual(['0', '6', '6', '6'])
    expect(dots.map((c) => c.getAttribute('class'))).toEqual([
      'chart-point',
      'chart-point chart-point--stale',
      'chart-point chart-point--check',
      'chart-point chart-point--watch',
    ])
  })

  it('AC5: a lone nominal reading keeps a dot of r=4 and has no line', () => {
    const { svg } = setup({ points: [NOMINAL_97] })
    expect(svg.querySelector('circle.chart-point')?.getAttribute('r')).toBe('4')
    expect(svg.querySelector('path.chart-line')).toBeNull()
  })
})

describe('TrendChart readout', () => {
  const points = [NOMINAL_97, CHECK_92]

  it('AC6: crosshair at the 92 % reading and a ring of r=10', () => {
    const { svg } = setup({ points })
    fireEvent.pointerMove(svg, mouse(615))
    const cx = svg.querySelectorAll('circle.chart-point')[1].getAttribute('cx')
    const cross = svg.querySelector('line.chart-crosshair')
    expect([cross?.getAttribute('x1'), cross?.getAttribute('x2'), cross?.getAttribute('y1'), cross?.getAttribute('y2')]).toEqual([cx, cx, '16', '200'])
    expect(hoverCircle(svg)?.getAttribute('class')).toBe('chart-hover')
    expect(hoverCircle(svg)?.getAttribute('r')).toBe('10')
    expect(hoverCircle(svg)?.getAttribute('cx')).toBe(cx)
  })

  it('AC7: value, level icon and word, then age, UTC time and source', () => {
    const { svg } = setup({ points })
    fireEvent.pointerMove(svg, mouse(615))
    expect(lines(svg)).toEqual(['92 % · check', '10 min ago · 14 Nov 09:20 UTC · manual'])
    expect(svg.querySelector('.chart-readout svg.chart-readout-icon')).toHaveClass('tabler-icon-alert-triangle')
  })

  it('AC8: a nominal reading shows only its value and a filled ring', () => {
    const { svg } = setup({ points })
    fireEvent.pointerMove(svg, mouse(200))
    expect(lines(svg)).toEqual(['97 %', '3 d ago · 11 Nov 09:30 UTC · manual'])
    expect(hoverCircle(svg)?.getAttribute('class')).toBe('chart-hover chart-hover--nominal')
    expect(hoverCircle(svg)?.getAttribute('r')).toBe('5')
    expect(svg.querySelector('.chart-readout svg')).toBeNull()
  })

  it('AC9: a stale reading says stale and data age', () => {
    const stale: ChartPoint = { recordedAt: '2026-11-07T09:30:00Z', value: 95, source: 'manual', status: 'stale' }
    const { svg } = setup({ points: [stale], now: new Date('2026-11-14T09:29:00Z') })
    fireEvent.pointerMove(svg, mouse(72))
    expect(lines(svg)).toEqual(['95 % · stale', 'data 6 d old · 7 Nov 09:30 UTC · manual'])
    expect(hoverCircle(svg)?.getAttribute('class')).toBe('chart-hover')
    expect(hoverCircle(svg)?.getAttribute('r')).toBe('10')
  })

  it('AC10: only within the plot range ± 8; a shown readout goes at x 63', () => {
    const { svg } = setup({ points })
    for (const x of [63, 629]) {
      fireEvent.pointerMove(svg, mouse(x))
      expect(readout(svg)).toBeNull()
      expect(svg.querySelector('.chart-crosshair')).toBeNull()
    }
    fireEvent.pointerMove(svg, mouse(64))
    expect(readout(svg)).not.toBeNull()
    fireEvent.pointerMove(svg, mouse(63))
    expect(readout(svg)).toBeNull()
  })

  it('AC11: a mouse leaving the chart clears the readout', () => {
    const { svg } = setup({ points })
    fireEvent.pointerMove(svg, mouse(615))
    fireEvent.pointerLeave(svg, { pointerType: 'mouse' })
    expect(readout(svg)).toBeNull()
    expect(svg.querySelector('.chart-crosshair')).toBeNull()
  })

  it('a mouse pointerdown shows the readout without pinning', () => {
    const { svg } = setup({ points })
    fireEvent.pointerDown(svg, mouse(615))
    expect(readout(svg)).not.toBeNull()
    expect(svg).not.toHaveClass('trend-chart--pinned')
  })

  it('AC12: a touch tap pins the readout through pointerleave', () => {
    const { svg } = setup({ points })
    fireEvent.pointerDown(svg, touch(615))
    fireEvent.pointerUp(svg, touch(615))
    fireEvent.pointerLeave(svg, { pointerType: 'touch' })
    expect(lines(svg)?.[0]).toBe('92 % · check')
    expect(svg).toHaveClass('trend-chart--pinned')
  })

  it('AC13: a touch the browser took as a scroll shows nothing', () => {
    const { svg } = setup({ points })
    fireEvent.pointerDown(svg, touch(615))
    fireEvent.pointerCancel(svg, { pointerType: 'touch' })
    expect(readout(svg)).toBeNull()
    expect(svg).not.toHaveClass('trend-chart--pinned')
  })

  it('AC14: while pinned, a touch move scrubs to the nearest reading', () => {
    const { svg } = setup({ points })
    fireEvent.pointerDown(svg, touch(615))
    fireEvent.pointerUp(svg, touch(615))
    fireEvent.pointerMove(svg, touch(200))
    expect(lines(svg)?.[0]).toBe('97 %')
  })

  it('a touch move without a pin does nothing', () => {
    const { svg } = setup({ points })
    fireEvent.pointerMove(svg, touch(615))
    expect(readout(svg)).toBeNull()
  })

  it('AC15: a touch outside the plot or outside the chart clears the pin', () => {
    const { svg } = setup({ points })
    const pin = () => {
      fireEvent.pointerDown(svg, touch(615))
      fireEvent.pointerUp(svg, touch(615))
      expect(svg).toHaveClass('trend-chart--pinned')
    }
    pin()
    fireEvent.pointerDown(svg, touch(30))
    expect(readout(svg)).toBeNull()
    expect(svg).not.toHaveClass('trend-chart--pinned')
    pin()
    fireEvent.pointerDown(document.body, touch(615))
    expect(readout(svg)).toBeNull()
    expect(svg).not.toHaveClass('trend-chart--pinned')
  })

  it('AC16: a tap while pinned moves the pin', () => {
    const { svg } = setup({ points })
    fireEvent.pointerDown(svg, touch(615))
    fireEvent.pointerUp(svg, touch(615))
    fireEvent.pointerDown(svg, touch(200))
    fireEvent.pointerUp(svg, touch(200))
    expect(lines(svg)?.[0]).toBe('97 %')
    expect(svg).toHaveClass('trend-chart--pinned')
  })

  it('AC17: the readout keeps its reading across a re-read and goes when it leaves the window', () => {
    const { svg, redraw } = setup({ points })
    fireEvent.pointerDown(svg, touch(615))
    fireEvent.pointerUp(svg, touch(615))
    const newer: ChartPoint = { ...CHECK_92, value: 93, recordedAt: iso(NOW.getTime() - 2 * MIN) }
    redraw({ points: [...points, newer] })
    expect(lines(svg)?.[0]).toBe('92 % · check')
    redraw({ points: [NOMINAL_97, newer] })
    expect(readout(svg)).toBeNull()
    expect(svg).not.toHaveClass('trend-chart--pinned')
  })

  it('AC18: two readings at one time show the most severe', () => {
    const at = iso(NOW.getTime() - 10 * MIN)
    const { svg } = setup({ points: [{ ...NOMINAL_97, value: 96, recordedAt: at }, { ...CHECK_92, value: 93, recordedAt: at }] })
    fireEvent.pointerMove(svg, mouse(615))
    expect(lines(svg)?.[0]).toBe('93 % · check')
  })

  it('AC18: on a severity tie the later reading in points order wins', () => {
    const at = iso(NOW.getTime() - 10 * MIN)
    const { svg } = setup({ points: [{ ...CHECK_92, value: 91, recordedAt: at }, { ...CHECK_92, value: 93, recordedAt: at }] })
    fireEvent.pointerMove(svg, mouse(615))
    expect(lines(svg)?.[0]).toBe('93 % · check')
  })

  it('AC19: a box that fits on neither side is clamped to the left edge (38 characters × 9.6 + 24)', () => {
    const only: ChartPoint = { ...NOMINAL_97, recordedAt: iso(NOW.getTime() - 10 * MIN) }
    const { svg } = setup({ points: [only], windowMs: 20 * MIN })
    fireEvent.pointerMove(svg, mouse(346))
    const box = svg.querySelector('rect.chart-readout-box')
    expect(box?.getAttribute('width')).toBe('388.8')
    expect(box?.getAttribute('x')).toBe('0')
  })

  it('AC19: the box takes the measured text length when the browser gives one', () => {
    const { svg } = setup({ points })
    const proto = SVGElement.prototype as unknown as { getComputedTextLength?: () => number }
    proto.getComputedTextLength = () => 100
    try {
      fireEvent.pointerMove(svg, mouse(615))
      // The longest line is line 1: head 100 + gap 9.6 + icon 25.6 + word 100, plus 24.
      expect(svg.querySelector('rect.chart-readout-box')?.getAttribute('width')).toBe('259.2')
    } finally {
      delete proto.getComputedTextLength
    }
  })

  it('AC20: the readout is hidden from assistive tech; titles and label stay', () => {
    const { svg } = setup({ points })
    fireEvent.pointerMove(svg, mouse(615))
    expect(readout(svg)).toHaveAttribute('aria-hidden', 'true')
    expect([...svg.querySelectorAll('circle.chart-point title')].map((t) => t.textContent)).toEqual([
      '97 % · nominal · 11 Nov 09:30 UTC · manual',
      '92 % · check · 14 Nov 09:20 UTC · manual',
    ])
    expect(svg).toHaveAttribute('aria-label', 'SpO₂, last 7 days, 2 readings')
  })

  it('removes the document listener on unpin and on unmount', () => {
    const added = vi.spyOn(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    const { svg, unmount } = setup({ points })
    fireEvent.pointerDown(svg, touch(615))
    fireEvent.pointerUp(svg, touch(615))
    expect(added.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(1)
    fireEvent.pointerDown(svg, touch(30))
    expect(removed.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(1)
    fireEvent.pointerDown(svg, touch(615))
    fireEvent.pointerUp(svg, touch(615))
    unmount()
    expect(removed.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(2)
    vi.restoreAllMocks()
  })
})
