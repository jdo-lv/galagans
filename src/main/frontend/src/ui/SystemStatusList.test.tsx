import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import type { CheckIn } from '../domain/checkIn'
import type { Placeholder, Rule } from '../domain/rules'
import { mockStatuses } from '../infrastructure/mockStatuses'
import rules from '../infrastructure/rules.json'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from '../test/fakes'
import { App } from './App'
import { ServicesProvider } from './ServicesContext'

const [SPO01, SPO02] = rules as Rule[]
const texts = (rule: Rule) => [rule.what, rule.why, rule.howDecided, rule.next]
const MIN = 60_000
const HOUR = 60 * MIN

const reading = (id: string, recordedAt: string, spo2Percent?: number): CheckIn => ({ id, recordedAt, spo2Percent, symptoms: [] })

function setup({ now = '2026-11-14T09:30:00Z', seed = [] as CheckIn[], online = true, placeholders = [] as Placeholder[] } = {}) {
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
    statusReader: new SystemStatusReader(ruleSource, repository, () => clock.now, placeholders),
  }
  return {
    clock,
    repository,
    gateway,
    ruleSource,
    renderApp: () =>
      render(
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>,
      ),
  }
}

const list = () => screen.getByRole('region', { name: 'Body systems' })
const row = () => within(list()).getByRole('listitem')

async function submitSpo2(value: number) {
  // user-event keeps its own copy of the typed value, which form.reset() doesn't clear.
  await userEvent.clear(screen.getByLabelText(/spo[2₂]/i))
  await userEvent.type(screen.getByLabelText(/spo[2₂]/i), String(value))
  await userEvent.click(screen.getByRole('button', { name: /save check-in/i }))
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

  it('AC4: 92 is caution with the SPO-01 explanation', async () => {
    setup().renderApp()
    await submitSpo2(92)

    expect(await within(list()).findByText('▲ CAUTION')).toBeInTheDocument()
    expect(row()).toHaveClass('status-caution')
    expect(within(row()).getByText('SPO-01')).toBeInTheDocument()
    expect(within(row()).getByText('CMO')).toBeInTheDocument()
    texts(SPO01).forEach((text) => expect(row()).toHaveTextContent(text))
  })

  it('AC5: 90 is caution', async () => {
    setup().renderApp()
    await submitSpo2(90)

    expect(await within(list()).findByText('▲ CAUTION')).toBeInTheDocument()
  })

  it('AC6: 88 is warning with an octagon icon and only the SPO-02 explanation', async () => {
    setup().renderApp()
    await submitSpo2(88)

    expect(await within(list()).findByText('WARNING')).toBeInTheDocument()
    expect(row()).toHaveClass('status-warning')
    expect(row().querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(within(row()).getByText('SPO-02')).toBeInTheDocument()
    expect(within(row()).getByText('Urgent ground')).toBeInTheDocument()
    texts(SPO02).forEach((text) => expect(row()).toHaveTextContent(text))
    expect(within(row()).queryByText('SPO-01')).toBeNull()
    expect(within(row()).queryByText('CMO')).toBeNull()
    ;[SPO01.what, SPO01.howDecided, SPO01.next].forEach((text) => expect(row()).not.toHaveTextContent(text))
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
})
