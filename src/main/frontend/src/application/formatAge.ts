const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatAge(recordedAt: string, now: Date): string {
  const ms = now.getTime() - new Date(recordedAt).getTime()
  if (ms < MINUTE) return 'just now'
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)} min ago`
  if (ms < DAY) return `${Math.floor(ms / HOUR)} h ago`
  return `${Math.floor(ms / DAY)} d ago`
}

export function formatStaleAge(recordedAt: string, now: Date): string {
  return `data ${formatAge(recordedAt, now).replace(/ ago$/, ' old')}`
}
