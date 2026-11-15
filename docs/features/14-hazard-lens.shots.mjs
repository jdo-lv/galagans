// Retakes the screenshots in 14-hazard-lens.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL.
// Run from the repo root: target/node/node docs/features/14-hazard-lens.shots.mjs
// Each state gets a fresh browser profile: one SpO₂ check-in written into IndexedDB, the hazard and theme into localStorage.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/14-${name}.png`

async function shoot(name, { spo2 = 97, hazard, theme = 'light', width = 1280, height = 1100, scrollTo } = {}) {
  const page = await openPage(APP, { width, height, port: 9556 })
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health', 1)
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('checkIns', 'readwrite')
      const recordedAt = new Date(Date.now() - 10 * 60_000).toISOString()
      tx.objectStore('checkIns').put({ id: recordedAt, recordedAt, spo2Percent: ${spo2}, symptoms: [], syncStatus: 'synced' })
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.evaluate(`localStorage.setItem('crew-health.theme', ${JSON.stringify(theme)})`)
  if (hazard) await page.evaluate(`localStorage.setItem('crew-health.hazard-lens', ${JSON.stringify(hazard)})`)
  await page.reload()
  if (scrollTo) {
    await page.evaluate(`document.querySelector(${JSON.stringify(scrollTo)}).scrollIntoView()`)
    await page.sleep(300)
  }
  await page.shot(img(name))
  await page.close()
}

await shoot('off')
await shoot('hostile-check', { spo2: 92, hazard: 'hostile', theme: 'dark' })
await shoot('gravity-emergency', { spo2: 88, hazard: 'gravity' })
await shoot('distance-1200', { spo2: 92, hazard: 'distance', width: 1200 })
await shoot('radiation-900', { hazard: 'radiation', width: 900, height: 1900 })
await shoot('hostile-390-light', { spo2: 92, hazard: 'hostile', width: 390, height: 1300, scrollTo: '.lens' })
await shoot('hostile-390-dark', { spo2: 92, hazard: 'hostile', theme: 'dark', width: 390, height: 1300, scrollTo: '.lens' })
