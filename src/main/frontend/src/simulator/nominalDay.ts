const EVERY_MS = 60_000

/** Ticks at once, then every minute (the idea: "readings every minute"); returns the stop function. */
export function startNominalDay(tick: () => void): () => void {
  tick()
  const timer = setInterval(tick, EVERY_MS)
  return () => clearInterval(timer)
}
