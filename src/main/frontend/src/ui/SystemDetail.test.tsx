import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import type { Observation } from '../domain/observation'
import { CHART_WINDOW_MS } from '../domain/rules'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { RULES } from '../test/rules'
import { pvt, reading, setup as baseSetup, submitSpo2 } from '../test/renderApp'
import { TrendChart } from './TrendChart'

const [SPO01, SPO02] = RULES
const NOW = '2026-11-14T09:30:00Z'
const MIN = 60_000

const setup = (options: Parameters<typeof baseSetup>[0] = {}) => baseSetup({ placeholders: mockStatuses, ...options })
const go = (hash: string) => window.history.replaceState(null, '', hash)
const detail = (system = 'Respiratory') => screen.getByRole('region', { name: `${system} detail` })
const findDetail = (system = 'Respiratory') => screen.findByRole('region', { name: `${system} detail` })
const region = (name: string) => within(detail()).getByRole('region', { name })
const queryRegion = (name: string) => within(detail()).queryByRole('region', { name })
const chart = () => detail().querySelector('svg[role="img"]') as SVGSVGElement
const points = () => [...chart().querySelectorAll('circle.chart-point')]
const titles = () => points().map((p) => p.querySelector('title')?.textContent)
/** The Tabler icon of each `svg.chart-marker`, e.g. "alert-triangle"; a `text.chart-marker` fails it. */
const iconsOf = (scope: Element) => {
  expect(scope.querySelectorAll('text.chart-marker')).toHaveLength(0)
  return [...scope.querySelectorAll('svg.chart-marker')].map((m) => {
    expect(m).toHaveAttribute('aria-hidden', 'true')
    expect(m).toHaveAttribute('width', '18')
    return [...m.classList].find((c) => c.startsWith('tabler-icon-'))?.replace('tabler-icon-', '')
  })
}
const markers = () => iconsOf(chart())
/** Each marker sits at x = cx − 9: the point it belongs to, by its cx. */
const markerCx = (scope: Element) => [...scope.querySelectorAll('svg.chart-marker')].map((m) => Number(m.getAttribute('x')) + 9)

async function openWith(seed: CheckIn[], options: Parameters<typeof baseSetup>[0] = {}) {
  go('#/systems/Respiratory')
  const s = setup({ seed, ...options })
  s.renderApp()
  await within(await findDetail()).findByRole('heading', { level: 2, name: 'Respiratory' })
  return s
}

afterEach(() => {
  vi.useRealTimers()
  go('/')
})

