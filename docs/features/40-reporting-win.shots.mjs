// Retakes the screenshots in 40-reporting-win.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL.
// Run from the repo root: target/node/node docs/features/40-reporting-win.shots.mjs
// CDP_PORT picks another DevTools port when 9333 is taken.
import { openPage } from '../../tools/cdp.mjs'

const img = (name) => `docs/features/img/40-${name}.png`
const page = await openPage(process.env.APP_URL ?? 'http://localhost:8080/', { height: 1100, port: Number(process.env.CDP_PORT ?? 9333) })
const next = (waitMs = 250) => page.click('.check-in button[type=submit]', waitMs)
const tap = (n) => page.click(`.choices li:nth-child(${n}) button`, 150)
const size = (width, height) => page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
const setTheme = async (theme) => {
  for (let i = 0; i < 2 && (await page.evaluate('document.documentElement.dataset.theme')) !== theme; i++) {
    await page.click('button[aria-label^="Switch to"]', 300)
  }
}
// Symptom buttons in checklist order.
const HEADACHE = 1
const SWELLING = 4
const NONE = 6

// 14 Nov 2026 08:05 on the page's clock, so the app's synthetic history ends on 13 Nov.
const target = new Date(2026, 10, 14, 8, 5).getTime()
await page.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const Real = Date
    const offset = ${target} - Real.now()
    window.Date = class extends Real {
      constructor(...args) { args.length ? super(...args) : super(Real.now() + offset) }
      static now() { return Real.now() + offset }
    }
  })()`,
})

/** Empties the check-in store, puts `records` in it, and reloads home. */
async function resetTo(records = []) {
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health', 1)
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('checkIns', 'readwrite')
      tx.objectStore('checkIns').clear()
      for (const r of ${JSON.stringify(records)}) tx.objectStore('checkIns').put(r)
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.evaluate(`location.hash = '#/'`)
  await page.reload()
}

/** Opens the check-in, fills `values` (or passes each step), presses symptom buttons, saves. */
async function checkIn(symptoms, values) {
  await page.evaluate(`location.hash = '#/check-in'`)
  await page.sleep(500)
  for (const name of ['heartRate', 'spo2', 'sleep']) {
    if (values) await page.fill(`input[name=${name}]`, values[name])
    await next()
  }
  for (const name of ['kss', 'mood']) {
    if (values) await page.click(`.scale li:nth-child(${values[name]}) button`, 100)
    await next()
  }
  for (const n of symptoms) await tap(n)
  await next(1200) // "Save check-in"
}

const values = { heartRate: 63, spo2: 97, sleep: 6.5, kss: 7, mood: 4 }
const headacheOn = (day) => ({
  id: `shot-${day}`,
  recordedAt: new Date(2026, 10, day, 8, 0).toISOString(),
  symptoms: ['headache'],
  symptomsAnswered: true,
  syncStatus: 'synced',
})

await setTheme('dark')
await size(1280, 1100)

await resetTo()
await checkIn([HEADACHE], values)
await page.shot(img('symptom'))

await resetTo()
await checkIn([HEADACHE, SWELLING])
await page.shot(img('swelling'))

await resetTo()
await checkIn([NONE])
await page.shot(img('none'))

await resetTo()
await checkIn([])
await page.shot(img('not-answered'))

await resetTo([headacheOn(12), headacheOn(13)])
await checkIn([HEADACHE])
await page.shot(img('day-n'))

await resetTo()
await size(390, 1900)
await setTheme('light')
await checkIn([HEADACHE], values)
await page.shot(img('symptom-390'))
await setTheme('dark')

await page.close()
