// The dot display's rules, as the firmware runs them (src/main/hardware/dot-display/lib/dotcore): a 0–100 % value
// becomes 1–6 dots and an alert level (ideas/alert-levels.md), and the state becomes what the screen shows.

export const SCENARIO_MS = 90_000
export const STALE_MS = 30_000 // no value for 30 s: dots dim, the data age shows
export const CONNECT_GRACE_MS = 10_000 // after start, "Connecting..." for 10 s before NO CONNECTION
const EMERGENCY_FLASH_MS = 500 // 1 dot: 1 Hz
const NO_CONNECTION_FLASH_MS = 1000 // 1 s on, 1 s off, so it never looks like Emergency

export type DotColour = 'white' | 'blue' | 'yellow' | 'red'

export interface DotLevel {
  word: string
  colour: DotColour
  flashes: boolean
}

/** 0–16 → 1, 17–33 → 2, 34–49 → 3, 50–66 → 4, 67–83 → 5, 84–100 → 6: each sixth of the range goes up a dot. */
export function dotsFor(pct: number): number {
  return Math.min(6, Math.max(1, Math.floor((pct * 6) / 100) + 1))
}

/** A value the display accepts: a finite number from 0 to 100. */
export function validPct(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
}

const LEVELS: readonly DotLevel[] = [
  { word: 'Nominal', colour: 'white', flashes: false },
  { word: 'To do', colour: 'blue', flashes: false },
  { word: 'Watch', colour: 'white', flashes: false }, // level 2 has no colour
  { word: 'Check', colour: 'yellow', flashes: false },
  { word: 'Treat', colour: 'red', flashes: false },
  { word: 'Emergency', colour: 'red', flashes: true },
]

/** The alert level for `dots` (1–6), where dots = 6 − level. */
export function levelFor(dots: number, fourDotsYellow = false): DotLevel {
  const level = LEVELS[6 - dots]
  return dots === 4 && fourDotsYellow ? { ...level, colour: 'yellow' } : level
}

/** The 90 s demo: 6 dots; a sudden drop to 3 that holds for 24 s; 2; 1 (Emergency); a steady climb back to 6.
 *  Holds wobble ±2 like a live reading, always inside their band. Same curve as mockup 13 and the firmware. */
export function scenarioPct(t: number): number {
  const wobble = Math.round(2 * Math.sin(t * 1.3))
  if (t < 6) return Math.min(100, 92 + wobble)
  if (t < 30) return 42 + wobble
  if (t < 40) return 25 + wobble
  if (t < 52) return 8 + wobble
  const end = SCENARIO_MS / 1000
  return Math.round(8 + ((Math.min(t, end) - 52) / (end - 52)) * 84)
}

/** The scenario on a loop, `ms` after the loop started. It ends where it starts (92 %), so the loop has no jump. */
export function scenarioPctLooped(ms: number): number {
  return scenarioPct((ms % SCENARIO_MS) / 1000)
}

/** What the display knows. Times are milliseconds since the display started. */
export interface DotState {
  simulated: boolean
  connected: boolean
  everConnected: boolean
  hasValue: boolean
  pct: number
  valueAtMs: number
}

export type DotBanner = 'none' | 'connecting' | 'waiting' | 'noConnection' | 'simulated'

export interface DotView {
  lit: number // dots drawn filled; the other slots are empty rings. 0 before the first value
  colour: DotColour
  litOn: boolean // false in the dark half of the Emergency flash
  dim: boolean // the value is stale
  banner: DotBanner
  bannerOn: boolean // false in the dark half of the NO CONNECTION flash
  word: string | undefined // the level word, none before the first value
  ageS: number | undefined // the data age in seconds, shown only when stale or disconnected
}

function bannerFor(s: DotState, now: number): Pick<DotView, 'banner' | 'bannerOn'> {
  if (s.simulated) return { banner: 'simulated', bannerOn: true }
  if (!s.connected) {
    if (!s.everConnected && now < CONNECT_GRACE_MS) return { banner: 'connecting', bannerOn: true }
    return { banner: 'noConnection', bannerOn: Math.floor(now / NO_CONNECTION_FLASH_MS) % 2 === 0 }
  }
  return { banner: s.hasValue ? 'none' : 'waiting', bannerOn: true }
}

export function viewFor(s: DotState, now: number, fourDotsYellow = false): DotView {
  const banner = bannerFor(s, now)
  if (!s.hasValue) return { lit: 0, colour: 'white', litOn: true, dim: false, ...banner, word: undefined, ageS: undefined }
  const lit = dotsFor(s.pct)
  const level = levelFor(lit, fourDotsYellow)
  const ageMs = now - s.valueAtMs
  const stale = !s.simulated && ageMs > STALE_MS
  const flashOff = level.flashes && !stale && Math.floor(now / EMERGENCY_FLASH_MS) % 2 === 1
  const showAge = !s.simulated && (stale || !s.connected)
  return {
    lit,
    colour: level.colour,
    litOn: !flashOff,
    dim: stale,
    ...banner,
    word: level.word,
    ageS: showAge ? Math.floor(ageMs / 1000) : undefined,
  }
}

export function sameView(a: DotView, b: DotView): boolean {
  return (Object.keys(a) as (keyof DotView)[]).every((key) => a[key] === b[key])
}

/** "data 47 s old", "data 2 min old", "data 3 h old". */
export function dataAgeText(seconds: number): string {
  if (seconds < 60) return `data ${seconds} s old`
  if (seconds < 3600) return `data ${Math.floor(seconds / 60)} min old`
  return `data ${Math.floor(seconds / 3600)} h old`
}
