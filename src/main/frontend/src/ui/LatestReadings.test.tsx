import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { RoutineReader } from '../application/RoutineReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import type { CheckIn } from '../domain/checkIn'
import type { Rule } from '../domain/rules'
import { mockReadings } from '../infrastructure/mockReadings'
import rules from '../infrastructure/rules.json'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from '../test/fakes'
import { App } from './App'
import { ServicesProvider } from './ServicesContext'

const LABELS = ['SpO₂', 'Heart rate', 'Sleep', 'Mood', 'Blood pressure', 'Cabin CO₂']

const stored = (id: string, recordedAt: string, fields: Partial<CheckIn>): CheckIn => ({ id, recordedAt, symptoms: [], ...fields })

function setup({ now = '2026-11-14T09:30:00Z', seed = [] as CheckIn[], online = true } = {}) {
  const clock = { now: new Date(now) }
  const repository = new FakeRepository()
  seed.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  const connectivity = new FakeConnectivity()
  connectivity.online = online
  const gateway = new FakeGateway()
  const ruleSource = new FakeRuleSource(rules as Rule[])
  const synchronizer = new SyncService(repository, gateway, connectivity)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder: new CheckInRecorder(repository, synchronizer, undefined, () => clock.now),
    statusReader: new SystemStatusReader(ruleSource, repository, () => clock.now),
    readingsReader: new LatestReadingsReader(ruleSource, repository, () => clock.now, mockReadings),
    routineReader: new RoutineReader(repository, () => clock.now),
  }
  return {
    clock,
    repository,
    gateway,
    ruleSource,
    readingsReader: services.readingsReader,
    renderApp: () =>
      render(
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>,
      ),
  }
}

const FIELD_LABELS = { heartRate: /heart rate/i, spo2: /spo[2₂]/i, sleep: /sleep/i, mood: /mood/i }

async function submit(fields: Partial<Record<keyof typeof FIELD_LABELS, number>>) {
  for (const [name, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(FIELD_LABELS[name as keyof typeof FIELD_LABELS])
    // user-event keeps its own copy of the typed value, which form.reset() doesn't clear.
    await userEvent.clear(input)
    await userEvent.type(input, String(value))
  }
  await userEvent.click(screen.getByRole('button', { name: /save check-in/i }))
}

const panel = () => screen.getByRole('region', { name: 'Latest readings' })
const tiles = () => within(panel()).findAllByRole('listitem')
const tile = (label: string) => {
  const found = within(panel())
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(label))
  if (!found) throw new Error(`no ${label} tile`)
  return found
}

