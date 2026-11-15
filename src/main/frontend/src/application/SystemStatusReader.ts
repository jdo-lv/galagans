import type { ObservationHistory, RuleSource } from '../domain/ports'
import { CHART_WINDOW_MS, type Placeholder, type SystemDetail, type SystemStatus } from '../domain/rules'
import { byIndicator, chartPoints, evaluate } from './evaluate'

export class SystemStatusReader {
  constructor(
    private readonly rules: RuleSource,
    private readonly history: ObservationHistory,
    /** Public so the UI prints ages against the same clock the rules used. */
    readonly now: () => Date = () => new Date(),
    /** Listed after the evaluated systems; a system with rules drops its placeholder. */
    private readonly placeholders: Placeholder[] = [],
    private readonly chartWindowMs = CHART_WINDOW_MS,
  ) {}

  async read(): Promise<SystemStatus[]> {
    const [rules, observations] = await Promise.all([this.rules.load(), this.history.list()])
    const evaluated = evaluate(rules, observations, this.now())
    const covered = new Set(evaluated.map((s) => s.system))
    return [...evaluated, ...this.placeholders.filter((p) => !covered.has(p.system))]
  }

  /** Undefined for a system with no rule rows (placeholder or unknown). */
  async readDetail(system: string): Promise<SystemDetail | undefined> {
    const [rules, observations] = await Promise.all([this.rules.load(), this.history.list()])
    const rows = rules.filter((r) => r.system === system)
    if (rows.length === 0) return undefined
    const now = this.now()
    const [status] = evaluate(rows, observations, now)
    // A system with several indicators charts the one its status shows (Cabin air: CO₂, temperature or humidity).
    const groups = byIndicator(rows)
    const shown = groups.find((group) => group[0].label === status.label) ?? groups[0]
    const points = chartPoints(shown, observations, now, status.state === 'stale', this.chartWindowMs)
    return { status, rules: shown, points, windowMs: this.chartWindowMs }
  }
}
