import type { LinkState } from '../infrastructure/DeviceLink'

export interface Publisher {
  /** Returns false, without sending or queueing, unless the link is connected. */
  publish(topic: string, payload: object): boolean
  onState(listener: (state: LinkState) => void): () => void
  readonly url: string
}
