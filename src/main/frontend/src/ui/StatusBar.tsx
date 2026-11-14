import { CloudOffIcon } from './icons'

// Connection is not a health status: neutral pill, quiet when online with nothing waiting.
export function StatusBar({ online, pending }: { online: boolean; pending: number }) {
  const quiet = online && pending === 0

  return (
    <p role="status" className={quiet ? 'pill pill--quiet' : 'pill'}>
      {online ? null : <CloudOffIcon />}
      <span>
        {online ? 'Online' : 'Offline'}
        {pending > 0 ? ` · ${pending} waiting to sync` : ''}
      </span>
    </p>
  )
}
