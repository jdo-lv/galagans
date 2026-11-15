import { useCallback, useEffect, useState } from 'react'
import type { VoiceTarget } from '../domain/voice'

const PREFIX = '#/systems/'

export const systemHref = (system: string) => PREFIX + encodeURIComponent(system)

export const PVT_HASH = '#/pvt'

export const PACKET_HREF = '#/packet'

export const CHECK_IN_HASH = '#/check-in'

export const STATS_HASH = '#/stats'

export const ADD_HASH = '#/add'

export const SYMPTOMS_HASH = '#/symptoms'

export const GROUND_HASH = '#/ground'

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
    case 'check-in':
      return CHECK_IN_HASH
  }
}

export type Route =
  | { kind: 'home' }
  | { kind: 'system'; system: string }
  | { kind: 'pvt' }
  | { kind: 'packet' }
  | { kind: 'check-in' }
  | { kind: 'stats' }
  | { kind: 'add' }
  | { kind: 'symptoms' }
  | { kind: 'ground' }
  | { kind: 'unknown' }

const LEAVES_TO_HOME: Route['kind'][] = ['system', 'pvt', 'packet', 'check-in', 'stats', 'add', 'symptoms', 'ground']

export function parseHash(hash: string): Route {
  if (hash === '' || hash === '#' || hash === '#/') return { kind: 'home' }
  if (hash === PVT_HASH) return { kind: 'pvt' }
  if (hash === PACKET_HREF) return { kind: 'packet' }
  if (hash === CHECK_IN_HASH) return { kind: 'check-in' }
  if (hash === STATS_HASH) return { kind: 'stats' }
  if (hash === ADD_HASH) return { kind: 'add' }
  if (hash === SYMPTOMS_HASH) return { kind: 'symptoms' }
  if (hash === GROUND_HASH) return { kind: 'ground' }
  const rest = hash.startsWith(PREFIX) ? hash.slice(PREFIX.length) : ''
  if (rest === '' || rest.includes('/')) return { kind: 'unknown' }
  try {
    return { kind: 'system', system: decodeURIComponent(rest) }
  } catch {
    return { kind: 'unknown' }
  }
}

/**
 * The screen from `location.hash`. `returnedHome` is true when the user came back from a detail, the PVT, the packet, the
 * check-in, Stats, Add entry, Log symptoms or Ground, so Home can move focus; a redirect from an unknown route doesn't count.
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
