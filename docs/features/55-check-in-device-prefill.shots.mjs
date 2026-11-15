// Retakes the screenshots in 55-check-in-device-prefill.md. Run from the repo root with Node 22 after a build:
//   target/node/node docs/features/55-check-in-device-prefill.shots.mjs        (app on :8080: mvn spring-boot:run)
//   APP_URL=http://localhost:4173/ target/node/node docs/features/55-check-in-device-prefill.shots.mjs   (npm run preview)
// CDP_PORT picks another DevTools port when 9333 is taken. Oximeter readings are written straight into IndexedDB, the way
// the gateway stores them, so no device may publish on the relay while it runs.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const PORT = Number(process.env.CDP_PORT ?? 9333)
const img = (name) => `docs/features/img/55-${name}.png`

const FRESH = [[125, 'heartRateBpm', 63, 'bpm'], [65, 'spo2Percent', 97, '%']]
const OLD = [[20 * 60, 'heartRateBpm', 63, 'bpm']]

/** Opens the check-in with `[secondsAgo, indicator, value, unit]` oximeter readings stored. */
async function openCheckIn(readings, { theme = 'dark', width = 1280, height = 800 } = {}) {
  const page = await openPage(APP, { width, height, port: PORT })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health-observations', 1)
    open.onupgradeneeded = () => open.result.createObjectStore('observations', { keyPath: 'id' })
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('observations', 'readwrite')
      for (const [ago, indicator, value, unit] of ${JSON.stringify(readings)}) {
        const t = new Date(Date.now() - ago * 1000).toISOString()
        tx.objectStore('observations').put({
          resourceType: 'Observation', id: 'oximeter:shot-' + ago + ':' + indicator, status: 'final', code: { text: indicator },
          valueQuantity: { value, unit }, effectiveDateTime: t, device: { display: 'oximeter · synthetic' },
        })
      }
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.evaluate(`location.hash = '#/check-in'`)
  await page.reload()
  return page
}

// Dark at 1280 px: step 1 and step 2 prefilled, then step 1 corrected to 70.
let page = await openCheckIn(FRESH)
await page.shot(img('step-1'))
await page.click('.check-in button[type=submit]', 400)
await page.shot(img('step-2'))
await page.click('.step-actions .button-secondary', 400) // ← Back
await page.fill('input[name=heartRate]', 70)
await page.sleep(200)
await page.shot(img('step-1-corrected'))
await page.close()

// Only a heart rate 20 min old: past the 15 min limit, so step 1 opens empty.
page = await openCheckIn(OLD)
await page.shot(img('step-1-no-fresh-reading'))
await page.close()

page = await openCheckIn(FRESH, { theme: 'light' })
await page.shot(img('step-1-light'))
await page.close()

page = await openCheckIn(FRESH, { width: 390, height: 1100 })
await page.shot(img('step-1-390'))
await page.close()
