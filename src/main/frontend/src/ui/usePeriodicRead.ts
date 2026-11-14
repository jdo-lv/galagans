import { useCallback, useEffect, useRef, useState } from 'react'

const REREAD_MS = 60_000

export type PeriodicState<T> = { kind: 'loading' } | { kind: 'unavailable' } | { kind: 'ready'; data: T; now: Date }

/** Reads on mount, on `refresh()` and every 60 s, so data ages keep moving. */
export function usePeriodicRead<T>(reader: { read(): Promise<T>; now: () => Date }): {
  state: PeriodicState<T>
  refresh: () => void
} {
  const [state, setState] = useState<PeriodicState<T>>({ kind: 'loading' })
  const latest = useRef(0)

  const refresh = useCallback(() => {
    const request = ++latest.current
    // Only the newest read may update the state, so a slow earlier read can't overwrite it.
    reader.read().then(
      (data) => request === latest.current && setState({ kind: 'ready', data, now: reader.now() }),
      () => request === latest.current && setState({ kind: 'unavailable' }),
    )
  }, [reader])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, REREAD_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return { state, refresh }
}
