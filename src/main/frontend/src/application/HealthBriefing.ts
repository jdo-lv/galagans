import type { RoutineItem } from '../domain/routine'
import type { Rule, SystemStatus } from '../domain/rules'

const CLOSING = 'This is decision support; your flight surgeon has the final word.'
const NEXT = 'What would you like to do next?'

/**
 * The spoken health briefing (F25), as short as it can be: alerts in their rules' own sourced words, "nominal" for
 * the rest as the rules engine decided, systems without fresh data, what is still to do (the PVT only when due), then
 * the question.
 * No model writes any of it: tested models softened alerts and called missing data normal (research/voice-assistant.md).
 */
export class HealthBriefing {
  constructor(
    private readonly statuses: { read(): Promise<SystemStatus[]> },
    private readonly routine: { read(): Promise<RoutineItem[]> },
  ) {}

  /** Every current alert with the decision-support line, or '' when there is none. */
  async alerts(): Promise<string> {
    const alerts = speakAlerts(await this.statuses.read())
    return alerts && `${alerts} ${CLOSING}`
  }

  /** The whole briefing, or one system's. */
  async brief(system?: string): Promise<string> {
    const all = await this.statuses.read()
    if (system) {
      const statuses = all.filter((s) => s.system === system)
      return [briefOn(statuses, system), speakAlerts(statuses) && CLOSING, NEXT].filter(Boolean).join(' ')
    }

    const alerts = speakAlerts(all)
    const todo = stillToDo(await this.routine.read())
    return [
      alerts,
      theRest(all, Boolean(alerts)),
      ...missingData(all),
      todo.length && `To do today: ${list(todo, 'and')}.`,
      alerts && CLOSING,
      NEXT,
    ]
      .filter(Boolean)
      .join(' ')
  }
}

/** Everything without an alert, as the rules engine decided it. */
function theRest(statuses: SystemStatus[], alerts: boolean): string {
  if (statuses.some((s) => s.state === 'nominal')) return alerts ? 'All your other readings are nominal.' : 'All your readings are nominal.'
  return alerts ? '' : 'Nothing to act on now.'
}

function briefOn(statuses: SystemStatus[], system: string): string {
  const status = statuses[0]
  if (!status || status.state === 'no-data') return `There is no ${system} data yet.`
  if (status.state === 'stale') return `The last ${system} reading is old.`
  if (status.state === 'nominal') return `${system} is nominal: ${status.detail ?? `${status.label} ${status.value} ${status.unit}`}.`
  return speakAlerts(statuses)
}

/** Spoken level words, most severe first (ideas/alert-levels.md). */
const LEVEL_WORDS: [Rule['status'], string][] = [
  ['emergency', 'Emergency'],
  ['treat', 'Treat'],
  ['check', 'Check'],
  ['watch', 'Watch'],
]

/** Most severe first, each as the rule words it: what, the reading, why, next step, who to involve. */
function speakAlerts(statuses: SystemStatus[]): string {
  return LEVEL_WORDS.flatMap(([state, word]) => statuses.filter((s) => s.state === state).map((s) => ({ ...s, word })))
    .map(({ system, word, value, unit, rule }) => {
      const level = `${word}, ${system}.`
      if (!rule) return level
      const reading = value === undefined ? '' : ` Yours is ${value} ${unit}.`
      return `${level} ${rule.what}${reading} ${rule.why} ${rule.next} Who to involve: ${rule.tier}.`
    })
    .join(' ')
}

/** Systems without fresh data: never called nominal. */
function missingData(statuses: SystemStatus[]): string[] {
  const names = (state: SystemStatus['state']) => statuses.filter((s) => s.state === state).map((s) => s.system)
  const noData = names('no-data')
  const stale = names('stale')
  return [
    noData.length && `There is no ${list(noData, 'or')} reading yet.`,
    stale.length && `The last ${list(stale, 'and')} ${stale.length > 1 ? 'readings are' : 'reading is'} old.`,
  ].filter((line): line is string => Boolean(line))
}

/** How each routine item is spoken; a placeholder is never something to do. */
const TODO: Record<'check-in' | 'pvt', string> = {
  'check-in': 'your morning check-in',
  pvt: 'the reaction test',
}

function stillToDo(routine: RoutineItem[]): string[] {
  return routine
    .filter((item) => (item.kind === 'check-in' && item.state !== 'done') || (item.kind === 'pvt' && item.due))
    .map((item) => TODO[item.kind as keyof typeof TODO])
}

/** "a", "a and b", "a, b and c". */
function list(items: string[], last: 'and' | 'or'): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${last} ${items.at(-1)}`
}

