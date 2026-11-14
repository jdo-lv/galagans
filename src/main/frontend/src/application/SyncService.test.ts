import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkIn, FakeConnectivity, FakeGateway, FakeObservationRepository, FakeReadingSource, FakeRepository } from '../test/fakes'
import { PersonalHealthGateway } from './PersonalHealthGateway'
import { SyncService } from './SyncService'

describe('SyncService', () => {
  let repository: FakeRepository
  let gateway: FakeGateway
  let connectivity: FakeConnectivity
  let service: SyncService

  beforeEach(async () => {
    repository = new FakeRepository()
    gateway = new FakeGateway()
    connectivity = new FakeConnectivity()
    service = new SyncService(repository, gateway, connectivity)
    await repository.add(checkIn('a'))
  })

  it('sends pending check-ins and marks them synced when online', async () => {
    await service.sync()

    expect(gateway.sent).toHaveLength(1)
    expect(await repository.countPending()).toBe(0)
  })

  it('sends nothing while offline', async () => {
    connectivity.online = false

    await service.sync()

    expect(gateway.sent).toHaveLength(0)
    expect(await repository.countPending()).toBe(1)
  })

  it('keeps check-ins pending when the server call fails', async () => {
    gateway.fail = true

    await service.sync()

    expect(await repository.countPending()).toBe(1)
  })

  it('runs one send for concurrent syncs', async () => {
    await Promise.all([service.sync(), service.sync()])

    expect(gateway.sent).toHaveLength(1)
  })

  it('syncs when the connection comes back', async () => {
    connectivity.online = false
    const stop = service.start()
    await service.sync()
    expect(gateway.sent).toHaveLength(0)

    connectivity.set(true)
    await service.sync()

    expect(gateway.sent).toHaveLength(1)
    stop()
  })

  it('notifies subscribers after each sync', async () => {
    let calls = 0
    service.subscribe(() => calls++)

    await service.sync()

    expect(calls).toBe(1)
  })

  it('AC23: a stored device Observation is not part of what syncs', async () => {
    const source = new FakeReadingSource()
    const observations = new FakeObservationRepository()
    new PersonalHealthGateway(source, observations).start()
    source.emit({ id: 'm1', t: new Date().toISOString(), spo2_pct: 91, src: 'synthetic' })
    await vi.waitFor(() => expect(observations.items.size).toBe(1))

    await service.sync()

    expect(gateway.sent).toEqual([[checkIn('a')]])
  })
})
