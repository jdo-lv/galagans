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
import { mockRoutine } from '../infrastructure/mockRoutine'
import rules from '../infrastructure/rules.json'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from '../test/fakes'
import { App } from './App'
import { ServicesProvider } from './ServicesContext'

const at = (h: number, m = 0, day = 14) => new Date(2026, 10, day, h, m)
const stored = (id: string, recordedAt: Date): CheckIn => ({ id, recordedAt: recordedAt.toISOString(), symptoms: [] })

function setup({ now = at(8), seed = [] as CheckIn[], online = true } = {}) {
  const clock = { now }
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
    readingsReader: new LatestReadingsReader(ruleSource, repository, () => clock.now),
    routineReader: new RoutineReader(repository, () => clock.now, mockRoutine),
  }
  return {
    clock,
    repository,
    gateway,
    routineReader: services.routineReader,
    renderApp: () =>
      render(
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>,
      ),
  }
}

const card = () => screen.getByRole('region', { name: "Today's routine" })
const items = () => within(card()).findAllByRole('listitem')
const row = async () => (await items())[0]
const timeText = (li: HTMLElement) => li.querySelector('.num')

async function saveMood(value?: number) {
  if (value !== undefined) {
    // user-event keeps its own copy of the typed value, which form.reset() doesn't clear.
    await userEvent.clear(screen.getByLabelText(/mood/i))
    await userEvent.type(screen.getByLabelText(/mood/i), String(value))
  }
  await userEvent.click(screen.getByRole('button', { name: /save check-in/i }))
}

