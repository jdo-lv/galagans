// Retakes the screenshots in 48-smooth-trend-chart.md.
// Needs two builds served on two ports: WEEK_URL from a `VITE_DEMO_MODE=false` build (7-day chart) and DEMO_URL from a default build
// (DEMO_MODE, 1-minute chart). Serve them offline with `cd src/main/frontend && npx vite build --outDir <dir>` and `npx vite preview --outDir <dir> --port <p>`.
// Run from the repo root with Node 22+: node docs/features/48-smooth-trend-chart.shots.mjs
// Each state gets a fresh browser profile with SpO₂ check-ins written straight into IndexedDB; the mouse is driven over DevTools.
import { openPage } from '../../tools/cdp.mjs'

const WEEK_URL = process.env.WEEK_URL ?? 'http://localhost:8080/'
const DEMO_URL = process.env.DEMO_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/48-${name}.png`
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const week = [97, 96, 97, 95, 96, 97, 96, 95, 97, 96, 97, 93].map((spo2, i, all) => [(all.length - i) * 14 * HOUR, spo2])
const weekReadings = [...week, [10 * MINUTE, 92]]
const minuteReadings = [[56 * SECOND, 97], [48 * SECOND, 96], [40 * SECOND, 97], [32 * SECOND, 96], [24 * SECOND, 93], [14 * SECOND, 92], [6 * SECOND, 92]]

let port = 9640
/** `hoverIndex`: which `circle.chart-point` the mouse moves to, negative from the end (omit for no hover). */
async function shoot(name, url, readings, { hoverIndex, scheme = 'dark' } = {}) {
  const page = await openPage(url, { width: 1280, height: 900, port: port++ })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] })
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
  await page.evaluate(`location.hash = '#/systems/Respiratory'`)
  await page.reload()
  if (hoverIndex !== undefined) {
    const at = await page.evaluate(`(() => {
      const r = [...document.querySelectorAll('circle.chart-point')].at(${hoverIndex}).getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })()`)
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y, pointerType: 'mouse' })
    await page.sleep(400)
  }
  await page.shot(img(name))
  await page.close()
}

await shoot('week-dark-idle', WEEK_URL, weekReadings)
await shoot('week-dark-hover-check', WEEK_URL, weekReadings, { hoverIndex: -1 })
await shoot('week-light-hover-nominal', WEEK_URL, weekReadings, { hoverIndex: 4, scheme: 'light' })
await shoot('minute-dark-hover', DEMO_URL, minuteReadings, { hoverIndex: 4 })
await shoot('minute-light-hover', DEMO_URL, minuteReadings, { hoverIndex: 2, scheme: 'light' })
