import { useCallback, useEffect, useState } from 'react'
import type { VoiceTarget } from '../domain/voice'

const PREFIX = '#/systems/'

export const systemHref = (system: string) => PREFIX + encodeURIComponent(system)

export const PVT_HASH = '#/pvt'

export const PACKET_HREF = '#/packet'

export const CHECK_IN_HASH = '#/check-in'

/** The hash of a screen a voice command opens. */
export function voiceHref(target: VoiceTarget): string {
  switch (target.screen) {
    case 'home':
      return '#/'
    case 'system':
      return systemHref(target.system)
    case 'pvt':
      return PVT_HASH
    case 'packet':
      return PACKET_HREF
  }
}

export type Route = { kind: 'home' } | { kind: 'system'; system: string } | { kind: 'pvt' } | { kind: 'packet' } | { kind: 'check-in' } | { kind: 'unknown' }

const LEAVES_TO_HOME: Route['kind'][] = ['system', 'pvt', 'packet', 'check-in']

export function parseHash(hash: string): Route {
  if (hash === '' || hash === '#' || hash === '#/') return { kind: 'home' }
  if (hash === PVT_HASH) return { kind: 'pvt' }
  if (hash === PACKET_HREF) return { kind: 'packet' }
  if (hash === CHECK_IN_HASH) return { kind: 'check-in' }
  const rest = hash.startsWith(PREFIX) ? hash.slice(PREFIX.length) : ''
  if (rest === '' || rest.includes('/')) return { kind: 'unknown' }
  try {
    return { kind: 'system', system: decodeURIComponent(rest) }
  } catch {
    return { kind: 'unknown' }
  }
}

/**
 * The screen from `location.hash`. `returnedHome` is true when the user came back from a detail, the PVT, the packet or the
 * check-in, so Home can move focus; a redirect from an unknown route doesn't count.
 */
export function useHashRoute(): { route: Route; returnedHome: boolean; goHome: (options?: { returned?: boolean }) => void } {
  const [state, setState] = useState(() => ({ route: parseHash(window.location.hash), returnedHome: false }))

  useEffect(() => {
    const onChange = () =>
      setState((previous) => {
        const route = parseHash(window.location.hash)
        return { route, returnedHome: route.kind === 'home' && LEAVES_TO_HOME.includes(previous.route.kind) }
      })
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  // replaceState fires no hashchange, so the state is set here too.
  const goHome = useCallback((options?: { returned?: boolean }) => {
    window.history.replaceState(null, '', '#/')
    setState({ route: { kind: 'home' }, returnedHome: options?.returned ?? false })
  }, [])

  return { ...state, goHome }
}
