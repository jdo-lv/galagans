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

export function formatOldAge(recordedAt: string, now: Date): string {
  return formatAge(recordedAt, now).replace(/ ago$/, ' old')
}

export function formatStaleAge(recordedAt: string, now: Date): string {
  return `data ${formatOldAge(recordedAt, now)}`
}

/** A delay as whole minutes and two-digit seconds: "14 min 05 s". */
export function formatDelay(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`
}

/** Local time as zero-padded 24-h "HH:MM". */
export function formatTime(recordedAt: string): string {
  const d = new Date(recordedAt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** A local calendar date "YYYY-MM-DD" as "14 Nov". */
export function formatDay(date: string): string {
  return `${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7)) - 1]}`
}

/** Whole seconds as "48 s", or "1 min 22 s" from a minute on; negative reads 0 s. */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return seconds < 60 ? `${seconds} s` : formatDelay(seconds * 1000)
}
