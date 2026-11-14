// Retakes the screenshots in 29-check-in-questionnaire.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL.
// Run from the repo root: target/node/node docs/features/29-check-in-questionnaire.shots.mjs
// CDP_PORT picks another DevTools port when 9333 is taken.
import { openPage } from '../../tools/cdp.mjs'

const img = (name) => `docs/features/img/29-${name}.png`
const page = await openPage(process.env.APP_URL ?? 'http://localhost:8080/', { height: 760, port: Number(process.env.CDP_PORT ?? 9333) })
const next = () => page.click('.check-in button[type=submit]', 300)
const tap = (selector) => page.click(selector, 150)
const size = (width, height) => page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
// The toggle starts from the system theme (no data-theme yet), so click until the page shows the one asked for.
const setTheme = async (theme) => {
  for (let i = 0; i < 2 && (await page.evaluate('document.documentElement.dataset.theme')) !== theme; i++) {
    await page.click('button[aria-label^="Switch to"]', 300)
  }
}

// Home at 08:00 with no check-in today, so the routine row is due (the page's clock starts there and keeps ticking).
const target = new Date(2026, 10, 14, 8, 0).getTime()
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
await page.evaluate(`new Promise((resolve, reject) => {
  const open = indexedDB.open('crew-health', 1)
  open.onerror = reject
  open.onsuccess = () => {
    const tx = open.result.transaction('checkIns', 'readwrite')
    tx.objectStore('checkIns').clear()
    tx.oncomplete = () => { open.result.close(); resolve() }
  }
})`)
await page.reload()
await setTheme('dark')
await size(1280, 1180)
await page.shot(img('home'))

// Start opens the steps.
await page.click('.routine-item--due button', 600)
await size(1280, 760)
await page.shot(img('step-1'))
await page.fill('input[name=heartRate]', 300)
await next()
await page.shot(img('step-1-error'))
await page.fill('input[name=heartRate]', 63)
await next()
await page.fill('input[name=spo2]', 97)
await page.shot(img('step-2'))
await next()
await page.fill('input[name=sleep]', 6.5)
await page.shot(img('step-3'))
await next()
await tap('.scale li:nth-child(7) button')
await page.shot(img('step-4'))
await next()
await tap('.scale li:nth-child(4) button')
await page.shot(img('step-5'))
await next()
await tap('.choices li:nth-child(1) button')
await page.shot(img('step-6'))

// Phone width and light theme of the KSS and symptoms steps.
await size(390, 1100)
await page.sleep(300)
await page.shot(img('step-6-390'))
await page.click('.step-actions .button-secondary', 300) // ← Back to the mood step
await page.click('.step-actions .button-secondary', 300) // ← Back to the KSS step
await page.shot(img('step-4-390'))
await size(1280, 760)
await setTheme('light')
await page.shot(img('step-4-light'))
await setTheme('dark')

await page.close()
