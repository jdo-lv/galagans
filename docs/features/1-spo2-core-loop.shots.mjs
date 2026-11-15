// Retakes the screenshots in 1-spo2-core-loop.md. App must be running on :8080 (mvn spring-boot:run).
// Run from the repo root: target/node/node docs/features/1-spo2-core-loop.shots.mjs
import { openPage } from '../../tools/cdp.mjs'
import { saveCheckIn } from '../../tools/checkin-shots.mjs'

const img = (name) => `docs/features/img/1-${name}.png`
const page = await openPage(process.env.APP_URL ?? 'http://localhost:8080/')

// Since #29 values are entered through the check-in steps.
const save = (spo2) => saveCheckIn(page, { spo2 })

await page.shot(img('no-data'))
for (const [spo2, state] of [[96, 'nominal'], [92, 'check'], [88, 'emergency']]) {
  await save(spo2)
  await page.shot(img(state))
}

// Stale: a single reading recorded 25 h ago, written straight into the app's IndexedDB.
await page.evaluate(`new Promise((resolve, reject) => {
  const open = indexedDB.open('crew-health', 1)
  open.onerror = reject
  open.onsuccess = () => {
    const tx = open.result.transaction('checkIns', 'readwrite')
    tx.objectStore('checkIns').clear()
    tx.objectStore('checkIns').put({ id: 'stale-demo', recordedAt: new Date(Date.now() - 25 * 3600e3).toISOString(),
      spo2Percent: 88, symptoms: [], syncStatus: 'synced' })
    tx.oncomplete = () => { open.result.close(); resolve() }
  }
})`)
await page.reload()
await page.shot(img('stale'))

// Offline: the emergency still shows and the check-in waits to sync.
await page.send('Network.enable')
await page.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
await page.sleep(300)
await save(88)
await page.shot(img('offline-emergency'))

await page.close()
