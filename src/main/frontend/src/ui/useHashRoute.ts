import { useCallback, useEffect, useState } from 'react'

const PREFIX = '#/systems/'

export const systemHref = (system: string) => PREFIX + encodeURIComponent(system)

export const PVT_HASH = '#/pvt'

export type Route = { kind: 'home' } | { kind: 'system'; system: string } | { kind: 'pvt' } | { kind: 'unknown' }

export function parseHash(hash: string): Route {
  if (hash === '' || hash === '#' || hash === '#/') return { kind: 'home' }
  if (hash === PVT_HASH) return { kind: 'pvt' }
  const rest = hash.startsWith(PREFIX) ? hash.slice(PREFIX.length) : ''
  if (rest === '' || rest.includes('/')) return { kind: 'unknown' }
  try {
    return { kind: 'system', system: decodeURIComponent(rest) }
  } catch {
    return { kind: 'unknown' }
  }
}

/**
 * The screen from `location.hash`. `returnedHome` is true when the user came back from a detail or the PVT,
 * so Home can move focus; a redirect from an unknown route doesn't count.
 */
export function useHashRoute(): { route: Route; returnedHome: boolean; goHome: () => void } {
  const [state, setState] = useState(() => ({ route: parseHash(window.location.hash), returnedHome: false }))

  useEffect(() => {
    const onChange = () =>
      setState((previous) => {
        const route = parseHash(window.location.hash)
        return { route, returnedHome: route.kind === 'home' && (previous.route.kind === 'system' || previous.route.kind === 'pvt') }
      })
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  // replaceState fires no hashchange, so the state is set here too.
  const goHome = useCallback(() => {
    window.history.replaceState(null, '', '#/')
    setState({ route: { kind: 'home' }, returnedHome: false })
  }, [])

  return { ...state, goHome }
}
