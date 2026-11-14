import type { LatestReading } from '../domain/readings'
import { useServices } from './ServicesContext'
import { usePeriodicRead, type PeriodicState } from './usePeriodicRead'

export type LatestReadingsState = PeriodicState<LatestReading[]>

export function useLatestReadings(): { state: LatestReadingsState; refresh: () => void } {
  const { readingsReader } = useServices()
  return usePeriodicRead(readingsReader)
}
