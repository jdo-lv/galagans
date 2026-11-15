import { act, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Rule, SystemStatus } from '../domain/rules'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { RULES } from '../test/rules'
import { pvt, reading, setup, submitSpo2 } from '../test/renderApp'
import { Badge } from './SystemStatusList'

const [SPO01, SPO02] = RULES
const texts = (rule: Rule) => [rule.what, rule.why, rule.howDecided, rule.next]
const MIN = 60_000
const HOUR = 60 * MIN

const list = () => screen.getByRole('region', { name: 'Body systems' })
// The Respiratory row; since #17 Cognition is a rule-backed row too.
const row = () => {
  const found = within(list())
    .getAllByRole('listitem')
    .find((li) => li.querySelector('.status-system')?.textContent === 'Respiratory')
  if (!found) throw new Error('no Respiratory row')
  return found
}

function expectNoStatusIcon(element: HTMLElement) {
  expect(element.querySelector('svg')).toBeNull()
  expect(element).not.toHaveTextContent(/[✓▲]/)
}

function expectNoExplanation(element: HTMLElement) {
  ;[...texts(SPO01), ...texts(SPO02)].forEach((text) => expect(element).not.toHaveTextContent(text))
}

describe('SystemStatusList', () => {
  afterEach(() => vi.useRealTimers())

  it('AC1: shows Respiratory with no data and no icon when nothing valid is stored', async () => {
    setup().renderApp()

    await vi.waitFor(() => expect(row()).toHaveTextContent('No data'))
    // Respiratory, Cognition (COG-01, #17), Cabin air, Radiation, Cardiovascular and Immune (#43), all with no data.
    expect(within(list()).getAllByRole('listitem')).toHaveLength(6)
    expect(row()).toHaveTextContent('Respiratory')
    expectNoStatusIcon(row())
  })

  it('AC2: shows a quiet nominal row after submitting SpO₂ 96', async () => {
    setup().renderApp()
    await submitSpo2(96)

    expect(await within(list()).findByText('✓ Nominal')).toBeInTheDocument()
    expect(row()).toHaveTextContent('SpO₂ 96 %')
    expect(row()).toHaveTextContent('just now · manual')
    expect(row()).toHaveClass('status-nominal')
    expectNoExplanation(row())
  })

  it('AC3: 94 is nominal', async () => {
    setup().renderApp()
    await submitSpo2(94)

    expect(await within(list()).findByText('✓ Nominal')).toBeInTheDocument()
  })

  it('AC4: 92 is caution; the explanation lives on the detail screen (#9)', async () => {
    setup().renderApp()
    await submitSpo2(92)

    expect(await within(list()).findByText('Check')).toBeInTheDocument()
    expect(row()).toHaveClass('status-check')
    expectNoExplanation(row())
  })

  it('AC5: 90 is caution', async () => {
    setup().renderApp()
    await submitSpo2(90)

    expect(await within(list()).findByText('Check')).toBeInTheDocument()
  })

  it('AC6: 88 is an emergency with its icon; the explanation lives on the detail screen (#9)', async () => {
    setup().renderApp()
    await submitSpo2(88)

    expect(await within(list()).findByText('Emergency')).toBeInTheDocument()
    expect(row()).toHaveClass('status-emergency')
    expectNoExplanation(row())
  })

  it('AC7: a later check-in without SpO₂ keeps the warning', async () => {
    setup({
      now: '2026-11-14T10:00:00Z',
      seed: [reading('a', '2026-11-14T08:00:00Z', 88), reading('b', '2026-11-14T10:00:00Z')],
    }).renderApp()

    expect(await within(list()).findByText('Emergency')).toBeInTheDocument()
    expect(row()).toHaveTextContent('SpO₂ 88 %')
    expect(row()).toHaveTextContent('2 h ago · manual')
  })

  it('AC8: the newest reading wins', async () => {
    setup({ seed: [reading('a', '2026-11-14T08:00:00Z', 88), reading('b', '2026-11-14T09:00:00Z', 97)] }).renderApp()

    expect(await within(list()).findByText('✓ Nominal')).toBeInTheDocument()
    expect(row()).toHaveTextContent('SpO₂ 97 %')
  })

  it('AC9: a reading older than 24 h shows as stale, with no icon or explanation', async () => {
    setup({ now: '2026-11-14T08:01:00Z', seed: [reading('a', '2026-11-13T08:00:00Z', 88)] }).renderApp()

    expect(await within(list()).findByText('No recent data')).toBeInTheDocument()
    expect(row()).toHaveClass('status-stale')
    expect(row()).toHaveTextContent('SpO₂ 88 %')
    expect(row()).toHaveTextContent('data 1 d old · manual')
    expectNoStatusIcon(row())
    expectNoExplanation(row())
  })

  it('AC9: a reading exactly 24 h old still shows its warning', async () => {
    setup({ now: '2026-11-14T08:00:00Z', seed: [reading('a', '2026-11-13T08:00:00Z', 88)] }).renderApp()

    expect(await within(list()).findByText('Emergency')).toBeInTheDocument()
  })

  it('AC10: an out-of-range newer value is ignored', async () => {
    setup({ seed: [reading('a', '2026-11-14T09:00:00Z', 0), reading('b', '2026-11-14T08:00:00Z', 92)] }).renderApp()

    expect(await within(list()).findByText('Check')).toBeInTheDocument()
    expect(row()).toHaveTextContent('SpO₂ 92 %')
  })

  it('AC11: only an out-of-range value means no data', async () => {
    setup({ seed: [reading('a', '2026-11-14T09:00:00Z', 120)] }).renderApp()

    await vi.waitFor(() => expect(row()).toHaveTextContent('No data'))
  })

  it('AC12: warns offline without calling the gateway', async () => {
    const { gateway, renderApp } = setup({ online: false })
    renderApp()
    await submitSpo2(88)

    expect(await within(list()).findByText('Emergency')).toBeInTheDocument()
    expect(gateway.sent).toHaveLength(0)
  })

  it.each([
    ['rules', (s: ReturnType<typeof setup>, fail: boolean) => void (s.ruleSource.fail = fail)],
    ['history', (s: ReturnType<typeof setup>, fail: boolean) => void (s.repository.failList = fail)],
  ])('AC14: shows "Status unavailable" when the %s fail, still saves, and re-reads on the next save', async (_, setFail) => {
    const s = setup()
    setFail(s, true)
    s.renderApp()

    expect(await within(list()).findByText('Status unavailable')).toBeInTheDocument()
    expect(within(list()).queryByRole('listitem')).toBeNull()
    expect(list().querySelector('svg')).toBeNull()

    await submitSpo2(96)
    await vi.waitFor(() => expect(s.repository.items.size).toBe(1))
    expect(within(list()).getByText('Status unavailable')).toBeInTheDocument()

    setFail(s, false)
    await submitSpo2(96)
    expect(await within(list()).findByText('✓ Nominal')).toBeInTheDocument()
  })

  it('AC15: shows the heading with no rows while the reader is pending', async () => {
    const s = setup()
    vi.spyOn(s.ruleSource, 'load').mockReturnValue(new Promise(() => {}))
    s.renderApp()

    expect(screen.getByRole('heading', { name: 'Body systems' })).toBeInTheDocument()
    expect(within(list()).queryByRole('listitem')).toBeNull()
  })

  it('AC16: re-reads every 60 s and updates the age, then the stale state', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const s = setup({ now: '2026-11-14T09:30:00Z', seed: [reading('a', '2026-11-14T09:30:00Z', 88)] })
    s.renderApp()
    expect(await within(list()).findByText('just now · manual')).toBeInTheDocument()

    s.clock.now = new Date(s.clock.now.getTime() + MIN)
    act(() => vi.advanceTimersByTime(60_000))
    expect(await within(list()).findByText('1 min ago · manual')).toBeInTheDocument()

    s.clock.now = new Date(s.clock.now.getTime() + 24 * HOUR)
    act(() => vi.advanceTimersByTime(60_000))
    expect(await within(list()).findByText('No recent data')).toBeInTheDocument()
    expect(row()).toHaveClass('status-stale')
    expect(row()).toHaveTextContent('data 1 d old · manual')
    expectNoStatusIcon(row())
  })
})

