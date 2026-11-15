// Retakes the screenshots in 7-latest-readings.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL.
// Run from the repo root: target/node/node docs/features/7-latest-readings.shots.mjs
// CDP_PORT picks another DevTools port when 9333 is taken.
import { openPage } from '../../tools/cdp.mjs'
import { saveCheckIn } from '../../tools/checkin-shots.mjs'

const img = (name) => `docs/features/img/7-${name}.png`
// Tall enough for all ten body-system rows and the whole right column.
const page = await openPage(process.env.APP_URL ?? 'http://localhost:8080/', { height: 1100, port: Number(process.env.CDP_PORT ?? 9333) })

// Since #29 values are entered through the check-in steps.
const save = (fields) => saveCheckIn(page, fields)

// Replaces the stored check-ins (written straight into the app's IndexedDB), then reloads.
const seed = async (checkIns) => {
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health', 1)
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('checkIns', 'readwrite')
      const store = tx.objectStore('checkIns')
      store.clear()
      for (const { ageMs, ...fields } of ${JSON.stringify(checkIns)}) {
        store.put({ ...fields, recordedAt: new Date(Date.now() - ageMs).toISOString(), symptoms: [], syncStatus: 'synced' })
      }
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.reload()
}

const MIN = 60e3
const HOUR = 60 * MIN
const nominal = { heartRateBpm: 63, spo2Percent: 97, sleepHours: 7, mood: 4 }

await page.shot(img('empty'))
await save({ heartRate: 63, spo2: 97, sleep: 7, mood: 4 })
await page.shot(img('nominal'))
for (const [spo2, state] of [[92, 'check'], [88, 'emergency']]) {
  await save({ spo2 })
  await page.shot(img(state))
}

// Stale: SpO₂ 88 recorded 25 h ago, the other three values 10 min ago.
await seed([
  { id: 'stale-spo2', ageMs: 25 * HOUR, spo2Percent: 88 },
  { id: 'fresh', ageMs: 10 * MIN, heartRateBpm: 63, sleepHours: 7, mood: 4 },
])
await page.shot(img('stale'))

// Nominal in both themes, switched with the header toggle (headless Chrome may start in either).
await seed([{ id: 'nominal', ageMs: 4 * MIN, ...nominal }])
for (let i = 0; i < 2; i++) {
  await page.click('button[aria-label^="Switch to"]')
  await page.shot(img(`nominal-${await page.evaluate('document.documentElement.dataset.theme')}`))
}

// Phone width: the panel stacks under Body systems, so scroll it into view.
await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1100, deviceScaleFactor: 1, mobile: true })
await page.sleep(300)
await page.evaluate(`[...document.querySelectorAll('h2')].find((h) => h.textContent === 'Latest readings').scrollIntoView()`)
await page.sleep(300)
await page.shot(img('nominal-390'))

await page.close()
