import { CheckInRecorder, type CheckInRecording } from './application/CheckInRecorder'
import { LatestReadingsReader } from './application/LatestReadingsReader'
import { RoutineReader } from './application/RoutineReader'
import { SyncService } from './application/SyncService'
import type { Synchronizer } from './application/Synchronizer'
import { SystemStatusReader } from './application/SystemStatusReader'
import type { CheckInRepository, ConnectivityMonitor } from './domain/ports'
import { BrowserConnectivityMonitor } from './infrastructure/BrowserConnectivityMonitor'
import { HttpCheckInGateway } from './infrastructure/HttpCheckInGateway'
import { IndexedDbCheckInRepository } from './infrastructure/IndexedDbCheckInRepository'
import { JsonRuleSource } from './infrastructure/JsonRuleSource'
import { mockReadings } from './infrastructure/mockReadings'
import { mockRoutine } from './infrastructure/mockRoutine'
import { mockStatuses } from './infrastructure/mockStatuses'

export interface Services {
  recorder: CheckInRecording
  synchronizer: Synchronizer
  repository: CheckInRepository
  connectivity: ConnectivityMonitor
  statusReader: SystemStatusReader
  readingsReader: LatestReadingsReader
  routineReader: RoutineReader
}

/** Composition root: the only place that picks concrete implementations. */
export function createServices(): Services & { startSync: () => () => void } {
  const repository = new IndexedDbCheckInRepository()
  const connectivity = new BrowserConnectivityMonitor()
  const syncService = new SyncService(repository, new HttpCheckInGateway(), connectivity)
  return {
    repository,
    connectivity,
    synchronizer: syncService,
    recorder: new CheckInRecorder(repository, syncService),
    statusReader: new SystemStatusReader(new JsonRuleSource(), repository, undefined, mockStatuses),
    readingsReader: new LatestReadingsReader(new JsonRuleSource(), repository, undefined, mockReadings),
    routineReader: new RoutineReader(repository, undefined, mockRoutine),
    startSync: () => syncService.start(),
  }
}
