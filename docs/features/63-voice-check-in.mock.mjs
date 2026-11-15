// Issue #63 mock: the check-in's step 1 prefilled from the oximeter (#55) while voice runs it ("Voice: listening").
// The voice states are set in the DOM, so no voice host is needed. Run from the repo root with Node 22, dev server up:
//   APP_URL=http://localhost:5173/ target/node/node docs/features/63-voice-check-in.mock.mjs
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173/'
const page = await openPage(APP, { width: 1280, height: 800, port: Number(process.env.CDP_PORT ?? 9334) })
await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
await page.evaluate(`new Promise((resolve, reject) => {
  const open = indexedDB.open('crew-health-observations', 1)
  open.onupgradeneeded = () => open.result.createObjectStore('observations', { keyPath: 'id' })
  open.onerror = reject
  open.onsuccess = () => {
    const tx = open.result.transaction('observations', 'readwrite')
    for (const [ago, indicator, value, unit] of [[125, 'heartRateBpm', 63, 'bpm'], [65, 'spo2Percent', 97, '%']]) {
      tx.objectStore('observations').put({
        resourceType: 'Observation', id: 'oximeter:mock-' + ago + ':' + indicator, status: 'final', code: { text: indicator },
        valueQuantity: { value, unit }, effectiveDateTime: new Date(Date.now() - ago * 1000).toISOString(),
        device: { display: 'oximeter · synthetic' },
      })
    }
    tx.oncomplete = () => { open.result.close(); resolve() }
  }
})`)
await page.evaluate(`location.hash = '#/check-in'`)
await page.reload()
// Voice on: the mic pressed and the pill as VoicePill renders it.
await page.evaluate(`(() => {
  const mic = document.querySelector('button[aria-label="Voice control"]')
  mic.setAttribute('aria-pressed', 'true')
  const pill = document.createElement('span')
  pill.className = 'pill'
  pill.setAttribute('role', 'status')
  const icon = mic.querySelector('svg').cloneNode(true)
  icon.setAttribute('width', '18')
  icon.setAttribute('height', '18')
  const label = document.createElement('span')
  label.textContent = 'Voice: listening'
  pill.append(icon, label)
  document.querySelector('.pill-row').append(pill)
})()`)
await page.sleep(300)
await page.shot('docs/features/img/63-mock.png')
await page.close()
