// The browser build of mqtt has only a default export.
import mqtt from 'mqtt'
import type { ReadingSource } from '../domain/ports'

const DEFAULT_URL = 'ws://localhost:9001'
const TOPIC = 'crew/a1/oximeter'

/** MQTT over WebSocket to the local Mosquitto broker; the app works without it, so every failure is silent. */
export class MqttReadingSource implements ReadingSource {
  private readonly listeners = new Set<(message: unknown) => void>()
  private readonly url: string
  private started = false

  constructor(
    url: string | undefined = import.meta.env.VITE_MQTT_URL,
    private readonly pageProtocol: () => string = () => window.location.protocol,
  ) {
    this.url = url || DEFAULT_URL
  }

  subscribe(listener: (message: unknown) => void): () => void {
    this.listeners.add(listener)
    this.start()
    return () => this.listeners.delete(listener)
  }

  private start(): void {
    if (this.started) return
    this.started = true
    // A browser blocks ws:// from an https: page (mixed content), so no client is created there.
    if (this.pageProtocol() === 'https:' && this.url.startsWith('ws://')) return

    const client = mqtt.connect(this.url, { reconnectPeriod: 5000 })
    client.on('connect', () => client.subscribe(TOPIC, { qos: 0 }))
    client.on('message', (topic, payload) => {
      if (topic !== TOPIC) return
      let message: unknown
      try {
        message = JSON.parse(payload.toString())
      } catch {
        return
      }
      this.listeners.forEach((listener) => listener(message))
    })
    client.on('error', () => {})
  }
}
