import type { DeviceLink, LinkState } from '../infrastructure/DeviceLink'
import type { Publisher } from './Publisher'

export class WebSocketPublisher implements Publisher {
  constructor(private readonly link: DeviceLink) {
    link.start()
  }

  get url(): string {
    return this.link.url
  }

  publish(topic: string, payload: object): boolean {
    return this.link.send(JSON.stringify({ topic, payload }))
  }

  onState(listener: (state: LinkState) => void): () => void {
    return this.link.onState(listener)
  }
}