describe('Body systems with placeholders (#4)', () => {
  const systemNames = (rows: HTMLElement[]) => rows.map((r) => r.querySelector('.status-system')?.textContent)

  it('AC1: lists the rule-driven systems (No data) then the placeholders in mockup order', async () => {
    setup({ placeholders: mockStatuses }).renderApp()

    const rows = await within(list()).findAllByRole('listitem')
    expect(systemNames(rows)).toEqual([
      'Respiratory',
      'Cognition',
      'Cabin air',
      'Radiation',
      'Cardiovascular',
      'Immune',
      'Sleep',
      'Bone & muscle',
      'Vision (SANS)',
      'Kidney & hydration',
    ])
    expect(within(rows[0]).getByText('No data')).toBeInTheDocument()
  })

  it('AC2: SpO₂ 88 warns on Respiratory while the placeholders stay nominal (the other rule systems have no data)', async () => {
    setup({ placeholders: mockStatuses }).renderApp()
    await submitSpo2(88)

    expect(await within(list()).findByText('Emergency')).toBeInTheDocument()
    const [respiratory, ...others] = within(list()).getAllByRole('listitem')
    expectNoExplanation(respiratory)
    expect(others).toHaveLength(9)
    const ruleSystems = others.slice(0, 5)
    const placeholders = others.slice(5)
    for (const row of ruleSystems) expect(within(row).getByText('No data')).toBeInTheDocument()
    placeholders.forEach((r) => expect(within(r).getByText('✓ Nominal')).toBeInTheDocument())
  })

  it.each([
    ['Sleep', '7.1 h last night'],
    ['Bone & muscle', 'Exercise 540/600 min/wk'],
    ['Vision (SANS)', 'self-test done Wed · no changes'],
    ['Kidney & hydration', 'Fluids 1.1/2.5 L today'],
  ])('AC3: %s shows ✓ Nominal and "%s · synthetic"', async (system, detail) => {
    setup({ placeholders: mockStatuses }).renderApp()

    const rows = await within(list()).findAllByRole('listitem')
    const row = rows[systemNames(rows).indexOf(system)]
    expect(within(row).getByText('✓ Nominal')).toBeInTheDocument()
    expect(within(row).getByText(`${detail} · synthetic`)).toBeInTheDocument()
  })

  it('AC4: placeholder rows show no explanation list and no data age', async () => {
    setup({ placeholders: mockStatuses }).renderApp()

    const [, ...placeholders] = await within(list()).findAllByRole('listitem')
    placeholders.forEach((r) => {
      expect(r.querySelector('dl')).toBeNull()
      expect(r).not.toHaveTextContent(/ ago|just now| old\b/)
    })
  })

  it.each([
    ['rules', (s: ReturnType<typeof setup>) => void (s.ruleSource.fail = true)],
    ['history', (s: ReturnType<typeof setup>) => void (s.repository.failList = true)],
  ])('AC6: when the %s fail, shows "Status unavailable" and no placeholder rows', async (_, fail) => {
    const s = setup({ placeholders: mockStatuses })
    fail(s)
    s.renderApp()

    expect(await within(list()).findByText('Status unavailable')).toBeInTheDocument()
    expect(within(list()).queryByRole('listitem')).toBeNull()
  })
})

