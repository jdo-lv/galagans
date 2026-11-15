import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckInPrefill } from '../application/CheckInPrefill'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LastPacketReader } from '../application/LastPacketReader'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { PacketDraftReader } from '../application/PacketDraftReader'
import { PacketHistoryReader } from '../application/PacketHistoryReader'
import { PacketSender } from '../application/PacketSender'
import { PacketUplink } from '../application/PacketUplink'
import { PersonalHealthGateway } from '../application/PersonalHealthGateway'
import { CombinedObservationHistory } from '../application/CombinedObservationHistory'
import { RoutineReader } from '../application/RoutineReader'
import { StreakReader } from '../application/StreakReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import { HealthBriefing } from '../application/HealthBriefing'
import type { RoutineReader as RoutineReading } from '../application/RoutineReader'
import { VoiceSession } from '../application/VoiceSession'
import type { CheckIn } from '../domain/checkIn'
import type { Observation } from '../domain/observation'
import type { CheckInHistory, ConnectivityMonitor } from '../domain/ports'
import type { RoutinePlaceholder } from '../domain/routine'
import type { ProcessCounter, SeedDay } from '../domain/streak'
import { CHART_WINDOW_MS, type Placeholder } from '../domain/rules'
import { App } from '../ui/App'
import { ServicesProvider } from '../ui/ServicesContext'
import {
  FakeConnectivity,
  FakeGateway,
  FakeObservationRepository,
  FakePacketGateway,
  FakePacketRepository,
  FakeReadingSource,
  FakeRepository,
  FakeRuleSource,
  FakeSpeechInput,
  FakeSpeechOutput,
  FakeVoiceInterpreter,
} from './fakes'
import { RULES } from './rules'

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
      packetHistoryReader: new PacketHistoryReader(packets, now),
      packetSender: new PacketSender(readingsReader, packets, packetUplink, undefined, now),
      packetUplink,
    },
  }
}

/** The voice session (F25) on fakes: what it hears, says and interprets. */
export function voiceFakes({ statusReader, routineReader }: { statusReader: SystemStatusReader; routineReader: RoutineReading }) {
  const voice = { input: new FakeSpeechInput(), output: new FakeSpeechOutput(), interpreter: new FakeVoiceInterpreter() }
  const briefing = new HealthBriefing(statusReader, routineReader)
  return { voice, voiceSession: new VoiceSession(voice.input, voice.output, voice.interpreter, briefing) }
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
  rules = RULES,
  routinePlaceholders = [] as RoutinePlaceholder[],
  streakSeed = [] as SeedDay[],
  counters = [] as ProcessCounter[],
  random = () => 0,
  chartWindowMs = CHART_WINDOW_MS,
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
  const readingsReader = new LatestReadingsReader(ruleSource, device.history, () => clock.now)
  const packet = packetFakes(readingsReader, connectivity, () => clock.now)
  const recorder = new CheckInRecorder(repository, synchronizer, undefined, () => clock.now)
  const statusReader = new SystemStatusReader(ruleSource, device.history, () => clock.now, placeholders, chartWindowMs)
  const routineReader = new RoutineReader(repository, () => clock.now, routinePlaceholders)
  const { voice, voiceSession } = voiceFakes({ statusReader, routineReader })
  const streakReader = new StreakReader(repository, () => clock.now, streakSeed, counters)
  const checkInPrefill = new CheckInPrefill(device.observations)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder,
    statusReader,
    healthGateway: device.healthGateway,
    readingsReader,
    routineReader,
    streakReader,
    random,
    ...packet.services,
    voiceSession,
    checkInPrefill,
  }
  return {
    voice,
    clock,
    repository,
    observations: device.observations,
    readings: device.readings,
    gateway,
    ruleSource,
    connectivity,
    statusReader: services.statusReader,
    routineReader: services.routineReader,
    streakReader,
    readingsReader,
    checkInPrefill,
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

/** Home's readings card: "Latest readings" when Nominal, "Relevant readings" while an input is owed (#52). */
export const readingsPanel = () => screen.getByRole('region', { name: /^(Latest|Relevant) readings$/ })

/** Clicks a link in the navigation bar (#57). */
export async function clickBarLink(name: 'Home' | 'Stats' | 'Add entry' | 'Ground') {
  await userEvent.click(within(await screen.findByRole('navigation', { name: 'Main' })).getByRole('link', { name }))
}

/** Opens the morning check-in the way the crew does from the bar: the + (Add entry), then "Morning check-in" (#57). */
export async function openCheckIn() {
  await clickBarLink('Add entry')
  const chooser = await screen.findByRole('region', { name: 'Add entry' })
  await userEvent.click(within(chooser).getByRole('link', { name: 'Morning check-in' }))
}

/** Saves one check-in through the steps (#29): types or taps each given value, "Next →" everywhere else, never "Skip". */
export async function saveCheckIn(fields: { heartRate?: number; spo2?: number; sleep?: number; kss?: number; mood?: number } = {}) {
  await openCheckIn()
  const checkIn = await screen.findByRole('region', { name: 'Morning check-in' })
  for (const key of ['heartRate', 'spo2', 'sleep', 'kss', 'mood'] as const) {
    const value = fields[key]
    if (value !== undefined && (key === 'kss' || key === 'mood')) await userEvent.click(within(checkIn).getByRole('button', { name: String(value) }))
    else if (value !== undefined) await userEvent.type(within(checkIn).getByRole('spinbutton'), String(value))
    await userEvent.click(within(checkIn).getByRole('button', { name: 'Next →' }))
  }
  await userEvent.click(within(checkIn).getByRole('button', { name: 'Save check-in' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Done' }))
  await screen.findByRole('region', { name: 'Body systems' })
}

export const submitSpo2 = (value: number) => saveCheckIn({ spo2: value })
