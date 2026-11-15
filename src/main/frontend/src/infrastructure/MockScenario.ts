import { DEVICES, type DeviceId } from '../domain/devices'
import { levelsFor } from '../domain/levelValues'
import type { Rule, Status } from '../domain/rules'

const EPISODE_EVERY_MS = 300_000
const EPISODE_MS = 60_000

/** The MOCK_MODE story: nominal, and every 5 min one random device at one of its non-nominal levels for 60 s. */
export class MockScenario {
  private readonly start: number
  private episode?: { index: number; levels: Partial<Record<DeviceId, Status>> }

  constructor(
    private readonly rules: Rule[],
    /** In [0, 1). */
    private readonly random: () => number,
    private readonly now: () => Date,
  ) {
    this.start = now().getTime()
  }

  levels(): Partial<Record<DeviceId, Status>> {
    const elapsed = this.now().getTime() - this.start
    const index = Math.floor(elapsed / EPISODE_EVERY_MS)
    if (index < 1 || elapsed - index * EPISODE_EVERY_MS >= EPISODE_MS) return {}
    if (this.episode?.index !== index) this.episode = { index, levels: this.pick() }
    return this.episode.levels
  }

  private pick(): Partial<Record<DeviceId, Status>> {
    const choices = DEVICES.map((device) => ({ id: device.id, levels: levelsFor(device, this.rules).filter((l) => l !== 'nominal') })).filter(
      (choice) => choice.levels.length > 0,
    )
    const { id, levels } = choices[Math.floor(this.random() * choices.length)]
    return { [id]: levels[Math.floor(this.random() * levels.length)] }
  }
}
