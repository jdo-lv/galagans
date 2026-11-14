import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LastPacketReader } from '../application/LastPacketReader'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { PacketDraftReader } from '../application/PacketDraftReader'
import { PacketSender } from '../application/PacketSender'
import { PacketUplink } from '../application/PacketUplink'
import { PersonalHealthGateway } from '../application/PersonalHealthGateway'
import { CombinedObservationHistory } from '../application/CombinedObservationHistory'
import { RoutineReader } from '../application/RoutineReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import type { CheckIn } from '../domain/checkIn'
import type { Observation } from '../domain/observation'
import type { CheckInHistory, ConnectivityMonitor } from '../domain/ports'
import type { ReadingPlaceholder } from '../domain/readings'
import type { RoutinePlaceholder } from '../domain/routine'
import type { Placeholder, Rule } from '../domain/rules'
import ruleRows from '../infrastructure/rules.json'
import { App } from '../ui/App'
import { ServicesProvider } from '../ui/ServicesContext'
import {
  FakeConnectivity,
  FakeGateway,
  FakeObservationRepository,
  FakePacketGateway,
  FakePacketRepository,
  FakeReadingSource,
  FakeRuleSource,
  FakeRepository,
} from './fakes'

export const reading = (id: string, recordedAt: string, spo2Percent?: number): CheckIn => ({
  id,
  recordedAt,
  spo2Percent,
  symptoms: [],
})

export const pvt = (id: string, recordedAt: string, medianMs: number): CheckIn => ({
  id,
  recordedAt,
  pvtMedianMs: medianMs,
  pvtLapses: 0,
  pvtFalseStarts: 0,
  symptoms: [],
})

/** The surgeon packet services (#19) on fakes, sharing the app's readings, connection and clock. */
export function packetFakes(readingsReader: LatestReadingsReader, connectivity: ConnectivityMonitor, now: () => Date = () => new Date()) {
  const packets = new FakePacketRepository()
  const packetGateway = new FakePacketGateway()
  const packetUplink = new PacketUplink(packets, packetGateway, connectivity, now)
  return {
    packets,
    packetGateway,
    services: {
      packetDraftReader: new PacketDraftReader(readingsReader),
      lastPacketReader: new LastPacketReader(packets, now),
      packetSender: new PacketSender(readingsReader, packets, packetUplink, undefined, now),
      packetUplink,
    },
  }
}

/** The device-reading services (#22) on fakes: the gateway is started, the test emits through `readings`. */
export function observationFakes(checkIns: CheckInHistory, now: () => Date = () => new Date(), seed: Observation[] = []) {
  const observations = new FakeObservationRepository()
  seed.forEach((o) => observations.items.set(o.id, o))
  const readings = new FakeReadingSource()
  const healthGateway = new PersonalHealthGateway(readings, observations, now)
  healthGateway.start()
  return { observations, readings, healthGateway, history: new CombinedObservationHistory(checkIns, observations) }
}

/** The whole app on fakes, with a clock the test moves. */
export function setup({
  now = '2026-11-14T09:30:00Z',
  seed = [] as CheckIn[],
  observationSeed = [] as Observation[],
  online = true,
  placeholders = [] as Placeholder[],
  rules = ruleRows as Rule[],
  routinePlaceholders = [] as RoutinePlaceholder[],
  readingPlaceholders = [] as ReadingPlaceholder[],
  random = () => 0,
} = {}) {
  const clock = { now: new Date(now) }
  const repository = new FakeRepository()
  seed.forEach((c) => repository.items.set(c.id, { checkIn: c, pending: false }))
  const connectivity = new FakeConnectivity()
  connectivity.online = online
  const gateway = new FakeGateway()
  const ruleSource = new FakeRuleSource(rules)
  const synchronizer = new SyncService(repository, gateway, connectivity)
  const device = observationFakes(repository, () => clock.now, observationSeed)
  const readingsReader = new LatestReadingsReader(ruleSource, device.history, () => clock.now, readingPlaceholders)
  const packet = packetFakes(readingsReader, connectivity, () => clock.now)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder: new CheckInRecorder(repository, synchronizer, undefined, () => clock.now),
    statusReader: new SystemStatusReader(ruleSource, device.history, () => clock.now, placeholders),
    healthGateway: device.healthGateway,
    readingsReader,
    routineReader: new RoutineReader(repository, () => clock.now, routinePlaceholders),
    random,
    ...packet.services,
  }
  return {
    clock,
    repository,
    observations: device.observations,
    readings: device.readings,
    gateway,
    ruleSource,
    connectivity,
    statusReader: services.statusReader,
    routineReader: services.routineReader,
    readingsReader,
    packets: packet.packets,
    packetGateway: packet.packetGateway,
    packetUplink: packet.services.packetUplink,
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
