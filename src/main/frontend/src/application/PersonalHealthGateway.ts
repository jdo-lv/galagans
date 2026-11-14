import { DEVICES, type DeviceField, type DeviceSpec } from '../domain/devices'
import type { DeviceSource, Observation } from '../domain/observation'
import type { ObservationRepository, ReadingSource } from '../domain/ports'

const SOURCES = ['synthetic', 'replay', 'proxy']
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
/** Tolerated tablet clock skew; later readings are dropped so a skewed simulator can't create future data. */
const MAX_AHEAD_MS = 60_000

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function inRange(value: unknown, { validMin, validMax }: DeviceField): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= validMin && value <= validMax
}

/** Receives one device's messages from a ReadingSource, stores valid ones as Observations and tells its listeners. */
export class PersonalHealthGateway {
  private readonly listeners = new Set<() => void>()

  constructor(
    private readonly source: ReadingSource,
    private readonly repository: ObservationRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly device: DeviceSpec = DEVICES[0],
  ) {}

  start(): () => void {
    return this.source.subscribe((message) => void this.receive(message))
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private async receive(message: unknown): Promise<void> {
    const observations = this.toObservations(message)
    if (observations.length === 0) return
    try {
      for (const observation of observations) await this.repository.put(observation)
    } catch {
      return
    }
    this.listeners.forEach((listener) => listener())
  }

  private toObservations(message: unknown): Observation[] {
    if (!isObject(message)) return []
    const { id, t, src } = message
    if (typeof id !== 'string' || id === '') return []
    if (typeof t !== 'string' || !ISO_TIME.test(t)) return []
    const time = Date.parse(t)
    if (Number.isNaN(time) || time > this.now().getTime() + MAX_AHEAD_MS) return []
    if (typeof src !== 'string' || !SOURCES.includes(src)) return []

    const observations: Observation[] = []
    for (const field of this.device.fields) {
      const value = message[field.key]
      if (!inRange(value, field)) {
        if (field.required) return []
        continue
      }
      observations.push({
        resourceType: 'Observation',
        id: `${this.device.id}:${id}:${field.indicator}`,
        status: 'final',
        code: { text: field.indicator },
        valueQuantity: { value, unit: field.unit },
        effectiveDateTime: t,
        device: { display: `${this.device.label} · ${src}` as DeviceSource },
      })
    }
    return observations
  }
}
