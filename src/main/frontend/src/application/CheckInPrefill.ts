import { CHECK_IN_STEPS, type NumberStep } from '../domain/checkInSteps'
import type { ObservationSource } from '../domain/observation'
import type { ObservationHistory } from '../domain/ports'
import { latestReading } from './evaluate'

/** A team heuristic, not a clinical value: an older device reading doesn't prefill the check-in. */
export const PREFILL_MAX_AGE_MS = 15 * 60_000

export type Prefill = Partial<Record<NumberStep['field'], { value: number; source: ObservationSource; recordedAt: string }>>

/** Values for the check-in's number steps from the newest device reading, which the astronaut confirms or corrects (#55). */
export class CheckInPrefill {
  constructor(private readonly devices: ObservationHistory) {}

  async read(openedAt: Date): Promise<Prefill> {
    const observations = await this.devices.list()
    const prefill: Prefill = {}
    for (const step of CHECK_IN_STEPS) {
      if (step.kind !== 'number') continue
      const reading = latestReading(observations, step.field, step.min, step.max, [])
      if (!reading || openedAt.getTime() - reading.time > PREFILL_MAX_AGE_MS) continue
      prefill[step.field] = { value: Math.round(reading.value / step.step) * step.step, source: reading.source, recordedAt: reading.recordedAt }
    }
    return prefill
  }
}
