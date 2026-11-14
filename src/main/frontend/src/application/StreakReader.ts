import type { CheckIn } from '../domain/checkIn'
import type { CheckInHistory } from '../domain/ports'
import { PVT_EVERY_MS } from '../domain/readings'
import type { DayKind, ProcessCounter, RoutineStreak, SeedDay, StreakDay } from '../domain/streak'

const DAYS_SHOWN = 14
const PVT_WINDOW_DAYS = 28
const PVT_EVERY_DAYS = Math.round(PVT_EVERY_MS / (24 * 60 * 60 * 1000))

/** Local calendar date "YYYY-MM-DD". */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// By calendar day, never by 24-hour steps: the windows cross clock changes.
function daysBack(day: Date, n: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - n)
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function byDay(checkIns: CheckIn[]): Map<string, CheckIn[]> {
  const days = new Map<string, CheckIn[]>()
  for (const c of checkIns) {
    const key = dayKey(new Date(c.recordedAt))
    days.set(key, [...(days.get(key) ?? []), c])
  }
  return days
}

/**
 * The routine streak after a check-in (F13). A morning check-in is any non-PVT check-in, empty ones included (#10).
 * The synthetic seed fills only the days before the first real check-in day, so it never hides a real miss.
 */
export class StreakReader {
  constructor(
    private readonly history: CheckInHistory,
    /** Public so the check-in screen times itself on the same clock. */
    readonly now: () => Date = () => new Date(),
    private readonly seed: SeedDay[] = [],
    private readonly placeholders: ProcessCounter[] = [],
  ) {}

  async read(): Promise<RoutineStreak> {
    const now = this.now()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const checkIns = await this.history.list()
    const real = byDay(checkIns.filter((c) => c.pvtMedianMs === undefined))
    const firstReal = [...real.keys()].sort()[0] ?? dayKey(today)
    const seeded = new Map(this.seed.map((s) => [dayKey(daysBack(fromKey(firstReal), s.daysBefore)), s.kind]))

    const dayAt = (n: number): StreakDay => {
      const date = dayKey(daysBack(today, n))
      if (date >= firstReal) return { date, kind: realKind(real.get(date)), synthetic: false }
      const kind = seeded.get(date)
      return kind ? { date, kind, synthetic: true } : { date, kind: 'missed', synthetic: false }
    }

    let count = 0
    let countedSeed = false
    for (let n = 0; ; n++) {
      const day = dayAt(n)
      if (day.kind === 'missed') {
        if (n === 0) continue // today isn't over
        break
      }
      countedSeed ||= day.synthetic
      if (day.kind !== 'paused') count++
    }

    const days = Array.from({ length: DAYS_SHOWN }, (_, i) => dayAt(DAYS_SHOWN - 1 - i))
    const usedSeed = countedSeed || days.some((d) => d.synthetic)
    return {
      count,
      days,
      ...(usedSeed && { seededBefore: firstReal }),
      counters: [...this.placeholders, pvtSessions(checkIns, today)],
      symptomDays: symptomDays(real, today),
    }
  }
}

function realKind(checkIns: CheckIn[] | undefined): DayKind {
  if (!checkIns) return 'missed'
  return checkIns.some((c) => c.symptoms.length > 0) ? 'reported' : 'done'
}

function symptomDays(real: Map<string, CheckIn[]>, today: Date): Record<string, number> {
  const loggedOn = (n: number, id: string) => real.get(dayKey(daysBack(today, n)))?.some((c) => c.symptoms.includes(id)) ?? false
  const todayIds = new Set((real.get(dayKey(today)) ?? []).flatMap((c) => c.symptoms))
  const result: Record<string, number> = {}
  for (const id of todayIds) {
    let n = 0
    while (loggedOn(n, id)) n++
    result[id] = n
  }
  return result
}

function pvtSessions(checkIns: CheckIn[], today: Date): ProcessCounter {
  const window = new Set(Array.from({ length: PVT_WINDOW_DAYS }, (_, n) => dayKey(daysBack(today, n))))
  const days = new Set(checkIns.filter((c) => c.pvtMedianMs !== undefined).map((c) => dayKey(new Date(c.recordedAt))))
  const done = [...days].filter((d) => window.has(d)).length
  return {
    label: 'PVT sessions',
    value: `${done} of ${PVT_WINDOW_DAYS / PVT_EVERY_DAYS}`,
    detail: `every ${PVT_EVERY_DAYS}th day, last ${PVT_WINDOW_DAYS} days`,
  }
}
