import { fromCheckIn, type Observation } from '../domain/observation'
import type { CheckInHistory, ObservationHistory } from '../domain/ports'

/** Check-ins stay in their own store and sync unchanged; the rules read them mapped to Observations beside the device ones. */
export class CombinedObservationHistory implements ObservationHistory {
  constructor(
    private readonly checkIns: CheckInHistory,
    private readonly observations: ObservationHistory,
  ) {}

  async list(): Promise<Observation[]> {
    const [checkIns, observations] = await Promise.all([this.checkIns.list(), this.observations.list()])
    return [...checkIns.flatMap(fromCheckIn), ...observations]
  }
}
