import type { ConnectivityMonitor } from '../domain/ports'

export class BrowserConnectivityMonitor implements ConnectivityMonitor {
  isOnline(): boolean {
    return navigator.onLine
  }

  subscribe(listener: (online: boolean) => void): () => void {
    const onOnline = () => listener(true)
    const onOffline = () => listener(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }
}