describe('Detail navigation', () => {
  it('AC5: clicking a flagged row opens the detail in place of Home', async () => {
    setup().renderApp()
    await submitSpo2(92)
    await userEvent.click(await screen.findByRole('link', { name: /Respiratory/ }))

    expect(window.location.hash).toBe('#/systems/Respiratory')
    expect(await findDetail()).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Body systems' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Check-in' })).toBeNull()
  })

  it('AC6: the back link returns Home and focuses the Body systems heading', async () => {
    await openWith([reading('a', NOW, 92)])

    expect(within(detail()).getByRole('link', { name: '← Body systems' })).toHaveAttribute('href', '#/')
    act(() => {
      go('#/')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    const heading = await screen.findByRole('heading', { name: 'Body systems' })
    expect(screen.queryByRole('region', { name: 'Respiratory detail' })).toBeNull()
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(heading).toHaveFocus()
  })

  it('AC7: a hash at load opens the detail under the header and connection pill', async () => {
    await openWith([reading('a', NOW, 92)])

    expect(screen.getByRole('heading', { level: 1, name: 'Health' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Online')
  })

  it.each(['#/systems/Sleep', '#/systems/Nope', '#/systems/%E0%A4%A', '#/foo', '#/systems/Respiratory/x'])(
    'AC8: %s at load goes Home with hash #/ and no focus move',
    async (hash) => {
      go(hash)
      setup().renderApp()

      expect(await screen.findByRole('region', { name: 'Body systems' })).toBeInTheDocument()
      await waitFor(() => expect(window.location.hash).toBe('#/'))
      expect(document.activeElement).toBe(document.body)
    },
  )

  it('AC9: focus moves to the detail heading once, not on re-reads', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    await openWith([reading('a', NOW, 92)])

    const heading = within(detail()).getByRole('heading', { level: 2, name: 'Respiratory' })
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(heading).toHaveFocus()

    const back = within(detail()).getByRole('link', { name: '← Body systems' })
    back.focus()
    act(() => vi.advanceTimersByTime(60_000))
    await act(async () => {})
    expect(back).toHaveFocus()
  })

  it('AC9: clicking the row link also focuses the detail heading', async () => {
    setup().renderApp()
    await submitSpo2(92)
    await userEvent.click(await screen.findByRole('link', { name: /Respiratory/ }))

    expect(await within(await findDetail()).findByRole('heading', { level: 2, name: 'Respiratory' })).toHaveFocus()
  })

  it('AC10: an empty hash shows Home and stays empty', async () => {
    go('/')
    setup().renderApp()

    expect(await screen.findByRole('region', { name: 'Body systems' })).toBeInTheDocument()
    expect(window.location.hash).toBe('')
  })
})

describe('Detail header and panels', () => {
  it('AC11: caution header with value, age and source', async () => {
    await openWith([reading('a', new Date(Date.parse(NOW) - 10 * MIN).toISOString(), 92)])

    expect(detail()).toHaveTextContent('Check')
    expect(detail()).toHaveTextContent('SpO₂ 92 % · 10 min ago · manual')
  })

  it('AC12: emergency header with the icon and the word', async () => {
    await openWith([reading('a', NOW, 88)])

    const badge = detail().querySelector('.badge') as HTMLElement
    expect(badge.className).toBe('badge badge--emergency')
    expect(badge).toHaveTextContent('Emergency')
    expect(detail()).toHaveTextContent('SpO₂ 88 % · just now · manual')
  })

  it('AC13: Explanation lists what, why, how decided and source with the rule tag', async () => {
    await openWith([reading('a', NOW, 92)])

    const explanation = region('Explanation')
    expect([...explanation.querySelectorAll('dt')].map((d) => d.textContent)).toEqual(['What', 'Why it matters', 'How decided', 'Source'])
    const values = [...explanation.querySelectorAll('dd')]
    expect(values.slice(0, 3).map((d) => d.textContent)).toEqual([SPO01.what, SPO01.why, SPO01.howDecided])
    expect(values[3]).toHaveTextContent(SPO01.source)
    expect(values[3].querySelector('.tag.tag--rule')).toHaveTextContent('rule · SPO-01')
  })

  it('AC14: What next shows the rule next step', async () => {
    await openWith([reading('a', NOW, 92)])

    expect(region('What next')).toHaveTextContent(SPO01.next)
  })

  const tiers = () => within(region('Who to involve')).getAllByRole('listitem')
  const current = () => tiers().filter((li) => li.getAttribute('aria-current') === 'true').map((li) => li.textContent)

  it('AC15: Who to involve lists the four tiers with CMO selected', async () => {
    await openWith([reading('a', NOW, 92)])

    expect(region('Who to involve').querySelector('ol')).not.toBeNull()
    expect(tiers().map((li) => li.textContent)).toEqual(['Self-care', 'CMO', 'Medical conference', 'Urgent ground'])
    expect(current()).toEqual(['CMO'])
  })

  it('AC16: SpO₂ 88 shows SPO-02 and selects Urgent ground', async () => {
    await openWith([reading('a', NOW, 88)])

    ;[SPO02.what, SPO02.why, SPO02.howDecided].forEach((t) => expect(region('Explanation')).toHaveTextContent(t))
    expect(region('Explanation')).toHaveTextContent('rule · SPO-02')
    expect(region('What next')).toHaveTextContent(SPO02.next)
    expect(current()).toEqual(['Urgent ground'])
  })

  it('AC17: a tier outside the four labels selects none', async () => {
    await openWith([reading('a', NOW, 92)], { rules: [{ ...SPO01, tier: 'Ground' }, SPO02] })

    expect(tiers()).toHaveLength(4)
    expect(current()).toEqual([])
  })
})

describe('Detail when not flagged', () => {
  const noPanels = () => ['Explanation', 'What next', 'Who to involve'].forEach((n) => expect(queryRegion(n)).toBeNull())

  it('AC18: nominal shows the reading and no action panels', async () => {
    await openWith([reading('a', NOW, 96)])

    expect(detail()).toHaveTextContent('✓ Nominal')
    expect(detail()).toHaveTextContent('SpO₂ 96 % · just now · manual')
    expect(detail()).toHaveTextContent('Nothing to act on now.')
    noPanels()
  })

  it('AC19: no data shows the empty chart message', async () => {
    await openWith([])

    expect(detail()).toHaveTextContent('No data')
    expect(detail()).toHaveTextContent('Nothing to act on now.')
    expect(region('SpO₂ · last 7 days')).toHaveTextContent('No readings in the last 7 days')
    expect(chart()).toBeNull()
    noPanels()
  })

  it('AC20: a stale reading shows a hollow point and no marker', async () => {
    await openWith([reading('a', '2026-11-13T09:29:00Z', 88)])

    expect(detail()).toHaveTextContent('No recent data')
    expect(detail()).toHaveTextContent('SpO₂ 88 % · data 1 d old · manual')
    expect(detail()).toHaveTextContent('Nothing to act on now.')
    expect(points().map((p) => p.getAttribute('class'))).toEqual(['chart-point chart-point--stale'])
    expect(titles()).toEqual(['88 % · stale · 13 Nov 09:29 UTC · manual'])
    expect(markers()).toEqual([])
  })

  it('AC21: a re-read after 60 s turns the detail nominal', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const s = await openWith([reading('a', NOW, 92)])
    s.clock.now = new Date(Date.parse(NOW) + MIN)
    s.repository.items.set('b', { checkIn: reading('b', s.clock.now.toISOString(), 96), pending: false })

    act(() => vi.advanceTimersByTime(60_000))

    expect(await within(detail()).findByText('✓ Nominal')).toBeInTheDocument()
    expect(queryRegion('Explanation')).toBeNull()
  })
})

describe('Detail chart', () => {
  const week = () => [reading('a', '2026-11-08T08:00:00Z', 97), reading('b', '2026-11-13T08:15:00Z', 93), reading('c', '2026-11-14T09:20:00Z', 92)]

  it('AC22: one point per reading in the window, titled, oldest first', async () => {
    await openWith(week())

    expect(region('SpO₂ · last 7 days').querySelectorAll('svg[role="img"]')).toHaveLength(1)
    expect(chart()).toHaveAttribute('aria-label', 'SpO₂, last 7 days, 3 readings')
    expect(titles()).toEqual([
      '97 % · nominal · 8 Nov 08:00 UTC · manual',
      '93 % · check · 13 Nov 08:15 UTC · manual',
      '92 % · check · 14 Nov 09:20 UTC · manual',
    ])
  })

  it('AC23, #33 AC4: check points carry the class, their run one check marker; one data line', async () => {
    await openWith(week())

    expect(points().map((p) => p.getAttribute('class'))).toEqual([
      'chart-point',
      'chart-point chart-point--check',
      'chart-point chart-point--check',
    ])
    expect(markers()).toEqual(['alert-triangle'])
    expect(markerCx(chart())).toEqual([Number(points()[2].getAttribute('cx'))])
    expect(chart().querySelectorAll('polyline')).toHaveLength(1)
  })

  it('AC24, #43 AC9: an emergency point carries the class and an emergency marker', async () => {
    await openWith([reading('a', NOW, 88)])

    expect(points().map((p) => p.getAttribute('class'))).toEqual(['chart-point chart-point--emergency'])
    expect(markers()).toEqual(['alert-octagon'])
  })

  it('#33 AC3: SpO₂ 97, 93, 88 → a check and an emergency marker', async () => {
    await openWith([reading('a', '2026-11-08T08:00:00Z', 97), reading('b', '2026-11-13T08:15:00Z', 93), reading('c', '2026-11-14T09:20:00Z', 88)])

    expect(markers()).toEqual(['alert-triangle', 'alert-octagon'])
  })

  it('#33 AC4: one marker per run of same-level points in the 1-minute window', async () => {
    const at = (s: number, value: number) => reading(`r${s}`, `2026-11-14T09:20:0${s}Z`, value)
    await openWith([at(0, 92), at(1, 92), at(2, 92), at(3, 97), at(4, 92)], { now: '2026-11-14T09:20:05Z', chartWindowMs: MIN })

    const classes = points().map((p) => p.getAttribute('class'))
    expect(classes.filter((c) => c === 'chart-point chart-point--check')).toHaveLength(4)
    expect(classes.filter((c) => c === 'chart-point')).toHaveLength(1)
    expect(markers()).toEqual(['alert-triangle', 'alert-triangle'])
    expect(markerCx(chart())).toEqual([2, 4].map((i) => Number(points()[i].getAttribute('cx'))))
  })

  it('#33 AC4: a stale newest point ends the run and has no marker', async () => {
    await openWith([reading('a', '2026-11-12T08:00:00Z', 92), reading('b', '2026-11-12T09:00:00Z', 92), reading('c', '2026-11-13T08:00:00Z', 92)])

    expect(points()[2]).toHaveAttribute('class', 'chart-point chart-point--stale')
    expect(markers()).toEqual(['alert-triangle'])
    expect(markerCx(chart())).toEqual([Number(points()[1].getAttribute('cx'))])
  })

  it('#33 AC4: two watch points of different rules are two runs, each with its arrow', () => {
    const BP01 = RULES.find((r) => r.id === 'BP-01')!
    const T01 = { ...BP01, id: 'T-01', above: undefined, below: 100 }
    const point = (s: number, value: number, rule: typeof BP01) =>
      ({ recordedAt: `2026-11-14T09:20:0${s}Z`, value, source: 'manual', status: 'watch', rule }) as const
    const { container } = render(
      <TrendChart rules={[BP01, T01]} points={[point(0, 125, BP01), point(1, 95, T01)]} now={new Date('2026-11-14T09:20:05Z')} windowMs={MIN} />,
    )

    expect(iconsOf(container)).toEqual(['trending-up', 'trending-down'])
  })

  it('#33 AC3: a watch point with no rule has no marker', () => {
    const BP01 = RULES.find((r) => r.id === 'BP-01')!
    const { container } = render(
      <TrendChart rules={[BP01]} points={[{ recordedAt: NOW, value: 125, source: 'manual', status: 'watch' }]} now={new Date(NOW)} windowMs={CHART_WINDOW_MS} />,
    )

    expect(iconsOf(container)).toEqual([])
  })

  it.each([
    [400, 12],
    [312, -30],
  ])('#33 AC5: the Cognition marker of PVT %s sits at cy %s', (ms, offset) => {
    const COG01 = RULES.find((r) => r.id === 'COG-01')!
    const { container } = render(
      <TrendChart
        rules={[COG01]}
        points={[{ recordedAt: '2026-11-14T09:20:00Z', value: ms, source: 'in-app test', status: 'check', rule: COG01 }]}
        now={new Date(NOW)}
        windowMs={CHART_WINDOW_MS}
      />,
    )
    const point = container.querySelector('circle.chart-point')!
    const marker = container.querySelector('svg.chart-marker')!

    expect(Number(marker.getAttribute('x'))).toBeCloseTo(Number(point.getAttribute('cx')) - 9)
    expect(Number(marker.getAttribute('y'))).toBeCloseTo(Number(point.getAttribute('cy')) + offset)
  })

  it('#33 AC6: a stale SpO₂ 92 is hollow with no marker', async () => {
    await openWith([reading('a', '2026-11-13T08:00:00Z', 92)])

    expect(points().map((p) => p.getAttribute('class'))).toEqual(['chart-point chart-point--stale'])
    expect(chart().querySelectorAll('svg.chart-marker')).toHaveLength(0)
    expect(chart().querySelectorAll('text.chart-marker')).toHaveLength(0)
  })

  it('#43 AC9: watch and treat points on the Cardiovascular chart, with trending-up and first-aid-kit markers and level-word threshold labels', async () => {
    const bp = (id: string, minutesAgo: number, systolic: number): Observation => ({
      resourceType: 'Observation', id: `bp-cuff:${id}:systolicMmHg`, status: 'final', code: { text: 'systolicMmHg' },
      valueQuantity: { value: systolic, unit: 'mmHg' }, effectiveDateTime: new Date(Date.parse(NOW) - minutesAgo * MIN).toISOString(),
      device: { display: 'BP cuff · synthetic' },
    })
    go('#/systems/Cardiovascular')
    setup({ observationSeed: [bp('a', 30, 110), bp('b', 20, 120), bp('c', 10, 145)] }).renderApp()
    await within(await findDetail('Cardiovascular')).findByRole('heading', { level: 2, name: 'Cardiovascular' })
    const bpChart = detail('Cardiovascular').querySelector('svg[role="img"]') as SVGSVGElement

    expect(detail('Cardiovascular').querySelector('.detail-title .badge')).toHaveTextContent('Treat')
    expect([...bpChart.querySelectorAll('circle.chart-point')].map((p) => p.getAttribute('class'))).toEqual([
      'chart-point',
      'chart-point chart-point--watch',
      'chart-point chart-point--treat',
    ])
    expect(iconsOf(bpChart)).toEqual(['trending-up', 'first-aid-kit'])
    expect(bpChart).toHaveTextContent('BP-01 · > 119 mmHg watch')
    expect(bpChart).toHaveTextContent('BP-04 · > 139 mmHg treat')
  })

  it('#43 AC9: a watch point of a "below" row gets trending-down', () => {
    const rule = { ...RULES.find((r) => r.id === 'CV-02')!, id: 'T-01', status: 'watch' as const }
    const { container } = render(
      <TrendChart rules={[rule]} points={[{ recordedAt: NOW, value: 38, source: 'manual', status: 'watch', rule }]} now={new Date(NOW)} windowMs={CHART_WINDOW_MS} />,
    )

    expect(iconsOf(container)).toEqual(['trending-down'])
  })

  it('AC25: threshold labels and the fixed 80–100 % grid', async () => {
    await openWith(week())

    expect(chart()).toHaveTextContent('SPO-01 · < 94 % check')
    expect(chart()).toHaveTextContent('SPO-02 · < 90 % emergency')
    const grid = [...chart().querySelectorAll('line.chart-grid')]
    expect(grid.map((l) => l.getAttribute('data-value'))).toEqual(['80', '85', '90', '95', '100'])
    ;['80 %', '85 %', '90 %', '95 %', '100 %'].forEach((label) => expect(within(chart() as unknown as HTMLElement).getByText(label)).toBeInTheDocument())
  })

  it('AC26: X labels at the UTC midnights in the window', async () => {
    await openWith(week())

    ;['8 Nov', '9 Nov', '10 Nov', '11 Nov', '12 Nov', '13 Nov', '14 Nov'].forEach((label) =>
      expect(within(chart() as unknown as HTMLElement).getByText(label)).toBeInTheDocument(),
    )
  })

  it('AC27: the window starts exactly 7 days back; one (stale) point, singular label, no line', async () => {
    await openWith([reading('a', '2026-11-07T09:29:00Z', 96), reading('b', '2026-11-07T09:30:00Z', 95)])

    expect(titles()).toEqual(['95 % · stale · 7 Nov 09:30 UTC · manual'])
    expect(chart()).toHaveAttribute('aria-label', 'SpO₂, last 7 days, 1 reading')
    expect(chart().querySelector('polyline')).toBeNull()
  })

  it('AC28: a value below 80 sits on the 80 % line', async () => {
    await openWith([reading('a', NOW, 75)])

    expect(titles()).toEqual(['75 % · emergency · 14 Nov 09:30 UTC · manual'])
    const floor = chart().querySelector('line.chart-grid[data-value="80"]')
    expect(points()[0].getAttribute('cy')).toBe(floor?.getAttribute('y1'))
  })

  it('AC29: out-of-range values are not drawn', async () => {
    const at = new Date(Date.parse(NOW) - 60 * MIN).toISOString()
    await openWith([reading('a', at, 101), reading('b', at, 40), reading('c', at, 95)])

    expect(points()).toHaveLength(1)
  })

  it('AC30: a check-in without SpO₂ means no data and no chart', async () => {
    await openWith([{ id: 'a', recordedAt: NOW, heartRateBpm: 70, symptoms: [] }])

    expect(detail()).toHaveTextContent('No data')
    expect(detail()).toHaveTextContent('No readings in the last 7 days')
  })

  it('AC12 (#28): the SpO₂ chart has no baseline line', async () => {
    await openWith(week())

    expect(chart().querySelector('.chart-baseline')).toBeNull()
    expect(chart()).not.toHaveTextContent('pre-flight normal')
  })
})

describe('Detail chart in DEMO_MODE (#43)', () => {
  const DEMO_NOW = '2026-11-14T09:31:07Z'
  const xLabels = () => [...chart().querySelectorAll('text.chart-label[y="228"]')]

  it('AC23: a 1-minute window: 2 points, five time labels, the last one end-anchored, no date, minute title and label', async () => {
    await openWith([reading('a', '2026-11-14T09:30:06Z', 97), reading('b', '2026-11-14T09:30:08Z', 96), reading('c', DEMO_NOW, 92)], {
      now: DEMO_NOW,
      chartWindowMs: 60_000,
    })

    expect(points()).toHaveLength(2)
    expect(xLabels().map((t) => t.textContent)).toEqual(['09:30:07', '09:30:22', '09:30:37', '09:30:52', '09:31:07'])
    expect(xLabels().map((t) => t.getAttribute('text-anchor'))).toEqual(['middle', 'middle', 'middle', 'middle', 'end'])
    expect([...chart().querySelectorAll('text.chart-label')].filter((t) => /Nov/.test(t.textContent ?? ''))).toEqual([])
    expect(region('SpO₂ · last minute')).toContainElement(chart() as unknown as HTMLElement)
    expect(chart()).toHaveAttribute('aria-label', 'SpO₂, last minute, 2 readings')
  })

  it('AC23: no reading in the last minute shows the empty text', async () => {
    await openWith([reading('a', '2026-11-14T09:30:06Z', 97)], { now: DEMO_NOW, chartWindowMs: 60_000 })

    expect(region('SpO₂ · last minute')).toHaveTextContent('No readings in the last minute')
    expect(chart()).toBeNull()
  })

  it('AC24: the 7-day window keeps midnight labels, its title, aria-label and empty text', async () => {
    await openWith([reading('a', '2026-11-13T08:15:00Z', 93)])

    expect(xLabels().map((t) => t.textContent)).toEqual(['8 Nov', '9 Nov', '10 Nov', '11 Nov', '12 Nov', '13 Nov', '14 Nov'])
    expect(region('SpO₂ · last 7 days')).toContainElement(chart() as unknown as HTMLElement)
    expect(chart()).toHaveAttribute('aria-label', 'SpO₂, last 7 days, 1 reading')
  })
})

describe('Detail errors and offline', () => {
  type S = ReturnType<typeof setup>
  const failures: [string, (s: S, fail: boolean) => void][] = [
    ['rules', (s, fail) => void (s.ruleSource.fail = fail)],
    ['history', (s, fail) => void (s.repository.failList = fail)],
  ]

  it.each(failures)('AC35: when the %s fail, shows "Detail unavailable" and keeps the hash', async (_, setFail) => {
    for (const system of ['Respiratory', 'Nope']) {
      go(`#/systems/${system}`)
      const s = setup()
      setFail(s, true)
      const { unmount } = s.renderApp()

      expect(await within(await findDetail(system)).findByText('Detail unavailable')).toBeInTheDocument()
      expect(within(detail(system)).getByRole('link', { name: '← Body systems' })).toBeInTheDocument()
      expect(window.location.hash).toBe(`#/systems/${system}`)
      unmount()
    }
  })

  it.each(failures)('AC36: recovers from a %s failure on the next 60 s re-read', async (_, setFail) => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    go('#/systems/Respiratory')
    const s = setup({ seed: [reading('a', NOW, 92)] })
    setFail(s, true)
    s.renderApp()
    expect(await within(await findDetail()).findByText('Detail unavailable')).toBeInTheDocument()

    setFail(s, false)
    act(() => vi.advanceTimersByTime(60_000))

    expect(await within(detail()).findByText('Check')).toBeInTheDocument()
  })

  it('AC37: while loading, the back link shows and no heading', async () => {
    go('#/systems/Respiratory')
    const s = setup()
    vi.spyOn(s.statusReader, 'readDetail').mockReturnValue(new Promise(() => {}))
    s.renderApp()

    const shell = await findDetail()
    expect(within(shell).getByRole('link', { name: '← Body systems' })).toBeInTheDocument()
    expect(within(shell).queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('AC38: works offline without calling the gateway', async () => {
    const s = setup({ online: false })
    s.renderApp()
    await submitSpo2(92)
    fireEvent.click(await screen.findByRole('link', { name: /Respiratory/ }))

    expect(await within(await findDetail()).findByText('Check')).toBeInTheDocument()
    expect(s.gateway.sent).toHaveLength(0)
  })
})

describe('Cognition detail (#17)', () => {
  const at = (iso: string, ms: number) => pvt(iso, iso, ms)
  const ago = (ms: number) => new Date(Date.parse(NOW) - ms).toISOString()
  async function openCognition(seed: CheckIn[]) {
    go('#/systems/Cognition')
    setup({ seed }).renderApp()
    await within(await findDetail('Cognition')).findByRole('heading', { level: 2, name: 'Cognition' })
  }
  const cog = (name: string) => within(detail('Cognition')).getByRole('region', { name })
  const cogChart = () => detail('Cognition').querySelector('svg[role="img"]') as SVGSVGElement
  const cogPoints = () => [...cogChart().querySelectorAll('circle.chart-point')]
  const COG01 = RULES.find((r) => r.id === 'COG-01')!
  const week = () => [at('2026-11-10T09:00:00Z', 268), at('2026-11-14T09:20:00Z', 312)]

  it('AC12: caution header, explanation, what next and the CMO tier', async () => {
    await openCognition(week())

    expect(detail('Cognition')).toHaveTextContent('Check')
    expect(detail('Cognition')).toHaveTextContent('PVT median 312 ms · 10 min ago · in-app test')
    const values = [...cog('Explanation').querySelectorAll('dd')]
    expect(values.slice(0, 3).map((d) => d.textContent)).toEqual([COG01.what, COG01.why, COG01.howDecided])
    expect(values[3]).toHaveTextContent(COG01.source)
    expect(values[3].querySelector('.tag.tag--rule')).toHaveTextContent('rule · COG-01')
    expect(cog('What next')).toHaveTextContent(COG01.next)
    const current = within(cog('Who to involve'))
      .getAllByRole('listitem')
      .filter((li) => li.getAttribute('aria-current') === 'true')
      .map((li) => li.textContent)
    expect(current).toEqual(['CMO'])
  })

  it('AC13: the PVT chart with titles, the COG-01 line and the 200–400 ms grid', async () => {
    await openCognition(week())

    expect(cog('PVT median · last 7 days').querySelector('svg[role="img"]')).toBe(cogChart())
    expect(cogChart()).toHaveAttribute('aria-label', 'PVT median, last 7 days, 2 readings')
    expect(cogPoints().map((p) => p.querySelector('title')?.textContent)).toEqual([
      '268 ms · nominal · 10 Nov 09:00 UTC · in-app test',
      '312 ms · check · 14 Nov 09:20 UTC · in-app test',
    ])
    expect(cogChart()).toHaveTextContent('COG-01 · > 304.75 ms check')
    expect([...cogChart().querySelectorAll('line.chart-grid')].map((l) => l.getAttribute('data-value'))).toEqual([
      '200', '250', '300', '350', '400',
    ])
  })

  it('AC14: a PVT older than 4 days is stale on the detail too', async () => {
    await openCognition([pvt('p', ago(4 * 24 * 60 * MIN + MIN), 312)])

    expect(detail('Cognition')).toHaveTextContent('No recent data')
    expect(detail('Cognition')).toHaveTextContent('PVT median 312 ms · data 4 d old · in-app test')
    expect(detail('Cognition')).toHaveTextContent('Nothing to act on now.')
    expect(cogPoints().map((p) => p.getAttribute('class'))).toEqual(['chart-point chart-point--stale'])
  })

  const baselineLine = () => cogChart().querySelector('line.chart-baseline')
  const baselineLabel = () =>
    [...cogChart().querySelectorAll('text.chart-label')].find((t) => t.textContent === 'your pre-flight normal · 265 ms · synthetic')

  it.each([
    ['current', () => week()],
    ['stale', () => [pvt('p', ago(4 * 24 * 60 * MIN + MIN), 312)]],
  ])('AC10 (#28): with %s readings the chart shows the 265 ms baseline line and label', async (_, seed) => {
    await openCognition(seed())

    const grid = (v: number) => Number(cogChart().querySelector(`line.chart-grid[data-value="${v}"]`)?.getAttribute('y1'))
    const y265 = grid(250) + ((grid(300) - grid(250)) * 15) / 50
    expect(baselineLine()).toHaveAttribute('data-value', '265')
    expect(Number(baselineLine()?.getAttribute('y1'))).toBeCloseTo(y265)
    expect(baselineLabel()).toHaveAttribute('text-anchor', 'end')
    expect(baselineLabel()).toHaveAttribute('x', baselineLine()?.getAttribute('x2'))
    expect(Number(baselineLabel()?.getAttribute('y'))).toBeCloseTo(y265 + 16)
    expect(cogChart()).toHaveTextContent('COG-01 · > 304.75 ms check')
  })

  it('AC11 (#28): no PVT readings shows no chart and no baseline', async () => {
    await openCognition([])

    expect(detail('Cognition')).toHaveTextContent('No data')
    expect(detail('Cognition').querySelector('svg[role="img"]')).toBeNull()
    expect(detail('Cognition')).not.toHaveTextContent('pre-flight normal')
  })

  it('AC15: a PVT above 400 ms sits on the 400 ms line with its real value in the title', async () => {
    await openCognition([pvt('p', NOW, 450)])

    const top = cogChart().querySelector('line.chart-grid[data-value="400"]')
    expect(cogPoints()[0].getAttribute('cy')).toBe(top?.getAttribute('y1'))
    expect(cogPoints()[0].querySelector('title')).toHaveTextContent('450 ms')
  })
})
