import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(storageKey: string): Theme | null {
  try {
    const value = localStorage.getItem(storageKey)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function storeTheme(storageKey: string, theme: Theme) {
  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // Storage blocked (private mode): the choice still holds until the app closes.
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia?.(DARK_QUERY)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

function systemPrefersDark(): boolean {
  return window.matchMedia?.(DARK_QUERY).matches ?? false
}

/** Follows the system theme until the crewmember picks one; the pick is remembered on the device. */
export function useTheme(storageKey = 'crew-health.theme'): { theme: Theme; toggle: () => void } {
  const [chosen, setChosen] = useState<Theme | null>(() => readStoredTheme(storageKey))
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, systemPrefersDark)
  const theme: Theme = chosen ?? (systemDark ? 'dark' : 'light')

  useLayoutEffect(() => {
    if (chosen) document.documentElement.dataset.theme = chosen
  }, [chosen])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setChosen(next)
    storeTheme(storageKey, next)
  }, [theme, storageKey])

  return { theme, toggle }
}
