// Retakes the screenshots in 9-detail-screen.md. App must be running on :8080 (mvn spring-boot:run).
// Run from the repo root: target/node/node docs/features/9-detail-screen.shots.mjs
// Each state gets a fresh browser profile, with a week of SpO₂ check-ins written straight into IndexedDB.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/9-${name}.png`
const HOUR = 3_600_000
const DAY = 24 * HOUR
const week = [97, 96, 97, 95, 96, 93].map((spo2, i) => [(6 - i) * DAY - 1.5 * HOUR, spo2])

async function shoot(name, readings, hash = '#/systems/Respiratory', { height = 900, width = 1280, scheme } = {}) {
  const page = await openPage(APP, { width, height, port: 9555 })
  if (scheme) await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] })
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health', 1)
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('checkIns', 'readwrite')
      for (const [ago, spo2Percent] of ${JSON.stringify(readings)}) {
        const recordedAt = new Date(Date.now() - ago).toISOString()
        tx.objectStore('checkIns').put({ id: recordedAt, recordedAt, spo2Percent, symptoms: [], syncStatus: 'synced' })
      }
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await page.reload()
  await page.shot(img(name))
  await page.close()
}

await shoot('home', [...week, [10 * 60_000, 92]], '#/', { height: 1100 })
await shoot('caution', [...week, [10 * 60_000, 92]])
await shoot('warning', [...week, [5 * 60_000, 88]])
await shoot('nominal', [...week, [5 * 60_000, 96]])
await shoot('no-data', [])
await shoot('stale', week.map(([ago, spo2]) => [ago + DAY, spo2]))
await shoot('caution-light', [...week, [10 * 60_000, 92]], undefined, { scheme: 'light' })
await shoot('caution-phone', [...week, [10 * 60_000, 92]], undefined, { width: 390, height: 1600 })
