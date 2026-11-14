import type { Observation } from '../domain/observation'
import type { ObservationRepository, ReadingSource } from '../domain/ports'
import { readingSpec } from '../domain/readings'
import type { Indicator } from '../domain/rules'

const SOURCES = ['synthetic', 'replay', 'proxy']
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
/** Tolerated tablet clock skew; later readings are dropped so a skewed simulator can't create future data. */
const MAX_AHEAD_MS = 60_000

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function inRange(value: unknown, indicator: Indicator): value is number {
  const { validMin, validMax } = readingSpec(indicator)
  return typeof value === 'number' && Number.isFinite(value) && value >= validMin && value <= validMax
}

/** Receives oximeter messages from a ReadingSource, stores valid ones as Observations and tells its listeners. */
export class PersonalHealthGateway {
  private readonly listeners = new Set<() => void>()

  constructor(
    private readonly source: ReadingSource,
    private readonly repository: ObservationRepository,
    private readonly now: () => Date = () => new Date(),
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
    const { id, t, spo2_pct: spo2, pulse_bpm: pulse, src } = message
    if (typeof id !== 'string' || id === '') return []
    if (typeof t !== 'string' || !ISO_TIME.test(t)) return []
    const time = Date.parse(t)
    if (Number.isNaN(time) || time > this.now().getTime() + MAX_AHEAD_MS) return []
    if (!inRange(spo2, 'spo2Percent')) return []
    if (typeof src !== 'string' || !SOURCES.includes(src)) return []

    const observation = (indicator: Indicator, value: number): Observation => ({
      resourceType: 'Observation',
      id: `oximeter:${id}:${indicator}`,
      status: 'final',
      code: { text: indicator },
      valueQuantity: { value, unit: readingSpec(indicator).unit },
      effectiveDateTime: t,
      device: { display: `oximeter · ${src as 'synthetic' | 'replay' | 'proxy'}` },
    })
    const observations = [observation('spo2Percent', spo2)]
    if (inRange(pulse, 'heartRateBpm')) observations.push(observation('heartRateBpm', pulse))
    return observations
  }
}
