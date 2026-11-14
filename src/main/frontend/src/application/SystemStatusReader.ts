import type { CheckInHistory, RuleSource } from '../domain/ports'
import type { SystemStatus } from '../domain/rules'
import { evaluate } from './evaluate'

export class SystemStatusReader {
  constructor(
    private readonly rules: RuleSource,
    private readonly history: CheckInHistory,
    /** Public so the UI prints ages against the same clock the rules used. */
    readonly now: () => Date = () => new Date(),
  ) {}

  async read(): Promise<SystemStatus[]> {
    const [rules, checkIns] = await Promise.all([this.rules.load(), this.history.list()])
    return evaluate(rules, checkIns, this.now())
  }
}
