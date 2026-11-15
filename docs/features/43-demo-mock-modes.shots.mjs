// Retakes the screenshots in 43-demo-mock-modes.md. Run from the repo root with Node 22 after a build:
//   target/node/node docs/features/43-demo-mock-modes.shots.mjs        (app on :8080: mvn spring-boot:run)
//   APP_URL=http://localhost:4173/ target/node/node docs/features/43-demo-mock-modes.shots.mjs   (npm run preview)
// The default build has DEMO_MODE on. Device readings are written straight into IndexedDB; the simulator gets an
// in-page stand-in WebSocket, so its link reads "connected" without a relay.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/43-${name}.png`

const FAKE_SOCKET = `window.WebSocket = class {
  constructor(url) { this.url = url; setTimeout(() => this.onopen?.(), 50) }
  send() {}
  close() {}
}`

async function simulator(theme, port) {
  const page = await openPage(`${APP}simulator.html`, { port, height: 1560 })
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: FAKE_SOCKET })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
  await page.reload()
  const level = (device, word) =>
    page.evaluate(`[...[...document.querySelectorAll('section')].find((s) => s.querySelector('h2')?.textContent === ${JSON.stringify(device)})
      .querySelectorAll('.sim-levels button')].find((b) => b.textContent === ${JSON.stringify(word)}).click()`)
  await level('Pulse oximeter', 'Check')
  await level('Environment node', 'Watch')
  await page.sleep(2200)
  await page.shot(img(`simulator-${theme}`))
  await page.close()
}

/** Opens the app, writes device Observations `[secondsAgo, indicator, value, device]`, then shows `hash`. */
async function crew(name, observations, hash, { port, height = 900, theme = 'dark' }) {
  const page = await openPage(APP, { port, height })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health-observations', 1)
    open.onupgradeneeded = () => open.result.createObjectStore('observations', { keyPath: 'id' })
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('observations', 'readwrite')
      const now = Date.now()
      for (const [ago, indicator, value, device] of ${JSON.stringify(observations)}) {
        const t = new Date(now - ago * 1000).toISOString()
        tx.objectStore('observations').put({
          resourceType: 'Observation', id: device + ':' + t + ':' + indicator, status: 'final', code: { text: indicator },
          valueQuantity: { value, unit: '' }, effectiveDateTime: t, device: { display: device + ' · synthetic' },
        })
      }
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await page.reload()
  await page.shot(img(name))
  await page.close()
}

// SpO₂ once a second for the last minute; the last 12 s in the check band (90–93 %).
const spo2 = Array.from({ length: 60 }, (_, i) => {
  const ago = 59 - i
  const value = ago < 12 ? [92, 91, 93, 92][ago % 4] : [97, 96, 98, 97, 95, 96][ago % 6]
  return [ago, 'spo2Percent', value, 'oximeter']
})
const bp = (systolic, diastolic) => [
  [20, 'systolicMmHg', systolic, 'BP cuff'],
  [20, 'diastolicMmHg', diastolic, 'BP cuff'],
]

await simulator('light', 9961)
await simulator('dark', 9962)
await crew('respiratory-demo', spo2, '#/systems/Respiratory', { port: 9963 })
await crew('home-watch', bp(125, 75), '#/', { port: 9964, height: 1300 })
await crew('home-treat', bp(150, 85), '#/', { port: 9965, height: 1300 })
