import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { RoutineReader } from '../application/RoutineReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from '../test/fakes'
import { observationFakes, packetFakes, saveCheckIn } from '../test/renderApp'
import { App } from './App'
import { ServicesProvider } from './ServicesContext'

function setup(online: boolean) {
  const repository = new FakeRepository()
  const connectivity = new FakeConnectivity()
  connectivity.online = online
  const synchronizer = new SyncService(repository, new FakeGateway(), connectivity)
  const device = observationFakes(repository)
  const readingsReader = new LatestReadingsReader(new FakeRuleSource(), device.history)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder: new CheckInRecorder(repository, synchronizer),
    statusReader: new SystemStatusReader(new FakeRuleSource(), device.history),
    healthGateway: device.healthGateway,
    readingsReader,
    routineReader: new RoutineReader(repository),
    random: () => 0,
    ...packetFakes(readingsReader, connectivity).services,
  }
  render(
    <ServicesProvider services={services}>
      <App />
    </ServicesProvider>,
  )
}

describe('App', () => {
  it('shows a saved check-in as waiting to sync while offline', async () => {
    setup(false)

    await saveCheckIn({ mood: 4 })

    expect(await screen.findByRole('status')).toHaveTextContent('Offline · 1 waiting to sync')
  })

  it('shows nothing waiting after a check-in syncs while online', async () => {
    setup(true)

    await saveCheckIn({ mood: 4 })

    expect(await screen.findByText('Online')).toBeInTheDocument()
  })
})
