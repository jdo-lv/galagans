/** Local "HH:MM"; start inclusive, end exclusive. */
export type TimeWindow = { start: string; end: string }

/** Team example window and estimate (crew-health-companion.md "Schedule"), not a research value. */
export const CHECK_IN_ROUTINE = { label: 'Morning check-in', window: { start: '07:00', end: '09:00' }, estimate: '~1.5 min' }

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

export type RoutineItem = CheckInRoutineItem | RoutinePlaceholder
