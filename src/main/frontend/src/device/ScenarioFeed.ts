import type { DotFeed, DotFeedListener } from './DotFeed'
import { scenarioPctLooped } from './dotDisplay'

const EVERY_MS = 250

/** The firmware's dev mode: the 90 s scenario on a loop, no server. */
export class ScenarioFeed implements DotFeed {
  readonly simulated = true

  constructor(private readonly now: () => number = () => performance.now()) {}

  start(listener: DotFeedListener): () => void {
    const startedAt = this.now()
    const send = () => listener.value(scenarioPctLooped(this.now() - startedAt))
    send()
    const timer = setInterval(send, EVERY_MS)
    return () => clearInterval(timer)
  }
}
