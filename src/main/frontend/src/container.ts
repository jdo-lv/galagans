import { CheckInRecorder, type CheckInRecording } from './application/CheckInRecorder'
import { CombinedObservationHistory } from './application/CombinedObservationHistory'
import { LastPacketReader } from './application/LastPacketReader'
import { LatestReadingsReader } from './application/LatestReadingsReader'
import { PacketDraftReader } from './application/PacketDraftReader'
import { PacketSender } from './application/PacketSender'
import { PacketUplink } from './application/PacketUplink'
import { PersonalHealthGateway } from './application/PersonalHealthGateway'
import { RoutineReader } from './application/RoutineReader'
import { SyncService } from './application/SyncService'
import type { Synchronizer } from './application/Synchronizer'
import { SystemStatusReader } from './application/SystemStatusReader'
import { DEVICES } from './domain/devices'
import type { CheckInRepository, ConnectivityMonitor } from './domain/ports'
import { BrowserConnectivityMonitor } from './infrastructure/BrowserConnectivityMonitor'
import { HttpCheckInGateway } from './infrastructure/HttpCheckInGateway'
import { HttpPacketGateway } from './infrastructure/HttpPacketGateway'
import { IndexedDbCheckInRepository } from './infrastructure/IndexedDbCheckInRepository'
import { IndexedDbObservationRepository } from './infrastructure/IndexedDbObservationRepository'
import { IndexedDbPacketRepository } from './infrastructure/IndexedDbPacketRepository'
import { JsonRuleSource } from './infrastructure/JsonRuleSource'
import { DeviceLink } from './infrastructure/DeviceLink'
import { WebSocketReadingSource } from './infrastructure/WebSocketReadingSource'
import { mockRoutine } from './infrastructure/mockRoutine'
import { mockStatuses } from './infrastructure/mockStatuses'

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
  /** In [0, 1); the PVT's random wait (#16). */
  random: () => number
  packetDraftReader: PacketDraftReader
  lastPacketReader: LastPacketReader
  packetSender: PacketSender
  packetUplink: Synchronizer
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
  return {
    repository,
    connectivity,
    synchronizer: syncService,
    recorder: new CheckInRecorder(repository, syncService),
    statusReader: new SystemStatusReader(new JsonRuleSource(), history, undefined, mockStatuses),
    healthGateway,
    readingsReader,
    routineReader: new RoutineReader(repository, undefined, mockRoutine),
    random: Math.random,
    packetDraftReader: new PacketDraftReader(readingsReader),
    lastPacketReader: new LastPacketReader(packets),
    packetSender: new PacketSender(readingsReader, packets, packetUplink),
    packetUplink,
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
