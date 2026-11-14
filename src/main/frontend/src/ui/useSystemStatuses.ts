import type { SystemStatus } from '../domain/rules'
import { useServices } from './ServicesContext'
import { usePeriodicRead, type PeriodicState } from './usePeriodicRead'

export type StatusListState = PeriodicState<SystemStatus[]>

export function useSystemStatuses(): { state: StatusListState; refresh: () => void } {
  const { statusReader } = useServices()
  return usePeriodicRead(statusReader)
}
