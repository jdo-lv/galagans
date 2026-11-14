import { CHECK_IN_SECONDS } from './checkInSteps'

/** Local "HH:MM"; start inclusive, end exclusive. */
export type TimeWindow = { start: string; end: string }

/** Team example window (crew-health-companion.md "Schedule"), not a research value; the estimate sums the check-in steps. */
export const CHECK_IN_ROUTINE = { label: 'Morning check-in', window: { start: '07:00', end: '09:00' }, estimate: `~${CHECK_IN_SECONDS} s` }

export type RoutineState = 'upcoming' | 'due' | 'done' | 'missed'

export type CheckInRoutineItem = {
  kind: 'check-in'
  label: string
  window: TimeWindow
  estimate: string
  state: RoutineState
  /** ISO time of the first check-in today; only for done. */
  doneAt?: string
}

/** Stand-in for a routine item the app can't do yet; has no state and never claims anything happened. */
export type RoutinePlaceholder = { kind: 'placeholder'; label: string; detail: string; source: 'synthetic' }

/** The PVT (#16): done when a PVT result exists today. */
export type PvtRoutineItem = { kind: 'pvt'; label: 'PVT (3 min)'; doneAt?: string; /** No PVT result in the last 4 days (#37). */ due: boolean }

export type RoutineItem = CheckInRoutineItem | PvtRoutineItem | RoutinePlaceholder
