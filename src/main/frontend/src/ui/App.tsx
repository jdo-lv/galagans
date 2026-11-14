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
    <main>
      <h1>Crew Health Companion</h1>
      <StatusBar online={online} pending={pending} />
      <SystemStatusList state={statuses.state} />
      <CheckInForm
        onSubmit={async (draft) => {
          await recorder.record(draft)
          refresh()
          statuses.refresh()
        }}
      />
    </main>
  )
}
