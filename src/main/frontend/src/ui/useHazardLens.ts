import { useCallback, useState } from 'react'
import { HAZARDS, type Hazard, type HazardId } from '../domain/hazards'

/** One hazard at a time; picking the selected one again turns the lens off. */
export function useHazardLens(): { selected: Hazard | null; toggle: (id: HazardId) => void } {
  const [selectedId, setSelectedId] = useState<HazardId | null>(null)

  const toggle = useCallback((id: HazardId) => {
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  return { selected: HAZARDS.find((h) => h.id === selectedId) ?? null, toggle }
}
