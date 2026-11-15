export interface DotFeedListener {
  /** An accepted value, 0–100. */
  value(pct: number): void
  /** Whether the link to the server is open. */
  link(connected: boolean): void
}

/** Where the display's value comes from: the scenario on a loop, or the server's device link. */
export interface DotFeed {
  readonly simulated: boolean
  /** Starts sending to `listener`; returns the stop. */
  start(listener: DotFeedListener): () => void
}
