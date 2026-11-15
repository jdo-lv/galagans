// Retakes the screenshots in 28-personal-baseline.md. App must be running (mvn spring-boot:run; APP_URL overrides :8080).
// Run from the repo root: target/node/node docs/features/28-personal-baseline.shots.mjs
// Each state gets a fresh browser profile with PVT results written straight into IndexedDB.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/28-${name}.png`
const MIN = 60_000
const DAY = 24 * 60 * MIN

// A fresh port per page, so a page never attaches to the previous, still-closing Chrome.
let port = 9850
async function shoot(name, pvts, hash, height = 900) {
  const page = await openPage(APP, { height, port: port++ })
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health', 1)
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('checkIns', 'readwrite')
      for (const [ago, ms] of ${JSON.stringify(pvts)}) {
        const recordedAt = new Date(Date.now() - ago).toISOString()
        tx.objectStore('checkIns').put({ id: recordedAt, recordedAt, pvtMedianMs: ms, pvtLapses: 1, pvtFalseStarts: 0, symptoms: [], syncStatus: 'synced' })
      }
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await page.reload()
  await page.shot(img(name))
  await page.close()
}

const slow = [[4 * DAY - 2 * 60 * MIN, 268], [10 * MIN, 312]]
await shoot('detail-check', slow, '#/systems/Cognition')
await shoot('detail-stale', [[4 * DAY + 2 * 60 * MIN, 312]], '#/systems/Cognition')
await shoot('home-check-305', [[10 * MIN, 305]], '#/', 1500)
