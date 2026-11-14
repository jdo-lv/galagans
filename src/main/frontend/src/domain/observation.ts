import type { CheckIn } from './checkIn'
import type { DeviceLabel } from './devices'
import { READINGS } from './readings'
import type { Indicator } from './rules'

export type DeviceSource = `${DeviceLabel} · ${'synthetic' | 'replay' | 'proxy'}`
export type ObservationSource = 'manual' | 'in-app test' | DeviceSource

/** FHIR R4-shaped, not validated. */
export interface Observation {
  resourceType: 'Observation'
  id: string
  status: 'final'
  code: { text: Indicator }
  valueQuantity: { value: number; unit: string }
  effectiveDateTime: string
  device: { display: ObservationSource }
}

const CHECK_IN_SOURCE: Partial<Record<Indicator, ObservationSource>> = { pvtMedianMs: 'in-app test' }

/** One Observation per indicator field the check-in has; ids are `<check-in id>:<indicator>`. */
export function fromCheckIn(checkIn: CheckIn): Observation[] {
  const observations: Observation[] = []
  for (const spec of READINGS) {
    const value = (checkIn as Partial<Record<Indicator, unknown>>)[spec.indicator]
    if (typeof value !== 'number') continue
    observations.push({
      resourceType: 'Observation',
      id: `${checkIn.id}:${spec.indicator}`,
      status: 'final',
      code: { text: spec.indicator },
      valueQuantity: { value, unit: spec.unit },
      effectiveDateTime: checkIn.recordedAt,
      device: { display: CHECK_IN_SOURCE[spec.indicator] ?? 'manual' },
    })
  }
  return observations
}
