// Retakes the screenshots in 35-resting-hr-drift.md. App must be running from a VITE_DEMO_MODE=false build (APP_URL overrides :8080).
// Run from the repo root: target/node/node docs/features/35-resting-hr-drift.shots.mjs
// Each state gets a fresh browser profile with heart-rate check-ins written straight into IndexedDB.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/35-${name}.png`

// A fresh port per page, so a page never attaches to the previous, still-closing Chrome.
let port = 9870
/** `readings` are [days back (0 = today, UTC), UTC hour, bpm]; today's readings move to 30 min ago if that hour hasn't come yet. */
async function shoot(name, readings, hash, height = 900) {
  const page = await openPage(APP, { height, port: port++ })
  await page.evaluate(`new Promise((resolve, reject) => {
    const HOUR = 3600000, DAY = 24 * HOUR, now = Date.now(), today = Math.floor(now / DAY) * DAY
    const open = indexedDB.open('crew-health', 1)
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('checkIns', 'readwrite')
      for (const [back, hour, bpm] of ${JSON.stringify(readings)}) {
        const recordedAt = new Date(Math.min(today - back * DAY + hour * HOUR, now - (90 - hour) * 60000)).toISOString()
        tx.objectStore('checkIns').put({ id: recordedAt, recordedAt, heartRateBpm: bpm, symptoms: [], syncStatus: 'synced' })
      }
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await page.reload()
  await page.shot(img(name))
  await page.close()
}

const drift = [[2, 7, 70], [1, 7, 70], [0, 7, 70]]
await shoot('home-watch', drift, '#/', 1500)
await shoot('home-nominal', [...drift, [0, 8, 66]], '#/', 1500)
await shoot('detail-watch', [...[61, 62, 60, 63, 70, 71, 70].map((bpm, i) => [6 - i, 7, bpm]), [1, 18, 90]], '#/systems/Cardiovascular', 1100)
await shoot('home-no-data', [], '#/', 1500)
