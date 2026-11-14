import { CheckInRecorder, type CheckInRecording } from './application/CheckInRecorder'
import { HealthBriefing } from './application/HealthBriefing'
import { CombinedObservationHistory } from './application/CombinedObservationHistory'
import { LastPacketReader } from './application/LastPacketReader'
import { LatestReadingsReader } from './application/LatestReadingsReader'
import { PacketDraftReader } from './application/PacketDraftReader'
import { PacketSender } from './application/PacketSender'
import { PacketUplink } from './application/PacketUplink'
import { PersonalHealthGateway } from './application/PersonalHealthGateway'
import { RoutineReader } from './application/RoutineReader'
import { StreakReader } from './application/StreakReader'
import { SyncService } from './application/SyncService'
import type { Synchronizer } from './application/Synchronizer'
import { SystemStatusReader } from './application/SystemStatusReader'
import { VoiceSession } from './application/VoiceSession'
import { DEVICES } from './domain/devices'
import type { CheckInRepository, ConnectivityMonitor } from './domain/ports'
import { BrowserConnectivityMonitor } from './infrastructure/BrowserConnectivityMonitor'
import { HttpCheckInGateway } from './infrastructure/HttpCheckInGateway'
import { HttpPacketGateway } from './infrastructure/HttpPacketGateway'
import { IndexedDbCheckInRepository } from './infrastructure/IndexedDbCheckInRepository'
import { IndexedDbObservationRepository } from './infrastructure/IndexedDbObservationRepository'
import { IndexedDbPacketRepository } from './infrastructure/IndexedDbPacketRepository'
import { JsonRuleSource } from './infrastructure/JsonRuleSource'
import { LlamaVoiceInterpreter } from './infrastructure/LlamaVoiceInterpreter'
import { DeviceLink } from './infrastructure/DeviceLink'
import { WebSocketReadingSource } from './infrastructure/WebSocketReadingSource'
import { mockRoutine } from './infrastructure/mockRoutine'
import { mockStatuses } from './infrastructure/mockStatuses'
import { mockCounters, mockStreakSeed } from './infrastructure/mockStreak'
import ruleRows from './infrastructure/rules.json'
import { PiperSpeechOutput } from './infrastructure/PiperSpeechOutput'
import { WhisperSpeechInput } from './infrastructure/WhisperSpeechInput'

export interface Services {
  recorder: CheckInRecording
  synchronizer: Synchronizer
  repository: CheckInRepository
  connectivity: ConnectivityMonitor
  statusReader: SystemStatusReader
  /** Tells the screens when a device reading was stored. */
  healthGateway: { subscribe(listener: () => void): () => void }
  readingsReader: LatestReadingsReader
  routineReader: RoutineReader
  /** The routine streak after a check-in (#40). */
  streakReader: StreakReader
  /** In [0, 1); the PVT's random wait (#16). */
  random: () => number
  packetDraftReader: PacketDraftReader
  lastPacketReader: LastPacketReader
  packetSender: PacketSender
  packetUplink: Synchronizer
  voiceSession: VoiceSession
}

/** Composition root: the only place that picks concrete implementations. */
export function createServices(): Services & { startSync: () => () => void; startGateway: () => () => void } {
  const repository = new IndexedDbCheckInRepository()
  const connectivity = new BrowserConnectivityMonitor()
  const syncService = new SyncService(repository, new HttpCheckInGateway(), connectivity)
  const observations = new IndexedDbObservationRepository()
  const link = new DeviceLink()
  const gateways = DEVICES.map((device) => new PersonalHealthGateway(new WebSocketReadingSource(link, device.topic), observations, undefined, device))
  const healthGateway = {
    subscribe(listener: () => void) {
      const stops = gateways.map((gateway) => gateway.subscribe(listener))
      return () => stops.forEach((stop) => stop())
    },
  }
  const history = new CombinedObservationHistory(repository, observations)
  const readingsReader = new LatestReadingsReader(new JsonRuleSource(), history)
  const packets = new IndexedDbPacketRepository()
  const packetUplink = new PacketUplink(packets, new HttpPacketGateway(), connectivity)
  const recorder = new CheckInRecorder(repository, syncService)
  const statusReader = new SystemStatusReader(new JsonRuleSource(), history, undefined, mockStatuses)
  const routineReader = new RoutineReader(repository, undefined, mockRoutine)
  // The rows of the Body systems list: rule systems plus placeholders.
  const bodySystems = [...new Set([...ruleRows.map((r) => r.system), ...mockStatuses.map((p) => p.system)])]
  const interpreter = new LlamaVoiceInterpreter('/voice/llm', bodySystems)
  return {
    repository,
    connectivity,
    synchronizer: syncService,
    recorder,
    statusReader,
    healthGateway,
    readingsReader,
    routineReader,
    streakReader: new StreakReader(repository, undefined, mockStreakSeed, mockCounters),
    random: Math.random,
    packetDraftReader: new PacketDraftReader(readingsReader),
    lastPacketReader: new LastPacketReader(packets),
    packetSender: new PacketSender(readingsReader, packets, packetUplink),
    packetUplink,
    // The voice host (voice-host/compose.yaml) is reached through the /voice proxy in vite.config.ts.
    voiceSession: new VoiceSession(
      new WhisperSpeechInput('/voice/stt'),
      new PiperSpeechOutput('/voice/tts'),
      interpreter,
      recorder,
      new HealthBriefing(statusReader, routineReader),
    ),
    startGateway: () => {
      const stops = gateways.map((gateway) => gateway.start())
      return () => stops.forEach((stop) => stop())
    },
    startSync: () => {
      const stops = [syncService.start(), packetUplink.start()]
      return () => stops.forEach((stop) => stop())
    },
  }
}