describe('Body systems rows link to the detail (#9)', () => {
  const link = () => within(row()).getByRole('link')

  it.each([
    [92, 'Check', SPO01],
    [88, 'Emergency', SPO02],
  ])('AC1/AC2: SpO₂ %s makes the row a link to the detail, without the explanation', async (value, word, rule) => {
    setup().renderApp()
    await submitSpo2(value)

    await within(list()).findByText(word)
    expect(link()).toHaveAttribute('href', '#/systems/Respiratory')
    expect(link()).toHaveTextContent('Respiratory')
    expect(link()).toHaveTextContent(word)
    expect(link().querySelector('.status-chevron')).toHaveAttribute('aria-hidden', 'true')
    texts(rule).forEach((text) => expect(row()).not.toHaveTextContent(text))
    expect(row().querySelector('dl')).toBeNull()
  })

  it.each([
    ['an empty store', [], undefined, 'No data'],
    ['SpO₂ 96', [], 96, '✓ Nominal'],
    ['a stale SpO₂ 88', [reading('a', '2026-11-13T09:29:00Z', 88)], undefined, 'No recent data'],
  ])('AC3: no link for %s', async (_, seed, submit, text) => {
    setup({ seed }).renderApp()
    if (submit !== undefined) await submitSpo2(submit)

    await vi.waitFor(() => expect(row()).toHaveTextContent(text))
    expect(within(list()).queryByRole('link')).toBeNull()
  })

  it('AC4: placeholder rows have no link', async () => {
    setup({ placeholders: mockStatuses }).renderApp()

    const [, ...placeholders] = await within(list()).findAllByRole('listitem')
    expect(placeholders).toHaveLength(9)
    placeholders.forEach((r) => expect(within(r).queryByRole('link')).toBeNull())
  })
})

