import type { DeviceId, DeviceSpec } from '../domain/devices'
import { deviceMessage, indicatorLevels, randomValues } from '../domain/levelValues'
import type { ReadingSource } from '../domain/ports'
import type { Rule, Status } from '../domain/rules'

const EVERY_MS = 1_000

/** MOCK_MODE: one device's synthetic messages, made in the browser at the scenario's levels, once a second while listened to. */
export class MockReadingSource implements ReadingSource {
  private readonly listeners = new Set<(message: unknown) => void>()
  private timer?: ReturnType<typeof setInterval>

  constructor(
    private readonly device: DeviceSpec,
    private readonly scenario: { levels(): Partial<Record<DeviceId, Status>> },
    private readonly rules: Rule[],
    /** In [0, 1). */
    private readonly random: () => number,
    private readonly now: () => Date,
    private readonly newId: () => string,
  ) {}

  subscribe(listener: (message: unknown) => void): () => void {
    this.listeners.add(listener)
    if (!this.timer) {
      this.emit()
      this.timer = setInterval(() => this.emit(), EVERY_MS)
    }
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size > 0) return
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  private emit(): void {
    const levels = indicatorLevels(this.scenario.levels(), this.rules)
    const message = deviceMessage(this.device, randomValues(this.device, levels, this.rules, this.random), this.now(), this.newId)
    this.listeners.forEach((listener) => listener(message))
  }
}
