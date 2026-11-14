import { useCallback, useEffect, useRef, useState } from 'react'
import type { SystemStatus } from '../domain/rules'
import { useServices } from './ServicesContext'

const REREAD_MS = 60_000

export type StatusListState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'ready'; statuses: SystemStatus[]; now: Date }

export function useSystemStatuses(): { state: StatusListState; refresh: () => void } {
  const { statusReader } = useServices()
  const [state, setState] = useState<StatusListState>({ kind: 'loading' })
  const latest = useRef(0)

  const refresh = useCallback(() => {
    const request = ++latest.current
    // Only the newest read may update the list, so a slow earlier read can't overwrite it.
    statusReader.read().then(
      (statuses) => request === latest.current && setState({ kind: 'ready', statuses, now: statusReader.now() }),
      () => request === latest.current && setState({ kind: 'unavailable' }),
    )
  }, [statusReader])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, REREAD_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return { state, refresh }
}
