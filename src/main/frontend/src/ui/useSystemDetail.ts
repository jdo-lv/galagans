import { useMemo } from 'react'
import type { SystemDetail } from '../domain/rules'
import { useServices } from './ServicesContext'
import { usePeriodicRead, type PeriodicState } from './usePeriodicRead'

export type SystemDetailState = PeriodicState<SystemDetail | undefined>

export function useSystemDetail(system: string): SystemDetailState {
  const { statusReader } = useServices()
  const reader = useMemo(() => ({ read: () => statusReader.readDetail(system), now: statusReader.now }), [statusReader, system])
  return usePeriodicRead(reader).state
}
