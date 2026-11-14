import { AppHeader } from './AppHeader'
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
    <div className="app">
      <AppHeader />
      <StatusBar online={online} pending={pending} />
      <main>
        <CheckInForm
          onSubmit={async (draft) => {
            await recorder.record(draft)
            refresh()
          }}
        />
      </main>
    </div>
  )
}
