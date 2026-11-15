import type { LatestReading } from '../domain/readings'
import type { CheckInRoutineItem, RoutineItem } from '../domain/routine'

/** Home's layout (ideas/home-variants.md): To do while any input is owed (level 1, alert-levels.md), otherwise Nominal. */
export type HomeVariant = 'nominal' | 'todo'

/** One input the astronaut owes. `readingKeys` are READINGS keys, `systems` Body systems rows. */
export interface TodoItem {
  id: 'check-in' | 'pvt'
  title: string
  when: string
  why: string
  takes: string
  source: string
  readingKeys: string[]
  systems: string[]
}

/** What Home has read; a read that failed or is pending is missing, so the other sources still show. */
export interface HomeInputs {
  routine?: RoutineItem[]
  readings?: LatestReading[]
}

/** One owed input: a new one is a new row in TODO_SOURCES. */
interface TodoSource {
  item(inputs: HomeInputs): TodoItem | undefined
}

const checkIn: TodoSource = {
  item({ routine }) {
    const row = routine?.find((r): r is CheckInRoutineItem => r.kind === 'check-in')
    if (row?.state !== 'due' && row?.state !== 'missed') return undefined
    return {
      id: 'check-in',
      title: row.label,
      // Overdue stays level 1 (alert-levels.md "Rules" 3).
      when: row.state === 'due' ? `Due ${row.window.start}–${row.window.end}` : `Overdue since ${row.window.end}`,
      why: 'Your daily values keep your own in-flight baseline current; the rules compare every new value with it.',
      takes: row.estimate,
      source: 'crew-health-companion.md, "Schedule" (team example window)',
      readingKeys: ['heartRate', 'spo2', 'sleep', 'mood'],
      systems: ['Cardiovascular', 'Respiratory', 'Cognition'],
    }
  },
}

const pvt: TodoSource = {
  item({ readings }) {
    const reading = readings?.find((r) => r.spec.key === 'pvt')
    if (reading?.state !== 'no-data' && reading?.state !== 'stale') return undefined
    return {
      id: 'pvt',
      title: 'PVT (3 min)',
      when: reading.state === 'no-data' ? 'Every 4th day · no result yet' : 'Every 4th day · none in 4 days',
      why: 'The reaction test is the one objective measure of alertness on board; ISS crews take it every 4th day.',
      takes: '3 min',
      source: 'health-indicators.md §13, ISS Reaction Self Test [S28]',
      readingKeys: ['pvt'],
      systems: ['Cognition'],
    }
  },
}

/** In the order they are listed: what closes first comes first. */
const TODO_SOURCES: TodoSource[] = [checkIn, pvt]

export function homeVariant(inputs: HomeInputs): { variant: HomeVariant; items: TodoItem[] } {
  const items = TODO_SOURCES.map((source) => source.item(inputs)).filter((item): item is TodoItem => item !== undefined)
  return { variant: items.length > 0 ? 'todo' : 'nominal', items }
}
