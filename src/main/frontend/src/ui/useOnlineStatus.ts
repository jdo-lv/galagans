import { useSyncExternalStore } from 'react'
import { useServices } from './ServicesContext'

export function useOnlineStatus(): boolean {
  const { connectivity } = useServices()
  return useSyncExternalStore(
    (onChange) => connectivity.subscribe(onChange),
    () => connectivity.isOnline(),
  )
}