describe('Cognition from the PVT (#17)', () => {
  const NOW = '2026-11-14T09:30:00Z'
  const DAY = 24 * 60 * 60_000
  const ago = (ms: number) => new Date(Date.parse(NOW) - ms).toISOString()
  const cognition = () => within(list()).getAllByRole('listitem')[1]
  const show = async (seed: NonNullable<Parameters<typeof setup>[0]>['seed']) => {
    setup({ now: NOW, placeholders: mockStatuses, seed }).renderApp()
    await within(list()).findAllByRole('listitem')
    await vi.waitFor(() => expect(cognition()).toHaveTextContent('Cognition'))
  }

  it('AC4: a PVT of 312 is a caution, second row, linked, and the placeholder is gone', async () => {
    await show([pvt('p', ago(10 * 60_000), 312)])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('Check'))
    expect(cognition()).toHaveTextContent('PVT median 312 ms · 10 min ago · in-app test')
    expect(within(cognition()).getByRole('link')).toHaveAttribute('href', '#/systems/Cognition')
    expect(list()).not.toHaveTextContent('PVT 268 ms · within your baseline')
  })

  it('AC2 (#28): 305 is a caution against the 265 ms baseline + 15 % (304.75 ms)', async () => {
    await show([pvt('p', NOW, 305)])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('Check'))
    expect(within(cognition()).getByRole('link')).toHaveAttribute('href', '#/systems/Cognition')
  })

  it('AC3 (#28): 304 is nominal with no link', async () => {
    await show([pvt('p', NOW, 304)])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('✓ Nominal'))
    expect(within(cognition()).queryByRole('link')).toBeNull()
  })

  it('AC6: 306 is a caution', async () => {
    await show([pvt('p', NOW, 306)])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('Check'))
  })

  it('AC7: no PVT is no data; the four placeholders stay (#43 moved Cardiovascular and Immune to rules)', async () => {
    await show([])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('No data'))
    expect(list()).not.toHaveTextContent('PVT 268 ms · within your baseline')
    const placeholders = within(list()).getAllByRole('listitem').slice(6)
    expect(placeholders).toHaveLength(4)
    placeholders.forEach((r) => expect(r).toHaveTextContent('synthetic'))
  })

  it('AC8: older than 4 days is no recent data, aged, with no link', async () => {
    await show([pvt('p', ago(4 * DAY + 60_000), 312)])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('No recent data'))
    expect(cognition()).toHaveTextContent('PVT median 312 ms · data 4 d old · in-app test')
    expect(within(cognition()).queryByRole('link')).toBeNull()
  })

  it('AC9: exactly 4 days old still shows its caution', async () => {
    await show([pvt('p', ago(4 * DAY), 312)])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('Check'))
    expect(cognition()).toHaveTextContent('4 d ago')
  })

  it('AC10: Respiratory keeps 24 h and the manual label', async () => {
    await show([reading('s', ago(DAY + 60_000), 92)])

    await vi.waitFor(() => expect(row()).toHaveTextContent('No recent data'))
    expect(row()).toHaveTextContent('· manual')
  })

  it.each([15000, 129])('AC11: a PVT of %s only is outside the valid range: no data', async (ms) => {
    await show([pvt('p', NOW, ms)])

    await vi.waitFor(() => expect(cognition()).toHaveTextContent('No data'))
  })
})

describe('Badge levels (#43, #33)', () => {
  const rule = (id: string) => RULES.find((r) => r.id === id)!
  const badge = (state: SystemStatus['state'], r?: Rule) => render(<Badge state={state} rule={r} />).container.firstElementChild!
  const T01: Rule = { ...rule('BP-01'), id: 'T-01', above: undefined, below: 100 }

  it.each([
    ['watch', rule('BP-01'), 'badge badge--watch', 'Watch', 'tabler-icon-trending-up'],
    ['watch', T01, 'badge badge--watch', 'Watch', 'tabler-icon-trending-down'],
    ['watch', undefined, 'badge badge--watch', 'Watch', undefined],
    ['check', rule('SPO-01'), 'badge badge--check', 'Check', 'tabler-icon-alert-triangle'],
    ['treat', rule('BP-04'), 'badge badge--treat', 'Treat', 'tabler-icon-first-aid-kit'],
    ['emergency', rule('SPO-02'), 'badge badge--emergency', 'Emergency', 'tabler-icon-alert-octagon'],
  ] as const)('#33 AC1: %s badge, case %#', (state, r, className, text, icon) => {
    const element = badge(state, r)
    const svg = element.querySelector('svg')

    expect([element.className, element.textContent]).toEqual([className, text])
    if (icon === undefined) {
      expect(svg).toBeNull()
      return
    }
    expect(svg).toHaveClass(icon)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '18')
  })

  it.each([
    ['nominal', 'badge badge--nominal', '✓ Nominal'],
    ['stale', 'badge badge--quiet', 'No recent data'],
    ['no-data', 'badge badge--quiet', 'No data'],
  ] as const)('#33 AC1: %s is unchanged', (state, className, text) => {
    const element = badge(state)

    expect([element.className, element.textContent]).toEqual([className, text])
  })
})
