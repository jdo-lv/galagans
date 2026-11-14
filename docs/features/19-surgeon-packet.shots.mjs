// Retakes the screenshots in 19-surgeon-packet.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL
// (`npm run preview` works too: /api isn't needed, every state is seeded or offline).
// Run from the repo root: target/node/node docs/features/19-surgeon-packet.shots.mjs
// CDP_PORT picks the first DevTools port (each page takes the next one).
import { writeFileSync } from 'node:fs'
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/19-${name}.png`
let port = Number(process.env.CDP_PORT ?? 9333)

// Local times on 14 Nov 2026, like the mock.
const at = (h, m, day = 14) => new Date(2026, 10, day, h, m).toISOString()

const CHECK_INS = [
  { id: 'c-0725', recordedAt: at(7, 25), spo2Percent: 92, heartRateBpm: 63, sleepHours: 5.5 },
  { id: 'c-pvt', recordedAt: at(7, 5), pvtMedianMs: 268, pvtLapses: 0, pvtFalseStarts: 0 },
  { id: 'c-old', recordedAt: at(7, 10, 12), mood: 3 },
].map((c) => ({ symptoms: [], syncStatus: 'synced', ...c }))

const NOTE = 'Headache started yesterday afternoon in the hab module. Slept badly two nights.'
const SENT = { id: 'p1', builtAt: at(7, 31), oneWayDelayMs: 845_000, note: NOTE, items: [], state: 'sent', sentAt: at(7, 31) }

const put = (db, store, records) => `new Promise((resolve, reject) => {
  const open = indexedDB.open(${JSON.stringify(db)}, 1)
  open.onerror = reject
  open.onsuccess = () => {
    const tx = open.result.transaction(${JSON.stringify(store)}, 'readwrite')
    for (const record of ${JSON.stringify(records)}) tx.objectStore(${JSON.stringify(store)}).put(record)
    tx.oncomplete = () => { open.result.close(); resolve() }
  }
})`

// The page's clock starts at 14 Nov h:m and keeps ticking; `offline` makes navigator.onLine false.
const bootScript = ({ h, m, offline }) => `(() => {
  const Real = Date
  const offset = ${new Date(2026, 10, 14, h, m).getTime()} - Real.now()
  window.Date = class extends Real {
    constructor(...args) { args.length ? super(...args) : super(Real.now() + offset) }
    static now() { return Real.now() + offset }
  }
  ${offline ? "Object.defineProperty(Navigator.prototype, 'onLine', { get: () => false })" : ''}
})()`

/** Opens #/packet with the check-ins and packets seeded, at the given clock, theme and width. */
async function open({ clock, packets = [], theme = 'dark', width = 1280, height = 1000, offline = false }) {
  const page = await openPage(APP, { width, height, port: port++ })
  // The first load created both databases; seed them, then reload into the packet screen.
  await page.evaluate(put('crew-health', 'checkIns', CHECK_INS))
  await page.evaluate(put('crew-health-packets', 'packets', packets))
  await page.evaluate(`localStorage.setItem('crew-health.theme', ${JSON.stringify(theme)}); location.hash = '#/packet'`)
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: bootScript({ ...clock, offline }) })
  await page.reload()
  return page
}

const typeNote = (page, text) =>
  page.evaluate(`(() => {
    const note = document.querySelector('textarea')
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(note, ${JSON.stringify(text)})
    note.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)

const clickButton = (page, text) =>
  page.evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent.startsWith(${JSON.stringify(text)})).click()`)

/** Screenshot of one element, `margin` px around it. */
async function shotOf(page, selector, path, margin = 16) {
  const box = await page.evaluate(`(() => {
    const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect()
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }
  })()`)
  const clip = { x: box.x - margin, y: box.y - margin, width: box.width + 2 * margin, height: box.height + 2 * margin, scale: 1 }
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true })
  writeFileSync(path, Buffer.from(data, 'base64'))
}

// No packet yet: the live contents with the SpO₂ caution row, then the confirm step.
let page = await open({ clock: { h: 7, m: 31 } })
await page.shot(img('no-packet'))
await shotOf(page, '.packet-table', img('caution-row'))
await typeNote(page, NOTE)
await clickButton(page, 'Send packet')
await page.sleep(300)
await page.shot(img('confirm'))
await page.close()

// Offline: Confirm send queues the packet, which waits for the ground link.
page = await open({ clock: { h: 7, m: 31 }, offline: true })
await typeNote(page, NOTE)
await clickButton(page, 'Send packet')
await page.sleep(300)
await clickButton(page, 'Confirm send')
await page.sleep(800)
await page.shot(img('queued-offline'))
await page.close()

// Sent at 07:31: in transit at 07:35 with the next note drafted (the mock's state), arrived from 07:45:05.
page = await open({ clock: { h: 7, m: 35 }, packets: [SENT] })
await typeNote(page, NOTE)
await page.sleep(200)
await page.shot(img('in-transit'))
await page.close()

page = await open({ clock: { h: 7, m: 46 }, packets: [SENT] })
await page.shot(img('arrived'))
await page.close()

page = await open({ clock: { h: 7, m: 35 }, packets: [SENT], theme: 'light' })
await typeNote(page, NOTE)
await page.sleep(200)
await page.shot(img('in-transit-light'))
await page.close()

page = await open({ clock: { h: 7, m: 35 }, packets: [SENT], theme: 'light', width: 390, height: 2000 })
await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 2000, deviceScaleFactor: 1, mobile: true })
await page.sleep(300)
await page.shot(img('in-transit-390'))
await page.close()
