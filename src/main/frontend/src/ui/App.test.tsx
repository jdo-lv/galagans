import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CheckInRecorder } from '../application/CheckInRecorder'
import { LatestReadingsReader } from '../application/LatestReadingsReader'
import { RoutineReader } from '../application/RoutineReader'
import { SyncService } from '../application/SyncService'
import { SystemStatusReader } from '../application/SystemStatusReader'
import { FakeConnectivity, FakeGateway, FakeRepository, FakeRuleSource } from '../test/fakes'
import { packetFakes, voiceFakes } from '../test/renderApp'
import { App } from './App'
import { ServicesProvider } from './ServicesContext'

function setup(online: boolean) {
  const repository = new FakeRepository()
  const connectivity = new FakeConnectivity()
  connectivity.online = online
  const synchronizer = new SyncService(repository, new FakeGateway(), connectivity)
  const readingsReader = new LatestReadingsReader(new FakeRuleSource(), repository)
  const statusReader = new SystemStatusReader(new FakeRuleSource(), repository)
  const routineReader = new RoutineReader(repository)
  const recorder = new CheckInRecorder(repository, synchronizer)
  const services = {
    repository,
    connectivity,
    synchronizer,
    recorder,
    statusReader,
    readingsReader,
    routineReader,
    random: () => 0,
    voiceSession: voiceFakes({ recorder, statusReader, routineReader }).voiceSession,
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

    await userEvent.type(screen.getByLabelText(/mood/i), '4')
    await userEvent.click(screen.getByRole('button', { name: /save check-in/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Offline · 1 waiting to sync')
  })

  it('shows nothing waiting after a check-in syncs while online', async () => {
    setup(true)

    await userEvent.type(screen.getByLabelText(/mood/i), '4')
    await userEvent.click(screen.getByRole('button', { name: /save check-in/i }))

    expect(await screen.findByText('Online')).toBeInTheDocument()
  })
})
