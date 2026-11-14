import { CheckInForm } from './CheckInForm'
import { StatusBar } from './StatusBar'
import { useServices } from './ServicesContext'
import { useOnlineStatus } from './useOnlineStatus'
import { usePendingCount } from './usePendingCount'

export function App() {
  const { recorder } = useServices()
  const online = useOnlineStatus()
  const { pending, refresh } = usePendingCount()

  return (
    <main>
      <h1>Crew Health Companion</h1>
      <StatusBar online={online} pending={pending} />
      <CheckInForm
        onSubmit={async (draft) => {
          await recorder.record(draft)
          refresh()
        }}
      />
    </main>
  )
}
