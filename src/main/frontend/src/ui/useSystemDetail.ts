import { useEffect, useMemo } from 'react'
import type { SystemDetail } from '../domain/rules'
import { useServices } from './ServicesContext'
import { usePeriodicRead, type PeriodicState } from './usePeriodicRead'

export type SystemDetailState = PeriodicState<SystemDetail | undefined>

export function useSystemDetail(system: string): SystemDetailState {
  const { statusReader, healthGateway } = useServices()
  const reader = useMemo(() => ({ read: () => statusReader.readDetail(system), now: statusReader.now }), [statusReader, system])
  const { state, refresh } = usePeriodicRead(reader)
  useEffect(() => healthGateway.subscribe(refresh), [healthGateway, refresh])
  return state
}
