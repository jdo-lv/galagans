import { AppHeader } from './AppHeader'
import { CheckInForm } from './CheckInForm'
import { LatestReadings } from './LatestReadings'
import { StatusBar } from './StatusBar'
import { SystemStatusList } from './SystemStatusList'
import { TodaysRoutine } from './TodaysRoutine'
import { useServices } from './ServicesContext'
import { useLatestReadings } from './useLatestReadings'
import { useOnlineStatus } from './useOnlineStatus'
import { usePendingCount } from './usePendingCount'
import { usePeriodicRead } from './usePeriodicRead'
import { useSystemStatuses } from './useSystemStatuses'

export function App() {
  const { recorder, routineReader } = useServices()
  const online = useOnlineStatus()
  const { pending, refresh } = usePendingCount()
  const statuses = useSystemStatuses()
  const readings = useLatestReadings()
  const routine = usePeriodicRead(routineReader)

  return (
    <div className="app">
      <AppHeader />
      <StatusBar online={online} pending={pending} />
      <main className="layout">
        <SystemStatusList state={statuses.state} />
        <div className="stack">
          <TodaysRoutine state={routine.state} onStart={() => document.querySelector<HTMLInputElement>('input[name="heartRate"]')?.focus()} />
          <LatestReadings state={readings.state} />
          <section className="card" aria-labelledby="checkin-heading">
            <h2 id="checkin-heading" className="card-heading">
              Check-in
            </h2>
            <CheckInForm
              onSubmit={async (draft) => {
                await recorder.record(draft)
                refresh()
                statuses.refresh()
                readings.refresh()
                routine.refresh()
              }}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
