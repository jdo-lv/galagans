import type { ReadingSource } from '../domain/ports'
import type { DeviceLink } from './DeviceLink'

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** One topic's payloads from the device link; the app works without it, so a bad frame is dropped silently. */
export class WebSocketReadingSource implements ReadingSource {
  private readonly listeners = new Set<(message: unknown) => void>()
  private started = false

  constructor(
    private readonly link: DeviceLink,
    private readonly topic = 'crew/a1/oximeter',
  ) {}

  subscribe(listener: (message: unknown) => void): () => void {
    this.listeners.add(listener)
    this.start()
    return () => this.listeners.delete(listener)
  }

  private start(): void {
    if (this.started) return
    this.started = true
    this.link.onFrame((frame) => {
      let envelope: unknown
      try {
        envelope = JSON.parse(frame)
      } catch {
        return
      }
      if (!isObject(envelope) || envelope.topic !== this.topic || !Object.hasOwn(envelope, 'payload')) return
      this.listeners.forEach((listener) => listener(envelope.payload))
    })
    this.link.start()
  }
}
