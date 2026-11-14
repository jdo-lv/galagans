import { useCallback, useState } from 'react'
import { HAZARDS, type Hazard, type HazardId } from '../domain/hazards'

const STORAGE_KEY = 'crew-health.hazard-lens'

const byId = (id: string | null): Hazard | null => HAZARDS.find((h) => h.id === id) ?? null

function readStoredHazard(): Hazard | null {
  try {
    return byId(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

function storeHazard(id: HazardId | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode): the choice still holds until the app closes.
  }
}

/** One hazard at a time, remembered on the device; picking the selected one again turns the lens off. */
export function useHazardLens(): { selected: Hazard | null; toggle: (id: HazardId) => void } {
  const [selected, setSelected] = useState<Hazard | null>(readStoredHazard)

  const toggle = useCallback(
    (id: HazardId) => {
      const next = selected?.id === id ? null : byId(id)
      setSelected(next)
      storeHazard(next?.id ?? null)
    },
    [selected],
  )

  return { selected, toggle }
}
