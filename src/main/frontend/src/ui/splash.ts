/** The launch splash stays at least this long after launch, so it reads as a splash and not a flicker. */
export const SPLASH_MIN_MS = 1200
/** Matches the opacity transition on `.splash` in base.css. */
export const SPLASH_FADE_MS = 300

/** Fades out the launch splash in index.html once the app has drawn, then removes it. */
export function dismissSplash(doc: Document, msSinceLaunch: number): void {
  const splash = doc.getElementById('splash')
  if (!splash) return
  setTimeout(() => {
    splash.classList.add('splash--leaving')
    setTimeout(() => splash.remove(), SPLASH_FADE_MS)
  }, Math.max(0, SPLASH_MIN_MS - msSinceLaunch))
}
