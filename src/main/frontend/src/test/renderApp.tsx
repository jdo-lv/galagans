import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { RoutineReader } from '../application/RoutineReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import type { CheckIn } from '../domain/checkIn'
import type { RoutinePlaceholder } from '../domain/routine'
import type { Placeholder, Rule } from '../domain/rules'
import ruleRows from '../infrastructure/rules.json'
import { App } from '../ui/App'
import { ServicesProvider } from '../ui/ServicesContext'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from './fakes'

export const reading = (id: string, recordedAt: string, spo2Percent?: number): CheckIn => ({
  id,
  recordedAt,
  spo2Percent,
  symptoms: [],
})

/** The whole app on fakes, with a clock the test moves. */
export function setup({
  now = '2026-11-14T09:30:00Z',
  seed = [] as CheckIn[],
  online = true,
  placeholders = [] as Placeholder[],
  rules = ruleRows as Rule[],
  routinePlaceholders = [] as RoutinePlaceholder[],
} = {}) {
  const clock = { now: new Date(now) }
  const repository = new FakeRepository()
  seed.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  const connectivity = new FakeConnectivity()
  connectivity.online = online
  const gateway = new FakeGateway()
  const ruleSource = new FakeRuleSource(rules)
  const synchronizer = new SyncService(repository, gateway, connectivity)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder: new CheckInRecorder(repository, synchronizer, undefined, () => clock.now),
    statusReader: new SystemStatusReader(ruleSource, repository, () => clock.now, placeholders),
    readingsReader: new LatestReadingsReader(ruleSource, repository, () => clock.now),
    routineReader: new RoutineReader(repository, () => clock.now, routinePlaceholders),
  }
  return {
    clock,
    repository,
    gateway,
    ruleSource,
    statusReader: services.statusReader,
    routineReader: services.routineReader,
    renderApp: () =>
      render(
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>,
      ),
  }
}

export async function submitSpo2(value: number) {
  // user-event keeps its own copy of the typed value, which form.reset() doesn't clear.
  await userEvent.clear(screen.getByLabelText(/spo[2₂]/i))
  await userEvent.type(screen.getByLabelText(/spo[2₂]/i), String(value))
  await userEvent.click(screen.getByRole('button', { name: /save check-in/i }))
}
