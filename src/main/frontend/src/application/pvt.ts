// PVT-B: research/health-indicators.md §13 "Attention" and the PVT-B row of "Questionnaires and simple tests" [S28][S30].
export const PVT_DURATION_MS = 180_000
export const INTERVAL_MIN_MS = 2000
export const INTERVAL_SPAN_MS = 3000
export const LAPSE_MS = 355
export const FALSE_START_MS = 130
/** Data sanity limit, not a medical threshold: a longer median means a broken session. */
export const MEDIAN_MAX_MS = 10_000

export type PvtTrial = { rtMs: number; unanswered?: true } | { falseStart: true }

/** `responses` counts answered valid trials only. */
export interface PvtScore {
  medianMs: number
  lapses: number
  falseStarts: number
  responses: number
}

export type PvtResult = { kind: 'none' } | { kind: 'out-of-range'; score: PvtScore } | { kind: 'ok'; score: PvtScore }

/** Random wait before the next stimulus, `random` in [0, 1). */
export const nextIntervalMs = (random: number) => INTERVAL_MIN_MS + Math.floor(random * INTERVAL_SPAN_MS)

const isFalseStart = (trial: PvtTrial) => 'falseStart' in trial || trial.rtMs < FALSE_START_MS

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length / 2
  return Number.isInteger(mid) ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[Math.floor(mid)]
}

export function scorePvt(trials: PvtTrial[]): PvtResult {
  const valid = trials.filter((t): t is { rtMs: number; unanswered?: true } => !isFalseStart(t))
  const responses = valid.filter((t) => !t.unanswered).length
  if (responses === 0) return { kind: 'none' }
  const rts = valid.map((t) => t.rtMs)
  const score = {
    medianMs: median(rts),
    lapses: rts.filter((rt) => rt >= LAPSE_MS).length,
    falseStarts: trials.length - valid.length,
    responses,
  }
  return { kind: score.medianMs > MEDIAN_MAX_MS ? 'out-of-range' : 'ok', score }
}

/** The stimulus still showing when the test ends: a lapse if it was up long enough to be one. */
export function endTrial(stimulusAt: number | undefined, endAt: number): PvtTrial | undefined {
  if (stimulusAt === undefined) return undefined
  const rtMs = Math.round(endAt - stimulusAt)
  return rtMs >= LAPSE_MS ? { rtMs, unanswered: true } : undefined
}
