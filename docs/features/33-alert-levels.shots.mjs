// Retakes the screenshots in 33-alert-levels.md. Run from the repo root with Node 22 after a build:
//   target/node/node docs/features/33-alert-levels.shots.mjs        (app on :8080: mvn spring-boot:run)
//   APP_URL=http://localhost:4173/ target/node/node docs/features/33-alert-levels.shots.mjs   (npm run preview)
// The default build has DEMO_MODE on, so the detail chart spans the last minute. Device readings are written straight
// into IndexedDB: a minute of readings once a second, nominal first, then the level with one nominal blip, so the chart
// shows two runs of level points, each with one marker.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const PORT = Number(process.env.CDP_PORT ?? 9733)
const img = (name) => `docs/features/img/33-${name}.png`

/** `[secondsAgo, indicator, value, device]` once a second for the last minute; `level` from 20 s ago, `nominal` at 8 s ago. */
function minute(indicator, device, nominal, level) {
  return Array.from({ length: 60 }, (_, i) => {
    const ago = 59 - i
    return [ago, indicator, ago < 20 && ago !== 8 ? level : nominal, device]
  })
}

const LEVELS = {
  watch: { system: 'Cardiovascular', readings: [...minute('systolicMmHg', 'BP cuff', 110, 125), ...minute('diastolicMmHg', 'BP cuff', 70, 70)] },
  check: { system: 'Respiratory', readings: minute('spo2Percent', 'oximeter', 97, 92) },
  treat: { system: 'Cardiovascular', readings: [...minute('systolicMmHg', 'BP cuff', 110, 145), ...minute('diastolicMmHg', 'BP cuff', 70, 70)] },
  emergency: { system: 'Respiratory', readings: minute('spo2Percent', 'oximeter', 97, 88) },
}

async function shoot(name, observations, hash, { port, theme, height }) {
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

let port = PORT

// The dot display twin: its blue, yellow and red dots now come from the level tokens. The 90 s scenario is at
// 42 % from 6 s, 25 % from 30 s and 8 % from 40 s after the page starts.
const device = await openPage(`${APP}device/simulation`, { port: port++, height: 800, settleMs: 0 })
const started = Date.now()
for (const [name, atMs] of [['device-42pct', 12_000], ['device-25pct', 35_000], ['device-8pct', 46_000]]) {
  await device.sleep(atMs - (Date.now() - started))
  await device.shot(img(name))
}
await device.close()

for (const [level, { system, readings }] of Object.entries(LEVELS)) {
  for (const theme of ['light', 'dark']) {
    await shoot(`home-${level}-${theme}`, readings, '#/', { port: port++, theme, height: 1300 })
    await shoot(`detail-${level}-${theme}`, readings, `#/systems/${system}`, { port: port++, theme, height: 900 })
  }
}
