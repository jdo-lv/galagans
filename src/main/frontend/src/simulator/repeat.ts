/** Ticks at once, then every `everyMs`; returns the stop function. */
export function startRepeating(tick: () => void, everyMs: number): () => void {
  tick()
  const timer = setInterval(tick, everyMs)
  return () => clearInterval(timer)
}
