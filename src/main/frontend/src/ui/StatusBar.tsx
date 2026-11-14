export function StatusBar({ online, pending }: { online: boolean; pending: number }) {
  return (
    <p role="status">
      {online ? 'Online' : 'Offline'}
      {pending > 0 ? ` · ${pending} waiting to sync` : ''}
    </p>
  )
}
