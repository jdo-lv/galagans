import { act, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { RoutineReader } from '../application/RoutineReader'
import { StreakReader } from '../application/StreakReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import type { CheckIn } from '../domain/checkIn'
import type { Observation } from '../domain/observation'
import { RULES } from '../test/rules'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from '../test/fakes'
import { mockStatuses } from '../infrastructure/mockStatuses'
import { observationFakes, packetFakes, pvt, saveCheckIn, setup as setupApp, voiceFakes } from '../test/renderApp'
import { App } from './App'
import { ServicesProvider } from './ServicesContext'

const LABELS = ['SpO₂', 'Heart rate', 'Sleep', 'Mood', 'Blood pressure', 'Temperature', 'Cabin CO₂', 'Cabin temp', 'Cabin humidity', 'Dose rate', '30-day dose', 'Reaction time']

const stored = (id: string, recordedAt: string, fields: Partial<CheckIn>): CheckIn => ({ id, recordedAt, symptoms: [], ...fields })

function setup({ now = '2026-11-14T09:30:00Z', seed = [] as CheckIn[], online = true, observationSeed = [] as Observation[] } = {}) {
  const clock = { now: new Date(now) }
  const repository = new FakeRepository()
  seed.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  const connectivity = new FakeConnectivity()
  connectivity.online = online
  const gateway = new FakeGateway()
  const ruleSource = new FakeRuleSource(RULES)
  const synchronizer = new SyncService(repository, gateway, connectivity)
  const device = observationFakes(repository, () => clock.now, observationSeed)
  const readingsReader = new LatestReadingsReader(ruleSource, device.history, () => clock.now)
  const statusReader = new SystemStatusReader(ruleSource, device.history, () => clock.now)
  const routineReader = new RoutineReader(repository, () => clock.now)
  const recorder = new CheckInRecorder(repository, synchronizer, undefined, () => clock.now)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder,
    statusReader,
    healthGateway: device.healthGateway,
    readingsReader,
    routineReader,
    streakReader: new StreakReader(repository, () => clock.now),
    random: () => 0,
    voiceSession: voiceFakes({ recorder, statusReader, routineReader }).voiceSession,
    ...packetFakes(readingsReader, connectivity, () => clock.now).services,
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

const submit = saveCheckIn

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

  it('AC1: lists the tiles in READINGS order (twelve with the 30-day dose), Cabin CO₂ as a 1-h average', async () => {
    setup().renderApp()

    const items = await tiles()
    expect(items).toHaveLength(LABELS.length)
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

  it('Blood pressure shows a BP cuff reading as "108/70 mmHg" with its device tag and no badge', async () => {
    const at = '2026-11-14T09:29:00Z'
    const bp = (indicator: 'systolicMmHg' | 'diastolicMmHg', value: number): Observation => ({
      resourceType: 'Observation',
      id: `bp-cuff:m1:${indicator}`,
      status: 'final',
      code: { text: indicator },
      valueQuantity: { value, unit: 'mmHg' },
      effectiveDateTime: at,
      device: { display: 'BP cuff · synthetic' },
    })
    setup({ observationSeed: [bp('systolicMmHg', 108), bp('diastolicMmHg', 70)] }).renderApp()
    await tiles()

    const t = tile('Blood pressure')
    expect(t).toHaveTextContent('108/70 mmHg')
    expect(t.querySelector('.tag')).toHaveTextContent('BP cuff · synthetic')
    expect(t.querySelector('.badge')).toBeNull()
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

    await waitFor(() => expect(tile('SpO₂')).toHaveTextContent('Check'))
    expect(tile('SpO₂').querySelector('.metric-tile__icon')).toBeNull()
  })

  it('AC9: SpO₂ 88 shows the emergency badge in place of the icon', async () => {
    setup().renderApp()
    await tiles()
    await submit({ spo2: 88 })

    await waitFor(() => expect(tile('SpO₂').querySelector('.badge')).toHaveTextContent('Emergency'))
    expect(tile('SpO₂').querySelector('.metric-tile__icon')).toBeNull()
  })

  it.each([
    [125, 70, 'badge badge--watch', 'Watch'],
    [150, 70, 'badge badge--treat', 'Treat'],
  ])('#43 AC10: Blood pressure %s/%s shows "%s" with its rule direction in place of the icon', async (systolic, diastolic, className, text) => {
    const bp = (indicator: 'systolicMmHg' | 'diastolicMmHg', value: number): Observation => ({
      resourceType: 'Observation', id: `bp-cuff:m1:${indicator}`, status: 'final', code: { text: indicator },
      valueQuantity: { value, unit: 'mmHg' }, effectiveDateTime: '2026-11-14T09:29:00Z', device: { display: 'BP cuff · synthetic' },
    })
    setup({ observationSeed: [bp('systolicMmHg', systolic), bp('diastolicMmHg', diastolic)] }).renderApp()
    await tiles()

    await waitFor(() => expect(tile('Blood pressure').querySelector('.badge')).toHaveTextContent(text))
    expect(tile('Blood pressure').querySelector('.badge')?.className).toBe(className)
    expect(tile('Blood pressure').querySelector('.metric-tile__icon')).toBeNull()
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
    expect(tile('SpO₂')).toHaveTextContent('Emergency')
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

    expect(tile('SpO₂')).toHaveTextContent('Emergency')
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
    expect(tile('SpO₂')).toHaveTextContent('Emergency')
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

    await waitFor(() => expect(within(panel()).getAllByRole('listitem')).toHaveLength(LABELS.length))
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

    await waitFor(() => expect(tile('SpO₂')).toHaveTextContent('Emergency'))
    expect(s.gateway.sent).toHaveLength(0)
  })

  it('AC19: the right column stacks Today\'s routine, Latest readings and the Reaction test card (#16); the Check-in card is gone (#29)', async () => {
    const { container } = setup().renderApp()
    await tiles()

    const layout = container.querySelector('main.layout')
    // Hazard lens (#14) sits between Body systems and the right column.
    const [systems, hazardLens, column, ...rest] = [...(layout?.children ?? [])]
    expect(rest).toHaveLength(0)
    expect(systems).toBe(screen.getByRole('region', { name: 'Body systems' }))
    expect(hazardLens).toBe(screen.getByRole('region', { name: 'Hazard lens · NASA HRP five hazards' }))
    expect(column).toHaveClass('stack')
    expect(column.tagName).toBe('DIV')
    expect([...column.children]).toEqual([
      screen.getByRole('region', { name: "Today's routine" }),
      panel(),
      screen.getByRole('region', { name: 'Reaction test' }),
    ])
    expect(screen.queryByRole('region', { name: 'Check-in' })).toBeNull()
  })
})

describe('Reaction time tile (#16)', () => {
  const DAY = 24 * 60 * 60_000
  const NOW = '2026-11-14T09:30:00Z'
  const ago = (ms: number) => new Date(Date.parse(NOW) - ms).toISOString()

  it('AC29: shows the median, its age, the in-app test tag and an icon', async () => {
    setup({ seed: [pvt('p', NOW, 268)] }).renderApp()

    const items = await tiles()
    const last = items[items.length - 1]
    expect(last).toBe(tile('Reaction time'))
    expect(last).toHaveTextContent('268 ms')
    expect(last).toHaveTextContent('Reaction time / just now')
    expect(within(last).getByText('in-app test')).toHaveClass('tag')
    expect(last.querySelector('svg.metric-tile__icon')).not.toBeNull()
  })

  it('AC30: with no test shows "—" and "No reading"', async () => {
    setup().renderApp()
    await tiles()

    expect(tile('Reaction time')).toHaveTextContent('—')
    expect(within(tile('Reaction time')).getByText('No reading')).toHaveClass('visually-hidden')
  })

  it('AC31: older than 4 days looks stale', async () => {
    setup({ seed: [pvt('p', ago(4 * DAY + 60_000), 268)] }).renderApp()
    await tiles()

    expect(tile('Reaction time')).toHaveClass('metric-tile--stale')
    expect(tile('Reaction time')).toHaveTextContent('Reaction time / 4 d old')
  })

  it('AC32: exactly 4 days old is not stale', async () => {
    setup({ seed: [pvt('p', ago(4 * DAY), 268)] }).renderApp()
    await tiles()

    expect(tile('Reaction time')).not.toHaveClass('metric-tile--stale')
    expect(tile('Reaction time')).toHaveTextContent('Reaction time / 4 d ago')
  })
})

describe('Reaction time tile with COG-01 (#17)', () => {
  const NOW = '2026-11-14T09:30:00Z'
  const tileOf = () =>
    within(screen.getByRole('region', { name: 'Latest readings' }))
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes('Reaction time')) as HTMLElement

  it('AC16: 312 ms shows the caution badge in place of the icon; 268 ms shows the icon', async () => {
    setupApp({ placeholders: mockStatuses, seed: [pvt('p', NOW, 312)] }).renderApp()
    await waitFor(() => expect(tileOf()).toHaveTextContent('Check'))
    expect(tileOf().querySelector('.metric-tile__icon')).toBeNull()
  })

  it('AC16: 268 ms shows the icon and no badge', async () => {
    setupApp({ placeholders: mockStatuses, seed: [pvt('p', NOW, 268)] }).renderApp()
    await waitFor(() => expect(tileOf()).toHaveTextContent('268 ms'))
    expect(tileOf().querySelector('.metric-tile__icon')).not.toBeNull()
    expect(tileOf().querySelector('.badge')).toBeNull()
  })
})

describe('Heart rate tile with the CV-03 drift (#35)', () => {
  it('AC20: a 3-day resting HR drift leaves the Heart rate tile without a badge', async () => {
    const seed = [12, 13, 14].map((day) => stored(`hr-${day}`, `2026-11-${day}T07:00:00Z`, { heartRateBpm: 70 }))
    setup({ seed }).renderApp()
    await tiles()

    await waitFor(() => expect(tile('Heart rate')).toHaveTextContent('70 bpm'))
    expect(tile('Heart rate').querySelector('.badge')).toBeNull()
  })
})
