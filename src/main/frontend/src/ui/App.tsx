import { CheckInForm } from './CheckInForm'
import { StatusBar } from './StatusBar'
import { SystemStatusList } from './SystemStatusList'
import { useServices } from './ServicesContext'
import { useOnlineStatus } from './useOnlineStatus'
import { usePendingCount } from './usePendingCount'
import { useSystemStatuses } from './useSystemStatuses'

export function App() {
  const { recorder } = useServices()
  const online = useOnlineStatus()
  const { pending, refresh } = usePendingCount()
  const statuses = useSystemStatuses()

  return (
    <>
      <header className="top">
        <h1 className="brand">
          <span className="dot" aria-hidden="true" />
          Crew Health Companion
        </h1>
        <StatusBar online={online} pending={pending} />
      </header>
      <main className="layout">
        <SystemStatusList state={statuses.state} />
        <section className="panel" aria-labelledby="checkin-heading">
          <h2 id="checkin-heading" className="ph">
            Check-in
          </h2>
          <CheckInForm
            onSubmit={async (draft) => {
              await recorder.record(draft)
              refresh()
              statuses.refresh()
            }}
          />
        </section>
      </main>
    </>
  )
}