describe('LatestReadings', () => {
  afterEach(() => vi.useRealTimers())

  it('AC1: lists six tiles in READINGS order, Cabin CO₂ as a 1-h average', async () => {
    setup().renderApp()

    const items = await tiles()
    expect(items).toHaveLength(6)
    expect(items.map((li) => LABELS.find((label) => li.textContent?.includes(label)))).toEqual(LABELS)
    expect(tile('Cabin CO₂').querySelector('.tile-label__suffix')).toHaveTextContent('(1-h avg)')
  })

  it.each(['SpO₂', 'Heart rate', 'Sleep', 'Mood'])('AC2: %s shows "—" read as "No reading", with no unit, age, tag or badge', async (label) => {
    setup().renderApp()
    await tiles()

    const t = tile(label)
    expect(within(t).getByText('—').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(t.querySelector('.visually-hidden')).toHaveTextContent('No reading')
    expect(t.querySelector('.badge')).toBeNull()
    expect(t.querySelector('.metric-tile__unit')).toBeNull()
    expect(t.querySelector('.tag')).toBeNull()
    expect(t.textContent).not.toMatch(/ago|old/)
  })

  it.each([
    ['Blood pressure', '108/70 mmHg'],
    ['Cabin CO₂', '2.3 mmHg'],
  ])('AC3: %s shows the synthetic %s with its tag, no badge and no age', async (label, shown) => {
    setup().renderApp()
    await tiles()

    const t = tile(label)
    expect(t).toHaveTextContent(shown)
    const tags = t.querySelectorAll('.tag')
    expect(tags).toHaveLength(1)
    expect(tags[0]).toHaveTextContent('synthetic')
    expect(t.querySelector('.badge')).toBeNull()
    expect(t.textContent).not.toMatch(/ago|old/)
  })

  it.each(LABELS)('AC4: %s has an icon with no data', async (label) => {
    setup().renderApp()
    await tiles()

    expect(tile(label).querySelector('.metric-tile__icon')).not.toBeNull()
  })

  it('AC5 and AC6: a check-in shows each value with its unit, "just now" and the manual tag', async () => {
    setup().renderApp()
    await tiles()
    await submit({ heartRate: 63, spo2: 97, sleep: 5.5, mood: 3 })

    await waitFor(() => expect(tile('SpO₂')).toHaveTextContent('97 %'))
    expect(tile('Heart rate')).toHaveTextContent('63 bpm')
    expect(tile('Sleep')).toHaveTextContent('5.5 h')
    expect(tile('Mood')).toHaveTextContent('3 / 5')
    for (const label of ['SpO₂', 'Heart rate', 'Sleep', 'Mood']) {
      expect(tile(label)).toHaveTextContent(`${label} / just now`)
      expect(tile(label).querySelector('.tag')).toHaveTextContent('manual')
    }
  })

  it('AC7: SpO₂ 96 keeps the icon and shows no badge', async () => {
    setup().renderApp()
    await tiles()
    await submit({ spo2: 96 })

    await waitFor(() => expect(tile('SpO₂')).toHaveTextContent('96 %'))
    expect(tile('SpO₂').querySelector('.metric-tile__icon')).not.toBeNull()
    expect(tile('SpO₂').querySelector('.badge')).toBeNull()
  })

  it('AC8: SpO₂ 92 shows the caution badge in place of the icon', async () => {
    setup().renderApp()
    await tiles()
    await submit({ spo2: 92 })

    await waitFor(() => expect(tile('SpO₂')).toHaveTextContent('▲ CAUTION'))
    expect(tile('SpO₂').querySelector('.metric-tile__icon')).toBeNull()
  })

  it('AC9: SpO₂ 88 shows the warning badge with its octagon in place of the icon', async () => {
    setup().renderApp()
    await tiles()
    await submit({ spo2: 88 })

    await waitFor(() => expect(tile('SpO₂').querySelector('.badge')).toHaveTextContent('WARNING'))
    expect(tile('SpO₂').querySelector('.badge svg')).toHaveAttribute('aria-hidden', 'true')
    expect(tile('SpO₂').querySelector('.metric-tile__icon')).toBeNull()
  })

  it('AC10: each tile shows the newest value of its own field', async () => {
    setup({
      now: '2026-11-14T10:00:00Z',
      seed: [
        stored('a', '2026-11-14T08:00:00Z', { spo2Percent: 88, heartRateBpm: 70 }),
        stored('b', '2026-11-14T10:00:00Z', { heartRateBpm: 64 }),
      ],
    }).renderApp()
    await tiles()

    expect(tile('SpO₂')).toHaveTextContent('88 %')
    expect(tile('SpO₂')).toHaveTextContent('SpO₂ / 2 h ago')
    expect(tile('SpO₂')).toHaveTextContent('WARNING')
    expect(tile('Heart rate')).toHaveTextContent('64 bpm')
    expect(tile('Heart rate')).toHaveTextContent('Heart rate / just now')
  })

  it('AC11: a value older than 24 h looks stale: muted, "1 d old", icon and no badge', async () => {
    setup({ now: '2026-11-14T08:01:00Z', seed: [stored('a', '2026-11-13T08:00:00Z', { spo2Percent: 88 })] }).renderApp()
    await tiles()

    const t = tile('SpO₂')
    expect(t).toHaveClass('metric-tile--stale')
    expect(t).toHaveTextContent('88 %')
    expect(t).toHaveTextContent('SpO₂ / 1 d old')
    expect(t.querySelector('.tag')).toHaveTextContent('manual')
    expect(t.querySelector('.metric-tile__icon')).not.toBeNull()
    expect(t.querySelector('.badge')).toBeNull()
  })

  it('AC12: a value exactly 24 h old still shows its warning', async () => {
    setup({ now: '2026-11-14T08:00:00Z', seed: [stored('a', '2026-11-13T08:00:00Z', { spo2Percent: 88 })] }).renderApp()
    await tiles()

    expect(tile('SpO₂')).toHaveTextContent('WARNING')
    expect(tile('SpO₂')).toHaveTextContent('SpO₂ / 1 d ago')
  })

  it.each([
    ['96 first', ['a', 'b']],
    ['88 first', ['b', 'a']],
  ])('AC13: equal timestamps show the more severe value (%s)', async (_, order) => {
    const byId: Record<string, CheckIn> = {
      a: stored('a', '2026-11-14T09:00:00Z', { spo2Percent: 96 }),
      b: stored('b', '2026-11-14T09:00:00Z', { spo2Percent: 88 }),
    }
    setup({ seed: order.map((id) => byId[id]) }).renderApp()
    await tiles()

    expect(tile('SpO₂')).toHaveTextContent('88 %')
    expect(tile('SpO₂')).toHaveTextContent('WARNING')
  })

  const failures = [
    ['rules', (s: ReturnType<typeof setup>, fail: boolean) => void (s.ruleSource.fail = fail)],
    ['history', (s: ReturnType<typeof setup>, fail: boolean) => void (s.repository.failList = fail)],
  ] as const

  it.each(failures)('AC14: when the %s fail, shows "Readings unavailable" and no tiles', async (_, setFail) => {
    const s = setup()
    setFail(s, true)
    s.renderApp()

    expect(await within(panel()).findByText('Readings unavailable')).toBeInTheDocument()
    expect(within(panel()).queryByRole('listitem')).toBeNull()
  })

  it.each(failures)('AC15: when the %s fail, a check-in is still saved', async (_, setFail) => {
    const s = setup()
    setFail(s, true)
    s.renderApp()
    await within(panel()).findByText('Readings unavailable')

    await submit({ spo2: 96 })

    await waitFor(() => expect(s.repository.items.size).toBe(1))
  })

  it.each(failures)('AC16: when the %s recover, the next check-in brings the tiles back', async (_, setFail) => {
    const s = setup()
    setFail(s, true)
    s.renderApp()
    await within(panel()).findByText('Readings unavailable')

    setFail(s, false)
    await submit({ spo2: 96 })

    await waitFor(() => expect(within(panel()).getAllByRole('listitem')).toHaveLength(6))
    expect(tile('SpO₂')).toHaveTextContent('96 %')
  })

  it('AC17: shows the heading with no tiles while the reader is pending', () => {
    const s = setup()
    vi.spyOn(s.readingsReader, 'read').mockReturnValue(new Promise(() => {}))
    s.renderApp()

    expect(screen.getByRole('heading', { name: 'Latest readings' })).toBeInTheDocument()
    expect(within(panel()).queryByRole('listitem')).toBeNull()
  })

  it('AC18: re-reads every 60 s and updates the data age', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const s = setup({ now: '2026-11-14T09:30:00Z', seed: [stored('a', '2026-11-14T09:30:00Z', { spo2Percent: 88 })] })
    s.renderApp()
    await tiles()
    expect(tile('SpO₂')).toHaveTextContent('SpO₂ / just now')

    s.clock.now = new Date(s.clock.now.getTime() + 60_000)
    act(() => vi.advanceTimersByTime(60_000))

    await waitFor(() => expect(tile('SpO₂')).toHaveTextContent('SpO₂ / 1 min ago'))
  })

  it('AC19: warns offline without calling the gateway', async () => {
    const s = setup({ online: false })
    s.renderApp()
    await tiles()
    await submit({ spo2: 88 })

    await waitFor(() => expect(tile('SpO₂')).toHaveTextContent('WARNING'))
    expect(s.gateway.sent).toHaveLength(0)
  })

  it('AC19: the right column stacks Today\'s routine, Latest readings and the Check-in card', async () => {
    const { container } = setup().renderApp()
    await tiles()

    const layout = container.querySelector('main.layout')
    const [systems, column, ...rest] = [...(layout?.children ?? [])]
    expect(rest).toHaveLength(0)
    expect(systems).toBe(screen.getByRole('region', { name: 'Body systems' }))
    expect(column).toHaveClass('stack')
    expect(column.tagName).toBe('DIV')
    expect([...column.children]).toEqual([
      screen.getByRole('region', { name: "Today's routine" }),
      panel(),
      screen.getByRole('region', { name: 'Check-in' }),
    ])
  })
})