describe('TodaysRoutine', () => {
  afterEach(() => vi.useRealTimers())

  it('AC1: lists the check-in and four placeholders in order', async () => {
    setup().renderApp()

    const lis = await items()
    expect(lis).toHaveLength(5)
    const labels = ['Morning check-in', 'PVT (3 min)', 'Exercise · resistance 45 min', 'Fluids 2.5 L', 'Workload (Bedford)']
    lis.forEach((li, i) => expect(li).toHaveTextContent(labels[i]))
  })

  it('AC2: due row is outlined with a Start button and no window, done or not answered', async () => {
    setup().renderApp()

    const li = await row()
    expect(li).toHaveClass('routine-item--due')
    expect(within(li).getByRole('button', { name: 'Start · ~1.5 min' })).toBeInTheDocument()
    expect(li).not.toHaveTextContent(/07:00–09:00|done|not answered/)
  })

  it('AC3: Start focuses the Heart rate field and saves nothing', async () => {
    const s = setup()
    s.renderApp()

    await userEvent.click(within(await row()).getByRole('button', { name: 'Start · ~1.5 min' }))

    expect(document.activeElement).toBe(screen.getByLabelText(/heart rate/i))
    expect(s.repository.items.size).toBe(0)
  })

  it('AC4: before 07:00 the row is upcoming with its window and no button', async () => {
    setup({ now: at(6, 59) }).renderApp()

    const li = await row()
    expect(li).toHaveClass('routine-item--upcoming')
    expect(timeText(li)).toHaveTextContent('07:00–09:00')
    expect(within(li).queryByRole('button')).toBeNull()
  })

  it('AC5: 07:00 is due', async () => {
    setup({ now: at(7) }).renderApp()

    expect(await row()).toHaveClass('routine-item--due')
  })

  it('AC6: 09:00 is missed, "not answered", no button', async () => {
    setup({ now: at(9) }).renderApp()

    const li = await row()
    expect(li).toHaveClass('routine-item--missed')
    expect(timeText(li)).toHaveTextContent('not answered')
    expect(within(li).queryByRole('button')).toBeNull()
  })

  it('AC7: saving at 08:05 makes the row done 08:05, with no ✓ and no button', async () => {
    const s = setup()
    s.renderApp()
    await row()

    s.clock.now = at(8, 5)
    await saveMood(3)

    await waitFor(async () => expect(await row()).toHaveClass('routine-item--done'))
    const li = await row()
    expect(timeText(li)).toHaveTextContent('done 08:05')
    expect(li).not.toHaveTextContent('✓')
    expect(within(li).queryByRole('button')).toBeNull()
  })

  it('AC8: an empty check-in counts', async () => {
    setup().renderApp()
    await row()

    await saveMood()

    await waitFor(async () => expect(timeText(await row())).toHaveTextContent('done 08:00'))
  })

  it('AC9: shows the earliest check-in of today whatever the list order', async () => {
    setup({ now: at(10), seed: [stored('a', at(7, 40)), stored('b', at(7, 15))] }).renderApp()

    expect(timeText(await row())).toHaveTextContent('done 07:15')
  })

  it('AC10: a check-in after the window counts', async () => {
    setup({ now: at(11), seed: [stored('a', at(10, 30))] }).renderApp()

    expect(timeText(await row())).toHaveTextContent('done 10:30')
  })

  it("AC11: yesterday's check-in doesn't count", async () => {
    setup({ seed: [stored('a', at(23, 59, 13))] }).renderApp()

    expect(await row()).toHaveClass('routine-item--due')
  })

  it('AC12: a check-in before the window counts', async () => {
    setup({ now: at(6, 45), seed: [stored('a', at(6, 30))] }).renderApp()

    expect(timeText(await row())).toHaveTextContent('done 06:30')
  })

  it.each([at(6, 59), at(8), at(10)])('AC13: placeholders look the same at %s', async (now) => {
    setup({ now }).renderApp()

    const [, ...rest] = await items()
    const expected = [
      ['PVT (3 min)', 'every 4th day'],
      ['Exercise · resistance 45 min', '14:00'],
      ['Fluids 2.5 L', '1.1 L so far'],
      ['Workload (Bedford)', '20:00–22:00'],
    ]
    rest.forEach((li, i) => {
      expect(li).toHaveTextContent(expected[i][0])
      expect(timeText(li)).toHaveTextContent(expected[i][1])
      const tags = li.querySelectorAll('.tag')
      expect(tags).toHaveLength(1)
      expect(tags[0]).toHaveTextContent('synthetic')
      expect(within(li).queryByRole('button')).toBeNull()
    })
  })

  it('AC14: when the history fails, shows "Routine unavailable" and no rows', async () => {
    const s = setup()
    s.repository.failList = true
    s.renderApp()

    expect(await within(card()).findByText('Routine unavailable')).toBeInTheDocument()
    expect(within(card()).queryByRole('listitem')).toBeNull()
  })

  it('AC15: when the history recovers, the next save brings the rows back', async () => {
    const s = setup()
    s.repository.failList = true
    s.renderApp()
    await within(card()).findByText('Routine unavailable')

    s.repository.failList = false
    await saveMood(3)

    await waitFor(async () => expect(await items()).toHaveLength(5))
    expect(timeText(await row())).toHaveTextContent('done 08:00')
  })

  it('AC16: shows only the heading while the reader is pending', () => {
    const s = setup()
    vi.spyOn(s.routineReader, 'read').mockReturnValue(new Promise(() => {}))
    s.renderApp()

    expect(screen.getByRole('heading', { name: "Today's routine" })).toBeInTheDocument()
    expect(within(card()).queryByRole('listitem')).toBeNull()
  })

  it('AC17: the due row becomes "not answered" within 60 s of 09:00', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const s = setup({ now: at(8, 59) })
    s.renderApp()
    expect(await row()).toHaveClass('routine-item--due')

    s.clock.now = at(9)
    act(() => vi.advanceTimersByTime(60_000))

    await waitFor(async () => expect(timeText(await row())).toHaveTextContent('not answered'))
  })

  it('AC18: offline, saving still marks done and calls no gateway', async () => {
    const s = setup({ online: false })
    s.renderApp()
    await row()

    await saveMood(3)

    await waitFor(async () => expect(timeText(await row())).toHaveTextContent('done 08:00'))
    expect(s.gateway.sent).toHaveLength(0)
  })
})
