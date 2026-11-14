import type { CheckIn } from '../domain/checkIn'
import type { CheckInHistory } from '../domain/ports'
import { PVT_EVERY_MS } from '../domain/readings'
import {
  CHECK_IN_ROUTINE,
  type CheckInRoutineItem,
  type PvtRoutineItem,
  type RoutineItem,
  type RoutinePlaceholder,
  type RoutineState,
} from '../domain/routine'

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
    const checkIns = await this.history.list()
    // A PVT result is not the morning check-in; an empty check-in still is (#10).
    const doneAt = firstToday(checkIns.filter((c) => c.pvtMedianMs === undefined), now)
    const checkIn: CheckInRoutineItem = { kind: 'check-in', ...CHECK_IN_ROUTINE, state: doneAt ? 'done' : stateAt(now), doneAt }
    const pvts = checkIns.filter((c) => c.pvtMedianMs !== undefined)
    const pvtDoneAt = firstToday(pvts, now)
    const lastPvt = Math.max(...pvts.map((c) => Date.parse(c.recordedAt)).filter(Number.isFinite))
    const due = !(now.getTime() - lastPvt < PVT_EVERY_MS)
    const pvt: PvtRoutineItem = pvtDoneAt ? { kind: 'pvt', label: 'PVT (3 min)', doneAt: pvtDoneAt, due } : { kind: 'pvt', label: 'PVT (3 min)', due }
    return [checkIn, pvt, ...this.placeholders]
  }
}
