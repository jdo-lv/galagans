import type { CheckInHistory, RuleSource } from '../domain/ports'
import type { Placeholder, SystemStatus } from '../domain/rules'
import { evaluate } from './evaluate'

export class SystemStatusReader {
  constructor(
    private readonly rules: RuleSource,
    private readonly history: CheckInHistory,
    /** Public so the UI prints ages against the same clock the rules used. */
    readonly now: () => Date = () => new Date(),
    /** Listed after the evaluated systems; a system with rules drops its placeholder. */
    private readonly placeholders: Placeholder[] = [],
  ) {}

  async read(): Promise<SystemStatus[]> {
    const [rules, checkIns] = await Promise.all([this.rules.load(), this.history.list()])
    const evaluated = evaluate(rules, checkIns, this.now())
    const covered = new Set(evaluated.map((s) => s.system))
    return [...evaluated, ...this.placeholders.filter((p) => !covered.has(p.system))]
  }
}
