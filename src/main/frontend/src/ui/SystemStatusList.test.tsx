import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Rule } from '../domain/rules'
import { mockStatuses } from '../infrastructure/mockStatuses'
import rules from '../infrastructure/rules.json'
import { reading, setup, submitSpo2 } from '../test/renderApp'

const [SPO01, SPO02] = rules as Rule[]
const texts = (rule: Rule) => [rule.what, rule.why, rule.howDecided, rule.next]
const MIN = 60_000
const HOUR = 60 * MIN

const list = () => screen.getByRole('region', { name: 'Body systems' })
const row = () => within(list()).getByRole('listitem')

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

    expect(await within(list()).findByText('No data')).toBeInTheDocument()
    expect(within(list()).getAllByRole('listitem')).toHaveLength(1)
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

    expect(await within(list()).findByText('▲ CAUTION')).toBeInTheDocument()
    expect(row()).toHaveClass('status-caution')
    expectNoExplanation(row())
  })

  it('AC5: 90 is caution', async () => {
    setup().renderApp()
    await submitSpo2(90)

    expect(await within(list()).findByText('▲ CAUTION')).toBeInTheDocument()
  })

  it('AC6: 88 is warning with an octagon icon; the explanation lives on the detail screen (#9)', async () => {
    setup().renderApp()
    await submitSpo2(88)

    expect(await within(list()).findByText('WARNING')).toBeInTheDocument()
    expect(row()).toHaveClass('status-warning')
    expect(row().querySelector('.badge svg')).toHaveAttribute('aria-hidden', 'true')
    expectNoExplanation(row())
  })

  it('AC7: a later check-in without SpO₂ keeps the warning', async () => {
    setup({
      now: '2026-11-14T10:00:00Z',
      seed: [reading('a', '2026-11-14T08:00:00Z', 88), reading('b', '2026-11-14T10:00:00Z')],
    }).renderApp()

    expect(await within(list()).findByText('WARNING')).toBeInTheDocument()
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

    expect(await within(list()).findByText('WARNING')).toBeInTheDocument()
  })

  it('AC10: an out-of-range newer value is ignored', async () => {
    setup({ seed: [reading('a', '2026-11-14T09:00:00Z', 0), reading('b', '2026-11-14T08:00:00Z', 92)] }).renderApp()

    expect(await within(list()).findByText('▲ CAUTION')).toBeInTheDocument()
    expect(row()).toHaveTextContent('SpO₂ 92 %')
  })

  it('AC11: only an out-of-range value means no data', async () => {
    setup({ seed: [reading('a', '2026-11-14T09:00:00Z', 120)] }).renderApp()

    expect(await within(list()).findByText('No data')).toBeInTheDocument()
  })

  it('AC12: warns offline without calling the gateway', async () => {
    const { gateway, renderApp } = setup({ online: false })
    renderApp()
    await submitSpo2(88)

    expect(await within(list()).findByText('WARNING')).toBeInTheDocument()
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
    await vi.waitFor(() => expect(screen.getByLabelText(/spo[2₂]/i)).toHaveValue(null))
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

  it('AC1: lists Respiratory (No data) then the nine placeholders in mockup order', async () => {
    setup({ placeholders: mockStatuses }).renderApp()

    const rows = await within(list()).findAllByRole('listitem')
    expect(systemNames(rows)).toEqual([
      'Respiratory',
      'Cognition',
      'Cabin air',
      'Sleep',
      'Immune',
      'Cardiovascular',
      'Bone & muscle',
      'Vision (SANS)',
      'Radiation',
      'Kidney & hydration',
    ])
    expect(within(rows[0]).getByText('No data')).toBeInTheDocument()
  })

  it('AC2: SpO₂ 88 warns on Respiratory while the placeholders stay nominal', async () => {
    setup({ placeholders: mockStatuses }).renderApp()
    await submitSpo2(88)

    expect(await within(list()).findByText('WARNING')).toBeInTheDocument()
    const [respiratory, ...others] = within(list()).getAllByRole('listitem')
    expectNoExplanation(respiratory)
    expect(others).toHaveLength(9)
    others.forEach((r) => expect(within(r).getByText('✓ Nominal')).toBeInTheDocument())
  })

  it.each([
    ['Cognition', 'PVT 268 ms · within your baseline'],
    ['Cabin air', 'CO₂ 2.3 mmHg (1-h avg)'],
    ['Sleep', '7.1 h last night'],
    ['Immune', 'no new symptoms'],
    ['Cardiovascular', 'HR 63 bpm · BP 108/70'],
    ['Bone & muscle', 'Exercise 540/600 min/wk'],
    ['Vision (SANS)', 'self-test done Wed · no changes'],
    ['Radiation', '38% of 30-day limit'],
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
    [92, '▲ CAUTION', SPO01],
    [88, 'WARNING', SPO02],
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

    await within(list()).findByText(text)
    expect(within(list()).queryByRole('link')).toBeNull()
  })

  it('AC4: placeholder rows have no link', async () => {
    setup({ placeholders: mockStatuses }).renderApp()

    const [, ...placeholders] = await within(list()).findAllByRole('listitem')
    expect(placeholders).toHaveLength(9)
    placeholders.forEach((r) => expect(within(r).queryByRole('link')).toBeNull())
  })
})
