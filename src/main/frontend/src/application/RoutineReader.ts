import type { CheckIn } from '../domain/checkIn'
import type { CheckInHistory } from '../domain/ports'
import { CHECK_IN_ROUTINE, type CheckInRoutineItem, type RoutineItem, type RoutinePlaceholder, type RoutineState } from '../domain/routine'

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))

function stateAt(now: Date): RoutineState {
  const time = now.getHours() * 60 + now.getMinutes()
  if (time < minutes(CHECK_IN_ROUTINE.window.start)) return 'upcoming'
  return time < minutes(CHECK_IN_ROUTINE.window.end) ? 'due' : 'missed'
}

/** Earliest check-in on the local calendar date of `now`, if any. */
function firstToday(checkIns: CheckIn[], now: Date): string | undefined {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const times = checkIns
    .map((c) => ({ recordedAt: c.recordedAt, time: Date.parse(c.recordedAt) }))
    .filter((c) => c.time >= midnight && c.time < midnight + 24 * 60 * 60_000)
  return times.sort((a, b) => a.time - b.time)[0]?.recordedAt
}

export class RoutineReader {
  constructor(
    private readonly history: CheckInHistory,
    /** Public so the UI prints times against the same clock the states used. */
    readonly now: () => Date = () => new Date(),
    private readonly placeholders: RoutinePlaceholder[] = [],
  ) {}

  async read(): Promise<RoutineItem[]> {
    const now = this.now()
    const doneAt = firstToday(await this.history.list(), now)
    const checkIn: CheckInRoutineItem = { kind: 'check-in', ...CHECK_IN_ROUTINE, state: doneAt ? 'done' : stateAt(now), doneAt }
    return [checkIn, ...this.placeholders]
  }
}
